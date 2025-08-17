import { NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from "@/lib/mongodb";
import Course from "@/models/Course";
import { uploadToWasabi } from "@/lib/s3Upload";

export async function POST(request, { params }) {
  console.log("=== DIRECT MODULE LESSON CREATION API CALLED ===");

  try {
    const { id, moduleId } = await params;
    console.log(`Course ID: ${id}, Module ID: ${moduleId}`);

    // Verify admin token
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    const course = await Course.findById(id);
    if (!course) {
      console.log(`❌ Course not found with ID: ${id}`);
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const module2 = course.modules.id(moduleId);
    if (!module2) {
      console.log(`❌ Module not found with ID: ${moduleId} in course ${id}`);
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    console.log(`✅ Found module: "${module2.title}"`);

    // Check content type to determine how to parse the request
    const contentType = request.headers.get("content-type") || "";
    let lessonData;
    let videoUrl = null;

    console.log("📥 Content-Type:", contentType);

    if (contentType.includes("multipart/form-data")) {
      // Handle FormData (file upload)
      console.log("🔄 Processing FormData request for video upload");
      try {
        const formData = await request.formData();

        lessonData = {
          title: formData.get("title"),
          description: formData.get("description") || undefined,
          duration: formData.get("duration")
            ? parseInt(formData.get("duration"))
            : undefined,
          isPublished: formData.get("isPublished") === "true",
        };

        console.log("📝 Lesson data extracted:", lessonData);

        // Handle video file upload to Wasabi
        const videoFile = formData.get("video");
        if (videoFile && videoFile.size > 0) {
          console.log(
            `📹 Video file received: ${videoFile.name}, Size: ${(videoFile.size / (1024 * 1024)).toFixed(2)}MB`
          );

          const allowedVideoTypes = ["video/", ".ts"];

          const fileType = videoFile.type;
          const fileName = videoFile.name.toLowerCase();
          // Validate file type
          if (!fileType.startsWith("video/") && !fileName.endsWith(".ts")) {
            console.log("❌ Invalid file type:", fileType);
            return NextResponse.json(
              { error: "Only video files are allowed" },
              { status: 400 }
            );
          }

          // Validate file size (max 500MB)
          if (videoFile.size > 500 * 1024 * 1024) {
            console.log("❌ File too large:", videoFile.size);
            return NextResponse.json(
              { error: "Video size must be less than 500MB" },
              { status: 400 }
            );
          }

          try {
            console.log("☁️ Uploading video to Wasabi...");
            const uploadResult = await uploadToWasabi(videoFile, "videos");
            videoUrl = uploadResult.url;
            console.log("✅ Video uploaded successfully to:", videoUrl);
          } catch (uploadError) {
            console.error("❌ Video upload failed:", uploadError);
            return NextResponse.json(
              {
                error: "Failed to upload video file",
                details: uploadError.message,
              },
              { status: 500 }
            );
          }
        }
      } catch (formDataError) {
        console.error("❌ FormData parsing error:", formDataError);
        return NextResponse.json(
          { error: "Invalid FormData format" },
          { status: 400 }
        );
      }
    } else if (contentType.includes("application/json")) {
      // Handle JSON (URL-based video)
      console.log("🔄 Processing JSON request for video URL");
      try {
        const jsonData = await request.json();
        lessonData = {
          title: jsonData.title,
          description: jsonData.description,
          duration: jsonData.duration ? parseInt(jsonData.duration) : undefined,
          isPublished: jsonData.isPublished || false,
        };

        // Use provided video URL
        videoUrl = jsonData.videoUrl?.trim();
        console.log("📝 Lesson data extracted:", lessonData);
        console.log("🔗 Video URL provided:", videoUrl);
      } catch (jsonError) {
        console.error("❌ JSON parsing error:", jsonError);
        return NextResponse.json(
          {
            error: "Invalid JSON format in request body",
            details: jsonError.message,
          },
          { status: 400 }
        );
      }
    } else {
      console.log("❌ Unknown content type, attempting JSON fallback");
      try {
        const jsonData = await request.json();
        lessonData = {
          title: jsonData.title,
          description: jsonData.description,
          duration: jsonData.duration ? parseInt(jsonData.duration) : undefined,
          isPublished: jsonData.isPublished || false,
        };
        videoUrl = jsonData.videoUrl?.trim();
        console.log("✅ Fallback JSON parsing successful");
      } catch (jsonError) {
        console.error("❌ Fallback JSON parsing failed:", jsonError);
        return NextResponse.json(
          {
            error:
              "Unable to parse request body. Please ensure you are sending valid JSON or FormData.",
            contentType: contentType,
          },
          { status: 400 }
        );
      }
    }

    if (!lessonData.title?.trim()) {
      console.log("❌ Lesson title is required");
      return NextResponse.json(
        { error: "Lesson title is required" },
        { status: 400 }
      );
    }

    // Calculate order for new lesson
    const existingItems = [];
    if (module2.sections) {
      module2.sections.forEach((section) =>
        existingItems.push({ order: section.order || 999 })
      );
    }
    if (module2.lessons) {
      module2.lessons.forEach((lesson) =>
        existingItems.push({ order: lesson.order || 999 })
      );
    }

    const maxOrder =
      existingItems.length > 0
        ? Math.max(...existingItems.map((item) => item.order || 0))
        : 0;
    const newOrder = maxOrder + 1;
    console.log(`📊 Calculated lesson order: ${newOrder}`);

    const newLesson = {
      title: lessonData.title.trim(),
      description: lessonData.description?.trim(),
      videoUrl: videoUrl || undefined,
      duration: lessonData.duration,
      isPublished: lessonData.isPublished,
      order: newOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("📚 Creating lesson:", newLesson);

    module2.lessons.push(newLesson);
    module2.updatedAt = new Date();
    course.updatedAt = new Date();

    // Recalculate totals
    const totalLessons = course.modules.reduce((total, mod) => {
      const moduleLessons = mod.lessons ? mod.lessons.length : 0;
      const sectionLessons = mod.sections
        ? mod.sections.reduce((sectionTotal, section) => {
            return (
              sectionTotal + (section.lessons ? section.lessons.length : 0)
            );
          }, 0)
        : 0;
      return total + moduleLessons + sectionLessons;
    }, 0);

    course.totalLessons = totalLessons;

    console.log(`📊 Updated course totals - Lessons: ${totalLessons}`);

    await course.save();
    console.log("✅ Course saved successfully");

    return NextResponse.json(
      {
        success: true,
        lesson: newLesson,
        course: course.toObject(),
        message: "Lesson created successfully",
        videoUploaded: !!videoUrl && videoUrl.includes("wasabisys.com"),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ ERROR in direct module lesson creation API:", error);
    console.error("Stack trace:", error.stack);

    return NextResponse.json(
      {
        error: error.message || "Failed to create lesson",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
