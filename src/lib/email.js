import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTPEmail(email, firstName, otp) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${process.env.FROM_EMAIL}`,
      to: [email],
      subject: 'Your KojoPlus Login Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>KojoPlus Login Verification</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .otp-box { background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px; margin: 10px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #1f2937; margin: 0;">KojoPlus</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Authentication Required</p>
            </div>
            
            <h2 style="color: #1f2937;">Hello ${firstName},</h2>
            
            <p style="color: #374151; line-height: 1.6;">
              You're almost in! To complete your login to KojoPlus, please enter the verification code below:
            </p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #6b7280;">Your verification code is:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">This code will expire in 10 minutes</p>
            </div>
            
            <p style="color: #374151; line-height: 1.6;">
              If you didn't request this login, please ignore this email or contact support if you have concerns.
            </p>
            
            <div class="footer">
              <p>This is an automated message from KojoPlus.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        KojoPlus - Login Verification
        
        Hello ${firstName},
        
        You're almost in! To complete your login to KojoPlus, please enter the verification code below:
        
        Verification Code: ${otp}
        
        This code will expire in 10 minutes.
        
        If you didn't request this login, please ignore this email or contact support if you have concerns.
        
        This is an automated message from KojoPlus.
      `
    });

    if (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
}

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
