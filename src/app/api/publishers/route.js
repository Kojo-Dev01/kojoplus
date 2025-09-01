import { NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from "@/lib/mongodb";
import Publisher from "@/models/Publisher";

export async function GET(request) {
  console.log("📰 Publishers API: Starting publishers fetch...");

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
    const verified = searchParams.get("verified");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 50;
    const all = searchParams.get("all");

    let query = {};

    if (status === "active") {
      query.isActive = true;
    } else if (status === "inactive") {
      query.isActive = false;
    }

    // Filter by verification status
    if (verified === "verified") {
      query.isVerified = true;
    } else if (verified === "unverified") {
      query.isVerified = false;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { nickname: { $regex: search, $options: "i" } },
        { displayName: { $regex: search, $options: "i" } },
        { bio: { $regex: search, $options: "i" } },
      ];
    }

    // If requesting all publishers (for bulk operations)
    if (all === "true") {
      const publishers = await Publisher.find(query)
        .populate("userId", "firstName lastName email phone whatsapp")
        .sort({ createdAt: -1 });

      return NextResponse.json({
        publishers,
      });
    }

    const skip = (page - 1) * limit;
    const publishers = await Publisher.find(query)
      .populate(
        "userId",
        "firstName lastName email phone whatsapp emailVerified"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Publisher.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Calculate stats
    const stats = await Publisher.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ["$isActive", 1, 0] } },
          inactive: { $sum: { $cond: [{ $not: "$isActive" }, 1, 0] } },
          totalFollowers: { $sum: { $size: { $ifNull: ["$followers", []] } } },
          totalForecasts: { $sum: "$stats.totalForecasts" },
          totalViews: { $sum: "$stats.totalViews" },
          totalLikes: { $sum: "$stats.totalLikes" },
          totalComments: { $sum: "$stats.totalComments" },
          verified: { $sum: { $cond: ["$isVerified", 1, 0] } },
          totalReach: { $sum: { $ifNull: ["$metrics.totalReach", 0] } },
        },
      },
    ]);

    const statsData = stats[0] || {
      total: 0,
      active: 0,
      inactive: 0,
      totalFollowers: 0,
      totalForecasts: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,

      verified: 0,
      totalReach: 0,
    };

    // Add inactive count
    statsData.inactive = statsData.total - statsData.active;
    statsData.unverified = statsData.total - statsData.verified;
    console.log(
      "✅ Publishers API: Returning",
      publishers.length,
      "publishers"
    );

    return NextResponse.json({
      publishers,
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
    console.error("❌ Publishers API: Error fetching publishers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth();

    if (!authResult.success) {
      return NextResponse.json({ message: authResult.error }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();

    const { publisherId, ...updateData } = await request.json();

    const publisher = await Publisher.findByIdAndUpdate(
      publisherId,
      updateData,
      { new: true, runValidators: true }
    ).populate(
      "userId",
      "firstName lastName email phone whatsapp emailVerified"
    );

    const { name, email, website, category, description, socialMedia } = body;

    if (!publisher) {
      return NextResponse.json(
        { error: "Publisher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      publisher,
    });
  } catch (error) {
    console.error("❌ Publishers API: Error creating publisher:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update publisher" },
      { status: 500 }
    );
  }
}
