// src/app/api/v1/users/register/teacher/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { registerTeacherSchema } from "@/validations/user";
import { generateUserId, generateTeacherId } from "@/lib/utils/id-generator";
import { hashPassword } from "@/utils/password";
import { Prisma } from "@prisma/client";

/**
 * POST - Register Teacher
 * Allowed by: SuperAdmin, Admin, Principal, School Admin, Campus Head, Operator
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to register teachers
    const allowedRoles = [
      "SUPERADMIN",
      "ADMIN",
      "PRINCIPAL",
      "SCHOOLADMIN",
      "CAMPUSHEAD",
      "COMPUTEROPERATOR",
    ];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "You don't have permission to register teachers" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = registerTeacherSchema.parse(body);

    // For non-super admins, verify school access
    if (!["SUPERADMIN", "ADMIN"].includes(session.user.role)) {
      const hasAccess = session.user.schools.some(
        (s) => s.schoolId === validatedData.schoolId
      );
      if (!hasAccess) {
        return NextResponse.json(
          { error: "You don't have access to this school" },
          { status: 403 }
        );
      }
    }

    // Check if school exists
    const school = await prisma.school.findUnique({
      where: { id: validatedData.schoolId },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // If campus is provided, verify it belongs to the school
    if (validatedData.campusId) {
      const campus = await prisma.campus.findFirst({
        where: {
          id: validatedData.campusId,
          schoolId: validatedData.schoolId,
        },
      });
      if (!campus) {
        return NextResponse.json(
          { error: "Campus not found or doesn't belong to this school" },
          { status: 404 }
        );
      }
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
          error:
            existingUser.email === validatedData.email
              ? "Email already exists"
              : "Username already exists",
        },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(validatedData.password);

    // Generate unique IDs
    const uid = generateUserId("TEACHER");
    const teacherId = generateTeacherId(school.code);

    // Create user and teacher record in transaction
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
          role: "TEACHER",
          gender: validatedData.gender,
          dob: validatedData.dob ? new Date(validatedData.dob) : null,
          phoneNo: validatedData.phoneNo,
          designation: "Teacher",
          address: validatedData.address || Prisma.JsonNull,
          status: "ACTIVE",
          isEmailVerified: false, // Require email verification
        },
      });

      // Create Teacher record
      const teacher = await tx.teacher.create({
        data: {
          teacherId,
          userId: user.id,
          schoolId: validatedData.schoolId,
          campusId: validatedData.campusId || null,
          qualifications: validatedData.qualifications
            ? { qualifications: validatedData.qualifications }
            : Prisma.JsonNull,
          joiningDate: new Date(validatedData.joiningDate),
          salary: validatedData.salary || null,
          status: "ACTIVE",
        },
      });

      // Create UserSchool relationship
      await tx.userSchool.create({
        data: {
          userId: user.id,
          schoolId: validatedData.schoolId,
          roleForSchool: "TEACHER",
        },
      });

      // If campus is assigned, create UserCampus relationship
      if (validatedData.campusId) {
        await tx.userCampus.create({
          data: {
            userId: user.id,
            campusId: validatedData.campusId,
            roleAtCampus: "TEACHER",
          },
        });
      }

      // Get default role permissions and assign to user
      const rolePermissions = await tx.rolePermission.findMany({
        where: {
          role: "TEACHER",
          allowed: true,
        },
      });

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
          entityType: "Teacher",
          entityId: teacher.id,
          action: "CREATE",
          performedBy: session.user.id,
          after: {
            teacherId: teacher.teacherId,
            userId: user.id,
            email: user.email,
            school: school.name,
          },
          note: `Teacher "${user.fullName}" registered with ID ${teacherId}`,
          schoolId: validatedData.schoolId,
        },
      });

      return { user, teacher };
    });

    // Send verification email (non-blocking)
    const { generateOTP, getOTPExpiry } = await import("@/lib/utils/otp");
    const { sendVerificationEmail } = await import("@/lib/email/email-service");
    
    const otp = generateOTP();
    const expiry = getOTPExpiry();
    
    // Update user with OTP
    await prisma.user.update({
      where: { id: result.user.id },
      data: {
        verificationCode: otp,
        verificationCodeExpiry: expiry,
        lastVerificationSent: new Date(),
      },
    });
    
    // Send email (don't block response)
    sendVerificationEmail(
      result.user.email,
      result.user.fullName || `${result.user.firstName} ${result.user.lastName}`,
      otp
    ).catch((error) => {
      console.error("Failed to send verification email:", error);
    });

    // Log OTP in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] Verification OTP for ${result.user.email}: ${otp}`);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.user.id,
          uid: result.user.uid,
          teacherId: result.teacher.teacherId,
          email: result.user.email,
          username: result.user.username,
          fullName: result.user.fullName,
          role: result.user.role,
        },
        message: "Teacher registered successfully. Please check your email for verification code.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering teacher:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to register teacher" },
      { status: 500 }
    );
  }
}
