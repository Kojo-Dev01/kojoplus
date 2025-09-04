import { NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/jwt";
import connectDB from "@/lib/mongodb";
import EnquiryResponse from "@/models/EnquiryResponse";

export async function GET(request, { params }) {
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

    // Get responses with populated user data and virtual fields
    const responses = await EnquiryResponse.getResponsesForEnquiry(id);

    // Transform responses to include virtual fields and clean data
    const transformedResponses = responses.map((response) => {
      const responseObj = response.toObject({ virtuals: true });

      return {
        ...responseObj,
        authorDisplay: response.authorDisplay,
        isAdminResponse: response.isAdminResponse,
        // Format user data for frontend
        author:
          response.responseType === "admin_response"
            ? { name: response.adminId, type: "admin" }
            : response.userId
            ? {
                name: `${response.userId.firstName} ${response.userId.lastName}`,
                email: response.userId.email,
                type: "user",
              }
            : { name: "System", type: "system" },
      };
    });

    return NextResponse.json({
      success: true,
      responses: transformedResponses,
    });
  } catch (error) {
    console.error("Error fetching enquiry responses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
