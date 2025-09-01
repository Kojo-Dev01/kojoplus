import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/lib/jwt";
import AcademyLead from "@/models/AcademyLead";

export async function GET(request) {
  try {
    // Verify admin authentication
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
    const category = searchParams.get("category");
    const paymentStatus = searchParams.get("paymentStatus");
    const search = searchParams.get("search");

    // Build query
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Fetch leads
    const leads = await AcademyLead.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    // Calculate stats
    const stats = await AcademyLead.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          reviewed: {
            $sum: { $cond: [{ $eq: ["$status", "reviewed"] }, 1, 0] },
          },
          accepted: {
            $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] },
          },
          rejected: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          paid: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] },
          },
          revenue: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$price", 0] },
          },
        },
      },
    ]);

    const statsData = stats[0] || {
      total: 0,
      pending: 0,
      reviewed: 0,
      accepted: 0,
      rejected: 0,
      completed: 0,
      paid: 0,
      revenue: 0,
    };

    return NextResponse.json({
      leads,
      stats: statsData,
    });
  } catch (error) {
    console.error("Error fetching academy leads:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    // Verify admin authentication
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await connectDB();

    const { id } = request.query;
    const body = await request.json();

    // Validate request body
    if (!id || !body.status) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

    // Update lead
    const updatedLead = await AcademyLead.findByIdAndUpdate(
      id,
      { status: body.status },
      { new: true }
    );

    if (!updatedLead) {
      return NextResponse.json({ message: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Lead updated", lead: updatedLead });
  } catch (error) {
    console.error("Error updating academy lead:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
