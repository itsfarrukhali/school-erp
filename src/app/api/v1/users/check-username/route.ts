// src/app/api/v1/users/check-username/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/v1/users/check-username?username=xxx
 * Check if username is available
 * Public endpoint (no auth required for better UX)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    // Validation
    if (!username) {
      return NextResponse.json(
        { available: false, message: "Username is required" },
        { status: 400 }
      );
    }

    // Username format validation
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        {
          available: false,
          message: "Username must be 3-20 characters (letters, numbers, underscores only)",
        },
        { status: 400 }
      );
    }

    // Check if username exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({
        available: false,
        message: "Username is already taken",
      });
    }

    return NextResponse.json({
      available: true,
      message: "Username is available",
    });
  } catch (error) {
    console.error("[CHECK_USERNAME_ERROR]", error);
    return NextResponse.json(
      { available: false, message: "Error checking username" },
      { status: 500 }
    );
  }
}
