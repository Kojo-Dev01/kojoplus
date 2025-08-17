import { sendOTPEmailResend, sendEmailViaResend, sendAdminNotificationEmail, verifyResendConfiguration, testResend } from './emailProviders/resend';
import { sendOTPEmailNodemailer, sendEmailViaNodemailer, sendAdminNotificationEmailNodemailer, verifyNodemailerConfiguration, testNodemailer } from './emailProviders/nodemailer';
import { enquiryResolvedTemplate, welcomeTemplate, bookingConfirmationTemplate } from './emailTemplates';

// Email service state - can be 'resend' or 'nodemailer'
let currentEmailService = process.env.EMAIL_SERVICE; // default to resend

// Function to set the email service
export function setEmailService(service) {
  if (service === 'resend' || service === 'nodemailer') {
    currentEmailService = service;
    console.log(`Email service switched to: ${service}`);
    return true;
  } else {
    console.error('Invalid email service. Use "resend" or "nodemailer"');
    return false;
  }
}

// Function to get current email service
export function getCurrentEmailService() {
  return currentEmailService;
}

// Unified OTP email sending function with fallback
export async function sendOTPEmail(to, otpCode, userData = {}) {
  console.log(`Attempting to send OTP email via ${currentEmailService}...`);
  
  try {
    let result;
    
    if (currentEmailService === 'resend') {
      result = await sendOTPEmailResend(to, otpCode, userData);
    } else {
      result = await sendOTPEmailNodemailer(to, otpCode, userData);
    }
    
    // If primary service fails, try fallback
    if (!result.success && currentEmailService === 'resend') {
      console.log('Resend failed, falling back to Nodemailer...');
      result = await sendOTPEmailNodemailer(to, otpCode, userData);
      if (result.success) {
        result.usedFallback = true;
      }
    } else if (!result.success && currentEmailService === 'nodemailer') {
      console.log('Nodemailer failed, falling back to Resend...');
      result = await sendOTPEmailResend(to, otpCode, userData);
      if (result.success) {
        result.usedFallback = true;
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Error sending OTP email:`, error);
    return {
      success: false,
      error: error.message,
      serviceUsed: currentEmailService
    };
  }
}

// Unified general email sending function with fallback
export async function sendEmail({ to, subject, html, text, from, replyTo }) {
  console.log(`Attempting to send email via ${currentEmailService}...`);
  
  try {
    let result;
    
    if (currentEmailService === 'resend') {
      result = await sendEmailViaResend({ to, subject, html, text, from });
    } else {
      result = await sendEmailViaNodemailer({ to, subject, html, text, from, replyTo });
    }
    
    // If primary service fails, try fallback
    if (!result.success && currentEmailService === 'resend') {
      console.log('Resend failed, falling back to Nodemailer...');
      result = await sendEmailViaNodemailer({ to, subject, html, text, from, replyTo });
      if (result.success) {
        result.usedFallback = true;
      }
    } else if (!result.success && currentEmailService === 'nodemailer') {
      console.log('Nodemailer failed, falling back to Resend...');
      result = await sendEmailViaResend({ to, subject, html, text, from });
      if (result.success) {
        result.usedFallback = true;
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Error sending email:`, error);
    return {
      success: false,
      error: error.message,
      serviceUsed: currentEmailService
    };
  }
}

// Admin notification email with fallback
export async function sendAdminNotification({ to, subject, message, priority = 'medium', from, replyTo }) {
  console.log(`Attempting to send admin notification via ${currentEmailService}...`);
  
  try {
    let result;
    
    if (currentEmailService === 'resend') {
      result = await sendAdminNotificationEmail({ to, subject, message, priority, from });
    } else {
      result = await sendAdminNotificationEmailNodemailer({ to, subject, message, priority, from, replyTo });
    }
    
    // If primary service fails, try fallback
    if (!result.success && currentEmailService === 'resend') {
      console.log('Resend failed, falling back to Nodemailer...');
      result = await sendAdminNotificationEmailNodemailer({ to, subject, message, priority, from, replyTo });
      if (result.success) {
        result.usedFallback = true;
      }
    } else if (!result.success && currentEmailService === 'nodemailer') {
      console.log('Nodemailer failed, falling back to Resend...');
      result = await sendAdminNotificationEmail({ to, subject, message, priority, from });
      if (result.success) {
        result.usedFallback = true;
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Error sending admin notification:`, error);
    return {
      success: false,
      error: error.message,
      serviceUsed: currentEmailService
    };
  }
}

// Email service functions using existing templates
export const emailServiceFunctions = {
  // Send enquiry resolved email
  async sendEnquiryResolvedEmail(enquiry, response) {
    try {
      const template = enquiryResolvedTemplate(enquiry, response);
      
      const result = await sendEmail({
        to: enquiry.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      });
      
      console.log('Enquiry resolved email sent:', {
        success: result.success,
        to: enquiry.email,
        subject: template.subject,
        serviceUsed: result.serviceUsed,
        usedFallback: result.usedFallback
      });

      return result;
    } catch (error) {
      console.error('Error sending enquiry resolved email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Send welcome email
  async sendWelcomeEmail(user) {
    try {
      const template = welcomeTemplate(user);
      
      const result = await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      });
      
      console.log('Welcome email sent:', {
        success: result.success,
        to: user.email,
        subject: template.subject,
        serviceUsed: result.serviceUsed,
        usedFallback: result.usedFallback
      });

      return result;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Send booking confirmation email
  async sendBookingConfirmationEmail(booking) {
    try {
      const template = bookingConfirmationTemplate(booking);
      
      const result = await sendEmail({
        to: booking.customerEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      });
      
      console.log('Booking confirmation email sent:', {
        success: result.success,
        to: booking.customerEmail,
        subject: template.subject,
        serviceUsed: result.serviceUsed,
        usedFallback: result.usedFallback
      });

      return result;
    } catch (error) {
      console.error('Error sending booking confirmation email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Send general notification email
  async sendNotificationEmail(to, subject, content, isHtml = true) {
    try {
      const result = await sendEmail({
        to,
        subject,
        [isHtml ? 'html' : 'text']: content
      });
      
      console.log('Notification email sent:', {
        success: result.success,
        to,
        subject,
        serviceUsed: result.serviceUsed,
        usedFallback: result.usedFallback
      });

      return result;
    } catch (error) {
      console.error('Error sending notification email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Test email configuration
  async testEmailConfig() {
    try {
      const currentService = getCurrentEmailService();
      
      if (currentService === 'resend') {
        const config = verifyResendConfiguration();
        if (!config.isConfigured) {
          return { success: false, error: config.message, service: 'resend' };
        }
        const testResult = await testResend();
        return { ...testResult, service: 'resend' };
      } else {
        const config = verifyNodemailerConfiguration();
        if (!config.isConfigured) {
          return { success: false, error: config.message, service: 'nodemailer' };
        }
        const testResult = await testNodemailer();
        return { ...testResult, service: 'nodemailer' };
      }
    } catch (error) {
      console.error('Email configuration error:', error);
      return { success: false, error: error.message, service: getCurrentEmailService() };
    }
  }
};

// Function to test all services
export async function testEmailServices() {
  const results = {
    resend: { available: false, configured: false },
    nodemailer: { available: false, configured: false }
  };
  
  // Test Resend
  try {
    const resendConfig = verifyResendConfiguration();
    results.resend = {
      available: true,
      configured: resendConfig.isConfigured,
      details: resendConfig
    };
    
    if (resendConfig.isConfigured) {
      const testResult = await testResend();
      results.resend.testResult = testResult;
    }
  } catch (error) {
    results.resend.error = error.message;
  }
  
  // Test Nodemailer
  try {
    const nodemailerConfig = verifyNodemailerConfiguration();
    results.nodemailer = {
      available: true,
      configured: nodemailerConfig.isConfigured,
      details: nodemailerConfig
    };
    
    if (nodemailerConfig.isConfigured) {
      const testResult = await testNodemailer();
      results.nodemailer.testResult = testResult;
    }
  } catch (error) {
    results.nodemailer.error = error.message;
  }
  
  return results;
}

// Function to automatically switch to working service
export async function autoSwitchEmailService() {
  const testResults = await testEmailServices();
  
  // Prefer Resend if configured, then Nodemailer
  if (testResults.resend.configured) {
    const switched = currentEmailService !== 'resend';
    setEmailService('resend');
    return { service: 'resend', switched };
  } else if (testResults.nodemailer.configured) {
    const switched = currentEmailService !== 'nodemailer';
    setEmailService('nodemailer');
    return { service: 'nodemailer', switched };
  } else {
    console.error('No email service is properly configured');
    return { service: null, error: 'No email service available' };
  }
}

// Export for backward compatibility
export { setEmailService as switchEmailService };

// Default export
export default emailServiceFunctions;
