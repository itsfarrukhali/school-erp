// src/app/api/payment/reconciliation-report/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import { getReconciliationReport } from "@/lib/payment-matcher";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    const report = await getReconciliationReport(
      schoolId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Error generating reconciliation report:", error);
    return NextResponse.json(
      { error: "Failed to generate reconciliation report" },
      { status: 500 }
    );
  }
}
