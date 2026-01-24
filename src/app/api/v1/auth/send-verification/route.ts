// src/app/api/v1/auth/send-verification/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateOTP, getOTPExpiry, canSendOTP, getRemainingCooldown } from "@/lib/utils/otp";
import { sendVerificationEmail } from "@/lib/email/email-service";

/**
 * POST /api/v1/auth/send-verification
 * Send verification OTP to user's email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        isEmailVerified: true,
        lastVerificationSent: true,
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

    // Check rate limiting
    if (!canSendOTP(user.lastVerificationSent)) {
      const remaining = getRemainingCooldown(user.lastVerificationSent);
      return NextResponse.json(
        {
          success: false,
          message: `Please wait ${remaining} seconds before requesting a new code`,
          remainingSeconds: remaining,
        },
        { status: 429 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiry = getOTPExpiry();

    // Update user with OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: otp,
        verificationCodeExpiry: expiry,
        lastVerificationSent: new Date(),
      },
    });

    // Send email
    const emailSent = await sendVerificationEmail(
      user.email,
      user.fullName || `${user.firstName} ${user.lastName}`,
      otp
    );

    if (!emailSent) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send verification email. Please try again.",
        },
        { status: 500 }
      );
    }

    // Log the OTP in development (remove in production)
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] Verification OTP for ${email}: ${otp}`);
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email",
      expiresIn: 15, // minutes
    });
  } catch (error) {
    console.error("[SEND_VERIFICATION_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
