export const welcomeTemplate = (user) => ({
  subject: 'Welcome to Kojo Admin - Your Account is Ready',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Kojo Admin</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .welcome-box { background-color: white; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .features { background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Kojo Admin!</h1>
          <p>Your admin account is now active</p>
        </div>
        
        <div class="content">
          <p>Hello ${user.firstName} ${user.lastName},</p>
          
          <p>Welcome to the Kojo Admin platform! Your administrator account has been successfully created and is now ready to use.</p>
          
          <div class="welcome-box">
            <h3>Getting Started:</h3>
            <ul>
              <li>Access your dashboard to manage users and bookings</li>
              <li>Set up your booking schedules and time slots</li>
              <li>Monitor enquiries and collaboration requests</li>
              <li>Configure system settings and preferences</li>
            </ul>
          </div>
          
          <div class="features">
            <h3>Key Features Available:</h3>
            <p>✅ User Management<br>
            ✅ Booking System<br>
            ✅ Schedule Management<br>
            ✅ Enquiry Management<br>
            ✅ Collaboration Tracking<br>
            ✅ Notification System</p>
          </div>
          
          <p>If you need any assistance getting started, our support team is here to help.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Access Dashboard</a>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated email from Kojo Admin.</p>
          <p>© ${new Date().getFullYear()} Kojo Admin. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Hello ${user.firstName} ${user.lastName},

Welcome to the Kojo Admin platform! Your administrator account has been successfully created and is now ready to use.

Getting Started:
- Access your dashboard to manage users and bookings
- Set up your booking schedules and time slots
- Monitor enquiries and collaboration requests
- Configure system settings and preferences

Key Features Available:
✅ User Management
✅ Booking System
✅ Schedule Management
✅ Enquiry Management
✅ Collaboration Tracking
✅ Notification System

If you need any assistance getting started, our support team is here to help.

Visit: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

Best regards,
Kojo Admin Team

This is an automated email from Kojo Admin.
© ${new Date().getFullYear()} Kojo Admin. All rights reserved.
  `
});
