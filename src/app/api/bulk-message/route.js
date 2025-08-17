import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Notification from '@/models/Notification';
import emailService from '@/lib/emailService';


export async function POST(request) {
  try {
    await connectDB();

    const { type, subject, message, priority, targetGroup } = await request.json();

    // Validate input
    if (!type || !subject || !message || !targetGroup) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build user query based on target group
    let userQuery = {};
    switch (targetGroup) {
      case 'active':
        userQuery = { isActive: true };
        break;
      case 'verified':
        userQuery = { emailVerified: true };
        break;
      case 'all':
      default:
        userQuery = {}; // All users
        break;
    }

    // Fetch target users
    const users = await User.find(userQuery).select('_id email firstName lastName emailVerified isActive');

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No users found matching the criteria' },
        { status: 400 }
      );
    }

    let emailsSent = 0;
    let notificationsSent = 0;
    const errors = [];

    // Send emails if type is 'email' or 'both'
    if (type === 'email' || type === 'both') {
      const emailPromises = users.map(async (user) => {
        try {
          const htmlContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>${subject}</title>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { padding: 30px 20px; background: #f9f9f9; }
                  .message { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
                  .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                  .priority { 
                    display: inline-block; 
                    padding: 4px 8px; 
                    border-radius: 4px; 
                    font-size: 12px; 
                    font-weight: bold;
                    margin-bottom: 10px;
                  }
                  .priority-urgent { background: #fee2e2; color: #dc2626; }
                  .priority-high { background: #fed7aa; color: #ea580c; }
                  .priority-medium { background: #dbeafe; color: #2563eb; }
                  .priority-low { background: #f3f4f6; color: #6b7280; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Message from Kojo Admin</h1>
                  </div>
                  <div class="content">
                    <h2>Hello ${user.firstName || 'User'},</h2>
                    <div class="message">
                      ${priority !== 'medium' ? `<div class="priority priority-${priority}">${priority.toUpperCase()} PRIORITY</div>` : ''}
                      <h3>${subject}</h3>
                      <p>${message.replace(/\n/g, '<br>')}</p>
                    </div>
                    <p>Best regards,<br>The Kojo Team</p>
                  </div>
                  <div class="footer">
                    <p>This email was sent from Kojo Admin Panel</p>
                    <p>© ${new Date().getFullYear()} Kojo. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
          `;

          const result = await emailService.sendNotificationEmail(user.email, subject, htmlContent, true);
          if (result.success) {
            emailsSent++;
          } else {
            errors.push(`Email failed for ${user.email}: ${result.error}`);
          }
        } catch (error) {
          errors.push(`Email error for ${user.email}: ${error.message}`);
        }
      });

      await Promise.allSettled(emailPromises);
    }

    // Send in-app notifications if type is 'notification' or 'both'
    if (type === 'notification' || type === 'both') {
      const notificationPromises = users.map(async (user) => {
        try {
          await Notification.createNotification({
            userId: user._id,
            type: 'message',
            title: subject,
            message: message,
            priority: priority || 'medium',
            metadata: {
              sentBy: 'admin',
              source: 'bulk_message',
              targetGroup: targetGroup
            }
          });
          notificationsSent++;
        } catch (error) {
          errors.push(`Notification error for user ${user._id}: ${error.message}`);
        }
      });

      await Promise.allSettled(notificationPromises);
    }

    // Log the bulk message send
    console.log(`Bulk message sent - Target: ${targetGroup}, Users: ${users.length}, Emails: ${emailsSent}, Notifications: ${notificationsSent}`);

    return NextResponse.json({
      success: true,
      message: 'Bulk message sent successfully',
      sentCount: users.length,
      emailsSent,
      notificationsSent,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error sending bulk message:', error);
    return NextResponse.json(
      { error: 'Failed to send bulk message' },
      { status: 500 }
    );
  }
}
