// src/app/api/v1/users/register/principal/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { registerPrincipalSchema } from "@/validations/user";
import { generateUserId } from "@/lib/utils/id-generator";
import { hashPassword } from "@/utils/password";
import { Prisma } from "@prisma/client";

/**
 * POST - Register Principal or School Admin
 * Only SuperAdmin and Admin can register principals/school admins
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only SuperAdmin and Admin can register principals
    if (!["SUPERADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { message: "Only SuperAdmin and Admin can register principals" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = registerPrincipalSchema.parse(body);

    // Check if school exists
    const school = await prisma.school.findUnique({
      where: { id: validatedData.schoolId },
    });

    if (!school) {
      return NextResponse.json({ message: "School not found" }, { status: 404 });
    }

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
    const uid = generateUserId(validatedData.role);

    // Create user and role-specific record in transaction
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
          role: validatedData.role,
          gender: validatedData.gender,
          dob: validatedData.dob ? new Date(validatedData.dob) : null,
          phoneNo: validatedData.phoneNo,
          designation:
            validatedData.role === "PRINCIPAL"
              ? "Principal"
              : "School Administrator",
          address: validatedData.address || Prisma.JsonNull,
          status: "ACTIVE",
          isEmailVerified: false, // Require email verification
        },
      });

      // Create UserSchool relationship
      await tx.userSchool.create({
        data: {
          userId: user.id,
          schoolId: validatedData.schoolId,
          roleForSchool: validatedData.role,
        },
      });

      // If campus is selected, create UserCampus relationship
      if (validatedData.campusId) {
        await tx.userCampus.create({
          data: {
            userId: user.id,
            campusId: validatedData.campusId,
            roleAtCampus: validatedData.role,
          },
        });
      }

      // If School Admin, create SchoolAdmin record
      if (validatedData.role === "SCHOOLADMIN") {
        await tx.schoolAdmin.create({
          data: {
            userId: user.id,
            schoolId: validatedData.schoolId,
          },
        });
      }

      // Get default role permissions and assign to user
      const rolePermissions = await tx.rolePermission.findMany({
        where: {
          role: validatedData.role,
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
            school: school.name,
          },
          note: `${
            validatedData.role === "PRINCIPAL" ? "Principal" : "School Admin"
          } "${user.fullName}" registered for school "${school.name}"`,
          schoolId: validatedData.schoolId,
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
        message: `${
          validatedData.role === "PRINCIPAL" ? "Principal" : "School Admin"
        } registered successfully. Please check your email for verification code.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering principal:", error);
    if (error instanceof Error && error.name === "ZodError") {
      console.error("Zod Validation Error:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { message: "Validation failed", details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Failed to register principal" },
      { status: 500 }
    );
  }
}
