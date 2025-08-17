export const enquiryResolvedTemplate = (enquiry, response) => ({
  subject: `Re: ${enquiry.subject} - Your enquiry has been resolved`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Enquiry Resolved - Kojo Admin</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .response-box { background-color: white; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .enquiry-details { background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Enquiry Has Been Resolved</h1>
          <p>Kojo Admin Support Team</p>
        </div>
        
        <div class="content">
          <p>Dear ${enquiry.firstName} ${enquiry.lastName},</p>
          
          <p>Thank you for contacting us. We're pleased to inform you that your enquiry has been resolved by our support team.</p>
          
          <div class="enquiry-details">
            <h3>Your Original Enquiry:</h3>
            <p><strong>Subject:</strong> ${enquiry.subject}</p>
            <p><strong>Type:</strong> ${enquiry.enquiryType}</p>
            <p><strong>Submitted:</strong> ${new Date(enquiry.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p><strong>Message:</strong></p>
            <p style="background-color: white; padding: 10px; border-radius: 4px; font-style: italic;">${enquiry.message}</p>
          </div>
          
          <div class="response-box">
            <h3>Our Response:</h3>
            <p>${response.responseMessage.replace(/\n/g, '<br>')}</p>
            <p style="margin-top: 15px; color: #6b7280; font-size: 14px;">
              <strong>Responded by:</strong> ${response.respondedBy}<br>
              <strong>Date:</strong> ${new Date(response.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          
          <p>We hope this resolves your query. If you have any additional questions or need further assistance, please don't hesitate to contact us again.</p>
          
          <div style="text-align: center;">
            <a href="mailto:support@kojoadmin.com" class="button">Contact Support</a>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated email from Kojo Admin Support Team.</p>
          <p>© ${new Date().getFullYear()} Kojo Admin. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Dear ${enquiry.firstName} ${enquiry.lastName},

Thank you for contacting us. We're pleased to inform you that your enquiry has been resolved by our support team.

Your Original Enquiry:
Subject: ${enquiry.subject}
Type: ${enquiry.enquiryType}
Submitted: ${new Date(enquiry.createdAt).toLocaleDateString()}
Message: ${enquiry.message}

Our Response:
${response.responseMessage}

Responded by: ${response.respondedBy}
Date: ${new Date(response.createdAt).toLocaleDateString()}

We hope this resolves your query. If you have any additional questions or need further assistance, please don't hesitate to contact us again.

Best regards,
Kojo Admin Support Team

This is an automated email from Kojo Admin Support Team.
© ${new Date().getFullYear()} Kojo Admin. All rights reserved.
  `
});
