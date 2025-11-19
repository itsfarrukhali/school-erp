// src/app/api/v1/auth/verify-email/route.ts
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { ApiResponse } from "@/types";
import { verifyEmailSchema } from "@/validations/auth/auth";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = verifyEmailSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Validation errors",
          errors,
        },
        { status: 400 }
      );
    }

    const { email, code } = validationResult.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (user.isEmailVerified) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Email already verified" },
        { status: 400 }
      );
    }

    if (!user.verificationCode || !user.verificationCodeExpiry) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "No verification code found" },
        { status: 400 }
      );
    }

    if (user.verificationCodeExpiry < new Date()) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Verification code expired" },
        { status: 400 }
      );
    }

    const hashedProvidedCode = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    if (hashedProvidedCode !== user.verificationCode) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Invalid verification code" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationCode: null,
        verificationCodeExpiry: null,
      },
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Email verified successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in email verification:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "An error occurred during verification",
      },
      { status: 500 }
    );
  }
}
