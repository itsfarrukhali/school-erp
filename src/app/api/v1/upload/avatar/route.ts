// src/app/api/v1/upload/avatar/route.ts

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { getSession } from "@/lib/auth";

/**
 * POST /api/v1/upload/avatar
 * Upload user avatar/profile image
 * Allowed: SuperAdmin, Admin (for creating users)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    // Allow SuperAdmin and Admin to upload avatars when creating users
    if (!session?.user || !["SUPERADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid file type. Only JPEG, PNG, and WebP are allowed",
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: "File too large. Maximum size is 5MB",
        },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "avatars");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split(".").pop();
    const filename = `avatar_${timestamp}_${randomString}.${extension}`;

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // Return public URL
    const avatarUrl = `/uploads/avatars/${filename}`;

    return NextResponse.json({
      success: true,
      message: "Avatar uploaded successfully",
      avatarUrl,
    });
  } catch (error) {
    console.error("[UPLOAD_AVATAR_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/upload/avatar
 * Delete avatar file
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user || !["SUPERADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const avatarUrl = searchParams.get("url");

    if (!avatarUrl) {
      return NextResponse.json(
        { success: false, message: "Avatar URL is required" },
        { status: 400 }
      );
    }

    // Extract filename from URL
    const filename = avatarUrl.split("/").pop();
    if (!filename) {
      return NextResponse.json(
        { success: false, message: "Invalid avatar URL" },
        { status: 400 }
      );
    }

    // Delete file
    const filepath = join(process.cwd(), "public", "uploads", "avatars", filename);
    if (existsSync(filepath)) {
      const { unlink } = await import("fs/promises");
      await unlink(filepath);
    }

    return NextResponse.json({
      success: true,
      message: "Avatar deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE_AVATAR_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete avatar" },
      { status: 500 }
    );
  }
}
