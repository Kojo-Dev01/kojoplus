import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import Enquiry from '@/models/Enquiry';
import EnquiryResponse from '@/models/EnquiryResponse';
import Notification from '@/models/Notification';
import AdminNotification from '@/models/AdminNotification';
import emailService from '@/lib/emailService';

export async function POST(request, { params }) {
  try {
      // Verify admin authentication using JWT
      const token = getTokenFromRequest(request);
      
      if (!token) {
        return NextResponse.json({ error: 'No token provided' }, { status: 401 });
      }
  
      const payload = verifyToken(token);
      
      if (!payload) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
  
      await connectDB();

    const { id } = await params;
    const { responseMessage, newStatus } = await request.json();

    // Validate required fields
    if (!responseMessage || !newStatus) {
      return NextResponse.json(
        { message: 'Response message and new status are required' },
        { status: 400 }
      );
    }

    // Find the enquiry
    const enquiry = await Enquiry.findById(id).populate('submittedBy');
    
    if (!enquiry) {
      return NextResponse.json(
        { message: 'Enquiry not found' },
        { status: 404 }
      );
    }

    // Create the response and update enquiry status
    const responseData = {
      enquiryId: id,
      respondedBy: decoded.username,
      responseMessage,
      responseType: newStatus === 'resolved' ? 'resolution' : 'update'
    };

    const response = await EnquiryResponse.createWithEnquiryUpdate(
      responseData,
      newStatus,
      decoded.username
    );

    // Create notifications and send email if enquiry is resolved
    if (newStatus === 'resolved') {
      try {
        // Create admin notification
        await AdminNotification.createNotification({
          title: 'Enquiry Resolved',
          message: `Enquiry "${enquiry.subject}" has been resolved by ${decoded.username}`,
          type: 'system',
          priority: 'medium',
          metadata: {
            enquiryId: enquiry._id,
            resolvedBy: decoded.username,
            customerEmail: enquiry.email
          }
        });

        // Create user notification if the enquiry has a registered user
        if (enquiry.submittedBy) {
          await Notification.createNotification({
            userId: enquiry.submittedBy._id,
            type: 'message',
            title: 'Your Enquiry Has Been Resolved',
            message: `We've resolved your enquiry about "${enquiry.subject}". Check your email for our response.`,
            priority: 'medium',
            metadata: {
              enquiryId: enquiry._id,
              subject: enquiry.subject,
              responsePreview: responseMessage.substring(0, 100) + (responseMessage.length > 100 ? '...' : '')
            }
          });
        }

        // Send email to customer
        const emailResult = await emailService.sendEnquiryResolvedEmail(enquiry, {
          ...response.toObject(),
          createdAt: new Date()
        });

        if (!emailResult.success) {
          console.error('Failed to send email:', emailResult.error);
          // Create admin notification about email failure
          await AdminNotification.createNotification({
            title: 'Email Delivery Failed',
            message: `Failed to send resolution email to ${enquiry.email} for enquiry "${enquiry.subject}"`,
            type: 'alert',
            priority: 'high',
            metadata: {
              enquiryId: enquiry._id,
              customerEmail: enquiry.email,
              error: emailResult.error
            }
          });
        } else {
          console.log('Resolution email sent successfully to:', enquiry.email);
          // Log successful email in development
          if (process.env.NODE_ENV !== 'production' && emailResult.previewUrl) {
            console.log('Email preview URL:', emailResult.previewUrl);
          }
        }
      } catch (notificationError) {
        console.error('Error creating notifications or sending email:', notificationError);
        // Don't fail the main request if notifications/email fail
      }
    }

    // Get updated enquiry with the response
    const updatedEnquiry = await Enquiry.findById(id).populate('submittedBy');

    return NextResponse.json({
      message: 'Response added successfully',
      enquiry: updatedEnquiry,
      response
    });

  } catch (error) {
    console.error('Error responding to enquiry:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
