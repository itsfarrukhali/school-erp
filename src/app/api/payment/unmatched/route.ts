// src/app/api/payment/unmatched/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import { getUnmatchedPayments } from "@/lib/payment-matcher";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    const unmatchedPayments = await getUnmatchedPayments(schoolId);

    return NextResponse.json({
      success: true,
      count: unmatchedPayments.length,
      payments: unmatchedPayments,
    });
  } catch (error) {
    console.error("Error fetching unmatched payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch unmatched payments" },
      { status: 500 }
    );
  }
}
