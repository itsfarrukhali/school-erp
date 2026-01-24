// src/app/api/v1/users/register/admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { registerAdminSchema } from "@/validations/user";
import { generateUserId } from "@/lib/utils/id-generator";
import { hashPassword } from "@/utils/password";
import { Prisma } from "@prisma/client";

/**
 * POST - Register Admin
 * Only SuperAdmin can register Admins
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only SuperAdmin can register Admins
    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { message: "Only SuperAdmin can register Admins" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = registerAdminSchema.parse(body);

    // Check if email or username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { username: validatedData.username },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message:
            existingUser.email === validatedData.email
              ? "Email already exists"
              : "Username already exists",
        },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(validatedData.password);

    // Generate unique user ID
    const uid = generateUserId("ADMIN");

    // Create user and permissions in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
        data: {
          uid,
          username: validatedData.username,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          fullName: `${validatedData.firstName} ${validatedData.lastName}`,
          email: validatedData.email,
          password: hashedPassword,
          role: "ADMIN",
          gender: validatedData.gender,
          dob: validatedData.dob ? new Date(validatedData.dob) : null,
          phoneNo: validatedData.phoneNo,
          designation: validatedData.designation || "Administrator",
          address: validatedData.address || Prisma.JsonNull,
          avatarUrl: validatedData.avatarUrl,
          status: "ACTIVE",
          isEmailVerified: false, // Require email verification
        },
      });

      // Get default role permissions and assign to user
      const rolePermissions = await tx.rolePermission.findMany({
        where: {
          role: "ADMIN",
          allowed: true,
        },
        include: { permission: true },
      });

      // Create user permissions
      if (rolePermissions.length > 0) {
        await tx.userPermission.createMany({
          data: rolePermissions.map((rp) => ({
            userId: user.id,
            permissionId: rp.permissionId,
            allowed: true,
          })),
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          entityType: "User",
          entityId: user.id,
          action: "CREATE",
          performedBy: session.user.id,
          after: {
            uid: user.uid,
            email: user.email,
            role: user.role,
          },
          note: `Admin "${user.fullName}" registered`,
        },
      });

      return user;
    });

    // Send verification email (non-blocking)
    const { generateOTP, getOTPExpiry } = await import("@/lib/utils/otp");
    const { sendVerificationEmail } = await import("@/lib/email/email-service");
    
    const otp = generateOTP();
    const expiry = getOTPExpiry();
    
    // Update user with OTP
    await prisma.user.update({
      where: { id: result.id },
      data: {
        verificationCode: otp,
        verificationCodeExpiry: expiry,
        lastVerificationSent: new Date(),
      },
    });
    
    // Send email (don't block response)
    sendVerificationEmail(
      result.email,
      result.fullName || `${result.firstName} ${result.lastName}`,
      otp
    ).catch((error) => {
      console.error("Failed to send verification email:", error);
    });

    // Log OTP in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] Verification OTP for ${result.email}: ${otp}`);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.id,
          uid: result.uid,
          email: result.email,
          username: result.username,
          fullName: result.fullName,
          role: result.role,
        },
        message: "Admin registered successfully. Please check your email for verification code.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering admin:", error);
    if (error instanceof Error && error.name === "ZodError") {
      console.error("Zod Validation Error:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { message: "Validation failed", details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Failed to register admin" },
      { status: 500 }
    );
  }
}
