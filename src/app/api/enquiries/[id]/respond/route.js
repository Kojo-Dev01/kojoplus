import { NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/jwt";
import connectDB from "@/lib/mongodb";
import Enquiry from "@/models/Enquiry";
import EnquiryResponse from "@/models/EnquiryResponse";
import Notification from "@/models/Notification";
import AdminNotification from "@/models/AdminNotification";
import EnquiryNotification from "@/models/EnquiryNotification";
import User from "@/models/User";
import { uploadToWasabi } from "@/lib/s3Upload";

export async function POST(request, { params }) {
  try {
    // Verify admin authentication using JWT
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    // Parse form data for file uploads
    const formData = await request.formData();
    const message = formData.get("message");
    const newStatus = formData.get("newStatus");
    const files = formData.getAll("attachments");

    // Validate required fields
    if (!message) {
      return NextResponse.json(
        { error: "Response message is required" },
        { status: 400 }
      );
    }

    // Find the enquiry
    const enquiry = await Enquiry.findById(id).populate("submittedBy");

    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    // Process file uploads
    const attachments = [];
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.size === 0) continue; // Skip empty files

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: `File ${file.name} is too large. Maximum size is 10MB.` },
            { status: 400 }
          );
        }

        // Validate file type (allow documents, images, etc.)
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/plain",
          "text/csv",
        ];

        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            { error: `File type ${file.type} is not allowed for ${file.name}` },
            { status: 400 }
          );
        }

        try {
          // Upload to Wasabi
          const uploadResult = await uploadToWasabi(
            file,
            "enquiry-attachments"
          );

          if (!uploadResult.success) {
            return NextResponse.json(
              { error: `Failed to upload ${file.name}: ${uploadResult.error}` },
              { status: 500 }
            );
          }

          attachments.push({
            filename: uploadResult.key.split("/").pop(),
            originalName: file.name,
            url: uploadResult.url,
            key: uploadResult.key,
            fileType: file.type,
            fileSize: file.size,
            uploadedAt: new Date(),
          });
        } catch (uploadError) {
          console.error("File upload error:", uploadError);
          return NextResponse.json(
            { error: `Failed to upload ${file.name}` },
            { status: 500 }
          );
        }
      }
    }

    // Get client IP and user agent for tracking
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0]
      : request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Store previous status for notification
    const previousStatus = enquiry.status;

    // Create the admin response
    const responseData = {
      enquiryId: id,
      responseType: "admin_response",
      adminId: payload.email || payload.username || "Admin",
      message: message.trim(),
      attachments,
      metadata: {
        ipAddress: ip,
        userAgent,
        source: "web",
      },
    };

    // FIXED: Create response only once and handle status update properly
    let response;
    let updatedEnquiry;

    if (newStatus) {
      // Create response with enquiry status update in one operation
      response = await EnquiryResponse.createWithEnquiryUpdate(
        responseData,
        newStatus,
        payload.username
      );
      // Get the updated enquiry after status change
      updatedEnquiry = await Enquiry.findById(id).populate("submittedBy");
    } else {
      // Just create the response without status update
      response = await EnquiryResponse.createAdminResponse(responseData);
      updatedEnquiry = enquiry; // Use existing enquiry object
    }

    // Create enquiry notification using the updated enquiry object
    try {
      await EnquiryNotification.createForResponse(updatedEnquiry, response, {
        previousStatus,
        metadata: {
          adminUsername: decoded.username,
          hasStatusChange: !!newStatus,
          responseLength: message.trim().length,
        },
      });

      console.log(
        `Enquiry notification created for enquiry ${updatedEnquiry._id}`
      );
    } catch (notificationError) {
      console.error("Error creating enquiry notification:", notificationError);
      // Don't fail the main request if notification creation fails
    }

    // Create normal user notification if the enquiry has a registered user
    try {
      if (updatedEnquiry.submittedBy) {
        let notificationTitle = "New Response to Your Enquiry";
        let notificationMessage = `You have received a new response to your enquiry "${updatedEnquiry.subject}".`;
        let notificationPriority = "medium";

        // Customize notification based on status change
        if (newStatus === "resolved") {
          notificationTitle = "Your Enquiry Has Been Resolved";
          notificationMessage = `Your enquiry "${updatedEnquiry.subject}" has been resolved. Please check your email for the full response.`;
          notificationPriority = "high";
        } else if (newStatus === "closed") {
          notificationTitle = "Your Enquiry Has Been Closed";
          notificationMessage = `Your enquiry "${updatedEnquiry.subject}" has been closed.`;
          notificationPriority = "medium";
        } else if (newStatus === "in-progress") {
          notificationTitle = "Your Enquiry is Being Processed";
          notificationMessage = `Your enquiry "${updatedEnquiry.subject}" is now being processed by our support team.`;
          notificationPriority = "medium";
        }

        await Notification.createNotification({
          userId: updatedEnquiry.submittedBy._id,
          type: newStatus === "resolved" ? "success" : "message",
          title: notificationTitle,
          message: notificationMessage,
          priority: notificationPriority,
          metadata: {
            enquiryId: updatedEnquiry._id,
            subject: updatedEnquiry.subject,
            responsePreview:
              message.substring(0, 100) + (message.length > 100 ? "..." : ""),
            hasAttachments: attachments.length > 0,
            previousStatus,
            newStatus: newStatus || updatedEnquiry.status,
            adminResponder: decoded.username,
          },
        });

        console.log(
          `User notification created for user ${updatedEnquiry.submittedBy._id}`
        );
      }
    } catch (userNotificationError) {
      console.error("Error creating user notification:", userNotificationError);
      // Don't fail the main request if user notification creation fails
    }

    // Handle other notifications and emails based on status
    try {
      if (newStatus === "resolved") {
        // Create admin notification
        await AdminNotification.createNotification({
          title: "Enquiry Resolved",
          message: `Enquiry "${updatedEnquiry.subject}" has been resolved by ${decoded.username}`,
          type: "system",
          priority: "medium",
          metadata: {
            enquiryId: updatedEnquiry._id,
            resolvedBy: decoded.username,
            customerEmail: updatedEnquiry.email,
            hasAttachments: attachments.length > 0,
          },
        });

        // Send email to customer
        // const emailResult = await emailService.sendEnquiryResolvedEmail(updatedEnquiry, {
        //   ...response.toObject(),
        //   createdAt: new Date()
        // });

        if (emailResult.success) {
          // Update notification as sent
          try {
            const notification = await EnquiryNotification.findOne({
              enquiryId: updatedEnquiry._id,
              responseId: response._id,
            }).sort({ createdAt: -1 });

            if (notification) {
              await notification.markAsSent({
                messageId: emailResult.messageId,
                provider: "emailService",
              });
            }
          } catch (updateError) {
            console.error("Error updating notification status:", updateError);
          }
        } else {
          console.error("Failed to send email:", emailResult.error);

          // Mark notification as failed
          try {
            const notification = await EnquiryNotification.findOne({
              enquiryId: updatedEnquiry._id,
              responseId: response._id,
            }).sort({ createdAt: -1 });

            if (notification) {
              await notification.markAsFailed(emailResult.error);
            }
          } catch (updateError) {
            console.error("Error updating notification status:", updateError);
          }

          await AdminNotification.createNotification({
            title: "Email Delivery Failed",
            message: `Failed to send resolution email to ${updatedEnquiry.email} for enquiry "${updatedEnquiry.subject}"`,
            type: "alert",
            priority: "high",
            metadata: {
              enquiryId: updatedEnquiry._id,
              customerEmail: updatedEnquiry.email,
              error: emailResult.error,
            },
          });
        }
      } else if (newStatus === "in_progress") {
        // Just notify that enquiry is now in progress
        await AdminNotification.createNotification({
          title: "Enquiry In Progress",
          message: `Enquiry "${updatedEnquiry.subject}" is now being handled by ${decoded.username}`,
          type: "info",
          priority: "low",
          metadata: {
            enquiryId: updatedEnquiry._id,
            handledBy: decoded.username,
            customerEmail: updatedEnquiry.email,
          },
        });
      } else {
        // For responses without status change, still try to send email notification
        try {
          // const emailResult = await emailService.sendEnquiryResponseEmail(updatedEnquiry, {
          //   ...response.toObject(),
          //   createdAt: new Date()
          // });

          if (emailResult.success) {
            const notification = await EnquiryNotification.findOne({
              enquiryId: updatedEnquiry._id,
              responseId: response._id,
            }).sort({ createdAt: -1 });

            if (notification) {
              await notification.markAsSent({
                messageId: emailResult.messageId,
                provider: "emailService",
              });
            }
          } else {
            const notification = await EnquiryNotification.findOne({
              enquiryId: updatedEnquiry._id,
              responseId: response._id,
            }).sort({ createdAt: -1 });

            if (notification) {
              await notification.markAsFailed(emailResult.error);
            }
          }
        } catch (emailError) {
          console.error("Error sending response email:", emailError);
        }
      }
    } catch (notificationError) {
      console.error(
        "Error creating notifications or sending email:",
        notificationError
      );
      // Don't fail the main request if notifications/email fail
    }

    // FIXED: Get fresh enquiry data for final response
    const finalEnquiry = await Enquiry.findById(id).populate("submittedBy");

    return NextResponse.json({
      success: true,
      message: "Response added successfully",
      enquiry: finalEnquiry,
      response: {
        ...response.toObject(),
        authorDisplay: response.authorDisplay,
        isAdminResponse: response.isAdminResponse,
      },
    });
  } catch (error) {
    console.error("Error responding to enquiry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
