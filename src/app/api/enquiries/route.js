import { NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/jwt";
import connectDB from "@/lib/mongodb";
import Enquiry from "@/models/Enquiry";

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const enquiryType = searchParams.get("enquiryType");
    const priority = searchParams.get("priority");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 50; // Changed to 50 to match frontend

    let query = {};

    // Filter by status - handle both formats
    if (status && status !== "all") {
      query.status = status;
    }

    // Filter by enquiry type
    if (enquiryType && enquiryType !== "all") {
      query.enquiryType = enquiryType;
    }

    // Filter by priority
    if (priority && priority !== "all") {
      query.priority = priority;
    }

    // Search functionality
    if (search && search.trim()) {
      query.$or = [
        { firstName: { $regex: search.trim(), $options: "i" } },
        { lastName: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
        { subject: { $regex: search.trim(), $options: "i" } },
        { message: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    // Get enquiries with response count aggregation
    const enquiriesAggregation = await Enquiry.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "enquiryresponses",
          localField: "_id",
          foreignField: "enquiryId",
          as: "responses",
        },
      },
      {
        $addFields: {
          responseCount: { $size: "$responses" },
          customerName: { $concat: ["$firstName", " ", "$lastName"] },
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalEnquiries = await Enquiry.countDocuments(query);
    const totalPages = Math.ceil(totalEnquiries / limit);

    // Get stats for all enquiries (not filtered)
    const stats = await Enquiry.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    // Transform enquiries data to match frontend expectations
    const transformedEnquiries = enquiriesAggregation.map((enquiry) => ({
      ...enquiry,
      customerName: `${enquiry.firstName} ${enquiry.lastName}`,
      responseCount: enquiry.responseCount || 0,
      enquiryId: enquiry._id.toString().slice(-8), // Generate short ID from MongoDB ID
    }));

    return NextResponse.json({
      enquiries: transformedEnquiries,
      total: totalEnquiries,
      totalPages,
      currentPage: page,
      pagination: {
        currentPage: page,
        totalPages,
        totalEnquiries,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      stats: {
        total: totalEnquiries,
        pending: statusCounts.pending || 0,
        in_progress: statusCounts["in-progress"] || 0,
        resolved: statusCounts.resolved || 0,
        closed: statusCounts.closed || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching enquiries:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
