import nodemailer from 'nodemailer';

// Create transporter based on environment
const createTransporter = () => {
  console.log('Creating email transporter...');
  
  // Always use Gmail configuration if credentials are provided
  if (process.env.NODEMAILER_EMAIL && process.env.NODEMAILER_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
      debug: process.env.NODE_ENV !== 'production',
      logger: process.env.NODE_ENV !== 'production',
    });
  } else {
    console.error('Nodemailer credentials not found in environment variables');
    throw new Error('Nodemailer credentials not configured');
  }
};

let transporter;
try {
  transporter = createTransporter();
} catch (error) {
  console.error('Failed to create nodemailer transporter:', error);
}

// Function to send OTP email via Nodemailer
export async function sendOTPEmailNodemailer(to, otpCode, userData = {}) {
  if (!transporter) {
    console.error('Nodemailer transporter not initialized');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    // Verify transporter configuration
    await transporter.verify();
    console.log('Nodemailer transporter verified successfully');

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification - KOJOFOREX</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">KOJOFOREX</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Email Verification</p>
    </div>
    
    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <h2 style="color: #1f2937; margin-top: 0;">Welcome${userData.firstName ? ` ${userData.firstName}` : ''}!</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
            Thank you for joining KOJOFOREX. To complete your registration, please verify your email address using the code below:
        </p>
        
        <div style="background: white; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
            <div style="font-size: 32px; font-weight: bold; color: #ef4444; letter-spacing: 3px; font-family: 'Courier New', monospace;">
                ${otpCode}
            </div>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>⏰ Important:</strong> This code will expire in 10 minutes for security reasons.
            </p>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            If you didn't create an account with KOJOFOREX, please ignore this email.
        </p>
        
        <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
                Best regards,<br>
                <strong style="color: #ef4444;">The KOJOFOREX Team</strong>
            </p>
        </div>
    </div>
    
    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af;">
        <p>This email was sent to ${to}</p>
        <p>© ${new Date().getFullYear()} KOJOFOREX. All rights reserved.</p>
    </div>
</body>
</html>
    `;

    const text = `
Welcome to KOJOFOREX!

Your email verification code is: ${otpCode}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
The KOJOFOREX Team
    `;
    
    const mailOptions = {
      from: {
        name: 'KOJOFOREX',
        address: process.env.NODEMAILER_FROM_EMAIL || process.env.NODEMAILER_EMAIL || 'noreply@kojoforex.com'
      },
      to: to,
      subject: 'KOJOFOREX - Email Verification Code',
      html: html,
      text: text,
      replyTo: process.env.NODEMAILER_REPLY_TO || process.env.NODEMAILER_EMAIL || 'support@kojoforex.com'
    };

    console.log('Sending OTP email to:', to);
    const result = await transporter.sendMail(mailOptions);
    
    console.log('OTP email sent successfully via Nodemailer:', {
      messageId: result.messageId,
      to: to,
      subject: mailOptions.subject
    });

    return {
      success: true,
      messageId: result.messageId,
      serviceUsed: 'nodemailer',
      previewUrl: process.env.NODE_ENV !== 'production' ? nodemailer.getTestMessageUrl(result) : null
    };
  } catch (error) {
    console.error('Error sending OTP email via Nodemailer:', error);
    return {
      success: false,
      error: error.message,
      serviceUsed: 'nodemailer'
    };
  }
}

// General email sending function for Nodemailer
export async function sendEmailViaNodemailer({ to, subject, html, text, from, replyTo }) {
  if (!transporter) {
    console.error('Nodemailer transporter not initialized');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const mailOptions = {
      from: from || {
        name: 'KOJOFOREX Admin',
        address: process.env.NODEMAILER_FROM_EMAIL || process.env.NODEMAILER_EMAIL || 'admin@kojoforex.com'
      },
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version if not provided
      replyTo: replyTo || process.env.NODEMAILER_REPLY_TO || process.env.NODEMAILER_EMAIL || 'support@kojoforex.com'
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully via Nodemailer:', {
      messageId: result.messageId,
      to: to,
      subject: subject
    });

    return {
      success: true,
      messageId: result.messageId,
      serviceUsed: 'nodemailer'
    };
  } catch (error) {
    console.error('Error sending email via Nodemailer:', error);
    return {
      success: false,
      error: error.message,
      serviceUsed: 'nodemailer'
    };
  }
}

// Admin notification email template
export async function sendAdminNotificationEmailNodemailer({ to, subject, message, priority = 'medium', from, replyTo }) {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject} - KOJOFOREX Admin</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">KOJOFOREX Admin</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Admin Notification</p>
    </div>
    
    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <div style="background: ${priority === 'urgent' ? '#fef2f2; border: 1px solid #fecaca;' : priority === 'high' ? '#fff7ed; border: 1px solid #fed7aa;' : '#f0f9ff; border: 1px solid #bae6fd;'} padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px; color: ${priority === 'urgent' ? '#dc2626' : priority === 'high' ? '#ea580c' : '#0369a1'};">
                <strong>Priority: ${priority.toUpperCase()}</strong>
            </p>
        </div>
        
        <h2 style="color: #1f2937; margin-top: 0;">${subject}</h2>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <div style="white-space: pre-wrap; font-size: 16px; line-height: 1.6;">${message}</div>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
                Sent from KOJOFOREX Admin System<br>
                <strong style="color: #ef4444;">KOJOFOREX</strong>
            </p>
        </div>
    </div>
    
    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af;">
        <p>This email was sent to ${to}</p>
        <p>© ${new Date().getFullYear()} KOJOFOREX. All rights reserved.</p>
    </div>
</body>
</html>
  `;

  const text = `
KOJOFOREX Admin Notification

Priority: ${priority.toUpperCase()}
Subject: ${subject}

Message:
${message}

---
Sent from KOJOFOREX Admin System
  `;

  return await sendEmailViaNodemailer({ to, subject, html, text, from, replyTo });
}

// Health check function for Nodemailer
export function verifyNodemailerConfiguration() {
  const isConfigured = !!(process.env.NODEMAILER_EMAIL && process.env.NODEMAILER_PASSWORD);
  
  return {
    isConfigured,
    hasEmail: !!process.env.NODEMAILER_EMAIL,
    hasPassword: !!process.env.NODEMAILER_PASSWORD,
    hasFromEmail: !!process.env.NODEMAILER_FROM_EMAIL,
    message: isConfigured ? 'Nodemailer is properly configured' : 'Nodemailer configuration incomplete'
  };
}

// Test email configuration
export async function testNodemailer() {
  try {
    if (!transporter) {
      return { success: false, error: 'Nodemailer transporter not initialized' };
    }

    await transporter.verify();
    console.log('Nodemailer configuration is valid');
    return { success: true, message: 'Nodemailer configuration is valid' };
  } catch (error) {
    console.error('Nodemailer configuration error:', error);
    return { success: false, error: error.message };
  }
}
