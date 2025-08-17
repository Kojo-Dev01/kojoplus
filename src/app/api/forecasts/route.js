import { NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from "@/lib/mongodb";
import Forecast from "@/models/Forecast";
import User from "@/models/User";
import { uploadToWasabi } from "@/lib/s3Upload";

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;

    let query = {};

    // Filter by status (active/inactive)
    if (status === "active") {
      query.isActive = true;
    } else if (status === "inactive") {
      query.isActive = false;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    // Fetch forecasts with proper population handling
    const forecasts = await Forecast.find(query)
      .populate({
        path: "createdBy",
        select: "firstName lastName email",
        match: { creatorType: "user" },
      })
      .populate("comments.user", "firstName lastName email")
      .populate("comments.replies.user", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Manually populate createdBy for user types only
    const populatedForecasts = await Promise.all(
      forecasts.map(async (forecast) => {
        const forecastObj = forecast.toObject();

        // Only try to populate if creatorType is 'user'
        if (forecast.creatorType === "user") {
          await forecast.populate({
            path: "createdBy",
            select: "firstName lastName email",
          });
          forecastObj.createdBy = forecast.createdBy;
        }

        return forecastObj;
      })
    );

    // Populate comments separately
    await Forecast.populate(populatedForecasts, {
      path: "comments.user",
      select: "firstName lastName",
    });

    const totalCount = await Forecast.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Calculate stats
    const stats = await Forecast.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          published: { $sum: { $cond: ["$isPublished", 1, 0] } },
          totalViews: { $sum: "$views" },
          totalLikes: { $sum: { $size: { $ifNull: ["$likes", []] } } },
          totalComments: { $sum: { $size: { $ifNull: ["$comments", []] } } },
        },
      },
    ]);

    const statsData = stats[0] || {
      total: 0,
      published: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
    };

    return NextResponse.json({
      forecasts: populatedForecasts,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      stats: statsData,
    });
  } catch (error) {
    console.error("Error fetching forecasts:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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

    const formData = await request.formData();
    const title = formData.get("title");
    const description = formData.get("description");
    const image = formData.get("image");
    const isPublished = formData.get("isPublished") === "true";
    const tagsData = formData.get("tags");

    // Parse tags
    let tags = [];
    if (tagsData) {
      try {
        tags = JSON.parse(tagsData);
      } catch (e) {
        tags = tagsData
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag);
      }
    }

    if (!title || !description || !image) {
      return NextResponse.json(
        { error: "Title, description, and image are required" },
        { status: 400 }
      );
    }

    // Validate image file
    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Check file size (max 5MB)
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Upload image to Wasabi
    const uploadResult = await uploadToWasabi(image, "forecasts");

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: "Failed to upload image: " + uploadResult.error },
        { status: 500 }
      );
    }

    console.log("Image uploaded successfully:", uploadResult);

    // Create forecast directly without using static method
    const forecast = new Forecast({
      title: title.trim(),
      description: description.trim(),
      imageUrl: uploadResult.url,
      imageKey: uploadResult.key,
      isPublished,
      tags,
      views: 0,
      likes: [],
      comments: [],
      viewedBy: [],
      // Set creator fields for admin
      createdBy: payload.email || payload.username || "KojoForex",
      creatorType: "admin",
    });

    await forecast.save();

    return NextResponse.json(
      {
        success: true,
        forecast,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating forecast:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create forecast" },
      { status: 500 }
    );
  }
}
