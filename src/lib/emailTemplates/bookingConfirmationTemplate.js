export const bookingConfirmationTemplate = (booking) => ({
  subject: `Booking Confirmed - ${booking.sessionType} Session`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation - Kojo Admin</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .booking-box { background-color: white; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .booking-details { background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Confirmed!</h1>
          <p>Your session has been scheduled</p>
        </div>
        
        <div class="content">
          <p>Dear ${booking.customerName},</p>
          
          <p>Great news! Your booking has been confirmed. We're looking forward to meeting with you.</p>
          
          <div class="booking-details">
            <h3>Booking Details:</h3>
            <p><strong>Session Type:</strong> ${booking.sessionType}</p>
            <p><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
            <p><strong>Time:</strong> ${booking.timeRange.start} - ${booking.timeRange.end}</p>
            <p><strong>Status:</strong> Confirmed</p>
          </div>
          
          <div class="booking-box">
            <h3>What's Next?</h3>
            <p>• Please arrive 5 minutes early for your session</p>
            <p>• Bring any relevant documents or questions</p>
            <p>• Check your email for any updates</p>
            <p>• Contact us if you need to reschedule</p>
          </div>
          
          <p>If you need to make changes to your booking or have any questions, please don't hesitate to contact us.</p>
          
          <div style="text-align: center;">
            <a href="mailto:support@kojoadmin.com" class="button">Contact Support</a>
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
Dear ${booking.customerName},

Great news! Your booking has been confirmed. We're looking forward to meeting with you.

Booking Details:
Session Type: ${booking.sessionType}
Date: ${new Date(booking.bookingDate).toLocaleDateString()}
Time: ${booking.timeRange.start} - ${booking.timeRange.end}
Status: Confirmed

What's Next?
• Please arrive 5 minutes early for your session
• Bring any relevant documents or questions
• Check your email for any updates
• Contact us if you need to reschedule

If you need to make changes to your booking or have any questions, please don't hesitate to contact us.

Best regards,
Kojo Admin Team

This is an automated email from Kojo Admin.
© ${new Date().getFullYear()} Kojo Admin. All rights reserved.
  `
});
