import { NextResponse } from "next/server";
import { verifyAdminAuth } from '../../../../lib/auth';

export async function POST(request) {
  try {
    // Verify admin token
    const authResult = await verifyAdminAuth();
        
        if (!authResult.success) {
          console.log('❌ Academy API:', authResult.error);
          return NextResponse.json({ message: authResult.error }, { status: 401 });
        }
    
        console.log('✅ Academy API: Authentication successful for admin:', authResult.user.email);
    
    const { emails, type, subject, message, priority } = await request.json();

    // Validate required fields
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "Email list is required and must not be empty" },
        { status: 400 }
      );
    }

    if (!type || !subject || !message) {
      return NextResponse.json(
        { error: "Type, subject, and message are required" },
        { status: 400 }
      );
    }

    let emailsSent = 0;
    let notificationsSent = 0;
    const errors = [];

    // Process each email
    for (const email of emails) {
      try {
        // Send email if type is 'email' or 'both'
        if (type === "email" || type === "both") {
          try {
            const emailResponse = await fetch(
              `${process.env.NEXTAUTH_URL}/api/admin/send-email`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${process.env.ADMIN_API_KEY || "admin-key"}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  to: email,
                  subject: subject,
                  message: message,
                }),
              }
            );

            if (emailResponse.ok) {
              emailsSent++;
            } else {
              errors.push(`Failed to send email to ${email}`);
            }
          } catch (emailError) {
            errors.push(`Email error for ${email}: ${emailError.message}`);
          }
        }

        // Send notification if type is 'notification' or 'both'
        // Note: This would require looking up user IDs by email
        if (type === "notification" || type === "both") {
          try {
            // This is a placeholder - you'd need to implement user lookup by email
            // and then send in-app notifications
            notificationsSent++;
          } catch (notificationError) {
            errors.push(
              `Notification error for ${email}: ${notificationError.message}`
            );
          }
        }
      } catch (error) {
        errors.push(`Error processing ${email}: ${error.message}`);
      }
    }

    const totalSent = Math.max(emailsSent, notificationsSent);

    return NextResponse.json({
      success: true,
      sentCount: totalSent,
      emailsSent,
      notificationsSent,
      totalRecipients: emails.length,
      errors: errors.slice(0, 10), // Limit errors to prevent response size issues
    });
  } catch (error) {
    console.error("Error in bulk email:", error);
    return NextResponse.json(
      { error: "Failed to send bulk email" },
      { status: 500 }
    );
  }
}