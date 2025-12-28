// src/app/api/payment/manual-match/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import { manualMatch } from "@/lib/payment-matcher";
import { z } from "zod";

const manualMatchSchema = z.object({
  incomingPaymentId: z.string().min(1, "Payment ID is required"),
  voucherId: z.string().min(1, "Voucher ID is required"),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to manually match payments
    const allowedRoles = [
      "SUPERADMIN",
      "ADMIN",
      "SCHOOLADMIN",
      "PRINCIPAL",
      "ACCOUNTANT",
    ];

    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "You don't have permission to match payments" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = manualMatchSchema.parse(body);

    // Perform manual match
    const result = await manualMatch(
      validatedData.incomingPaymentId,
      validatedData.voucherId,
      session.user.id,
      validatedData.notes
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      result,
      message: "Payment matched successfully",
    });
  } catch (error) {
    console.error("Error matching payment:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to match payment" },
      { status: 500 }
    );
  }
}
