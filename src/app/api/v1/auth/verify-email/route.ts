// src/app/api/v1/auth/verify-email/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isOTPExpired, isValidOTPFormat } from "@/lib/utils/otp";
import { sendWelcomeEmail } from "@/lib/email/email-service";

/**
 * POST /api/v1/auth/verify-email
 * Verify user's email with OTP code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    // Validation
    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "Email and OTP are required" },
        { status: 400 }
      );
    }

    if (!isValidOTPFormat(otp)) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP format. Must be 6 digits" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        isEmailVerified: true,
        verificationCode: true,
        verificationCodeExpiry: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return NextResponse.json(
        { success: false, message: "Email is already verified" },
        { status: 400 }
      );
    }

    // Check if OTP exists
    if (!user.verificationCode) {
      return NextResponse.json(
        {
          success: false,
          message: "No verification code found. Please request a new one",
        },
        { status: 400 }
      );
    }

    // Check if OTP expired
    if (isOTPExpired(user.verificationCodeExpiry)) {
      return NextResponse.json(
        {
          success: false,
          message: "Verification code has expired. Please request a new one",
          expired: true,
        },
        { status: 400 }
      );
    }

    // Verify OTP
    if (user.verificationCode !== otp) {
      return NextResponse.json(
        { success: false, message: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationCode: null,
        verificationCodeExpiry: null,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "User",
        entityId: user.id,
        action: "UPDATE",
        performedBy: user.id,
        after: {
          isEmailVerified: true,
        },
        note: `Email verified for ${user.email}`,
      },
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(
      user.email,
      user.fullName || `${user.firstName} ${user.lastName}`
    ).catch((error) => {
      console.error("Failed to send welcome email:", error);
    });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully! You can now log in.",
    });
  } catch (error) {
    console.error("[VERIFY_EMAIL_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
