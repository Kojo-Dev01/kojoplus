import { NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import connectDB from "@/lib/mongodb";
import Forecast from "@/models/Forecast";
import { deleteFromWasabi } from "@/lib/s3Upload";

export async function GET(request, { params }) {
  try {
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

    const forecast = await Forecast.findById(params.id);

    if (!forecast) {
      return NextResponse.json(
        { error: "Forecast not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ forecast });
  } catch (error) {
    console.error("Error fetching forecast:", error);
    return NextResponse.json(
      { error: "Failed to fetch forecast" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    // Verify admin authentication
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    const { id } = params;
    const updateData = await request.json();

    const forecast = await Forecast.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("createdBy", "firstName lastName email");

    if (!forecast) {
      return NextResponse.json(
        { error: "Forecast not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      forecast,
    });
  } catch (error) {
    console.error("Error updating forecast:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update forecast" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    // Verify admin authentication
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    const { id } = params;
    const forecast = await Forecast.findByIdAndDelete(id);

    if (!forecast) {
      return NextResponse.json(
        { error: "Forecast not found" },
        { status: 404 }
      );
    }

    // Delete image from Wasabi
    if (forecast.imageKey) {
      const deleteResult = await deleteFromWasabi(forecast.imageKey);
      if (!deleteResult.success) {
        console.warn("Failed to delete image from Wasabi:", deleteResult.error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Forecast deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting forecast:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete forecast" },
      { status: 500 }
    );
  }
}
