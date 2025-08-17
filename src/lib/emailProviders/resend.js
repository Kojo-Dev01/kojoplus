import { Resend } from 'resend';

// Initialize Resend
let resendClient = null;

if (process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn('RESEND_API_KEY not found in environment variables');
}

// Function to send OTP email via Resend
export async function sendOTPEmailResend(to, otpCode, userData = {}) {
  if (!process.env.RESEND_API_KEY) {
    console.error('Resend API key not configured');
    return { success: false, error: 'Email service not configured' };
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    console.error('Resend from email not configured');
    return { success: false, error: 'Email sender not configured' };
  }

  try {
    const result = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: [to],
      subject: 'KOJOFOREX - Email Verification Code',
      html: `
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
      `,
      text: `
Welcome to KOJOFOREX!

Your email verification code is: ${otpCode}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
The KOJOFOREX Team
      `
    });

    if (result.data) {
      console.log('OTP email sent successfully via Resend:', result.data.id);
      return { 
        success: true, 
        messageId: result.data.id,
        serviceUsed: 'resend'
      };
    } else if (result.error) {
      console.error('Resend send failed:', result.error);
      return { 
        success: false, 
        error: `Resend send failed: ${result.error.message || 'Unknown error'}`,
        serviceUsed: 'resend'
      };
    } else {
      return { 
        success: false, 
        error: 'No response from Resend API',
        serviceUsed: 'resend'
      };
    }
  } catch (error) {
    console.error('Resend OTP email error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send email via Resend',
      serviceUsed: 'resend'
    };
  }
}

// General email sending function for Resend
export async function sendEmailViaResend({ to, subject, html, text, from }) {
  if (!process.env.RESEND_API_KEY) {
    console.error('Resend API key not configured');
    return { success: false, error: 'Resend not configured' };
  }

  const fromEmail = from || process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) {
    console.error('Resend from email not configured');
    return { success: false, error: 'Resend sender not configured' };
  }

  try {
    const result = await resendClient.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version if not provided
    });

    if (result.data) {
      console.log('Email sent successfully via Resend:', result.data.id);
      return { 
        success: true, 
        messageId: result.data.id,
        serviceUsed: 'resend'
      };
    } else if (result.error) {
      console.error('Resend send failed:', result.error);
      return { 
        success: false, 
        error: `Resend send failed: ${result.error.message || 'Unknown error'}`,
        serviceUsed: 'resend'
      };
    } else {
      return { 
        success: false, 
        error: 'No response from Resend API',
        serviceUsed: 'resend'
      };
    }
  } catch (error) {
    console.error('Resend email error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send email via Resend',
      serviceUsed: 'resend'
    };
  }
}

// Admin notification email template
export async function sendAdminNotificationEmail({ to, subject, message, priority = 'medium', from }) {
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

  return await sendEmailViaResend({ to, subject, html, text, from });
}

// Health check function for Resend
export function verifyResendConfiguration() {
  const isConfigured = !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
  
  return {
    isConfigured,
    hasApiKey: !!process.env.RESEND_API_KEY,
    hasFromEmail: !!process.env.RESEND_FROM_EMAIL,
    message: isConfigured ? 'Resend is properly configured' : 'Resend configuration incomplete'
  };
}

// Test function for Resend
export async function testResend() {
  if (!resendClient) {
    return { success: false, error: 'Resend client not initialized' };
  }

  try {
    const config = verifyResendConfiguration();
    return { 
      success: config.isConfigured, 
      message: config.message,
      details: config
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
