// src/app/api/v1/staff/register-teacher/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { teacherRegistrationSchema } from "@/validations/auth/auth";
import { hashPassword } from "@/utils/password";
import { generateVerificationCode } from "@/utils/generateVerifyCodes";
import { generateUID, generateTeacherID } from "@/utils/generateIds";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";
import { requireAuth, checkPermission } from "@/lib/auth";
import { createAuditLog } from "@/utils/audit";
import type { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth();

    const allowedRoles = ["PRINCIPAL", "CAMPUSHEAD", "SCHOOLADMIN"];
    const hasRole = allowedRoles.includes(currentUser.role);
    const hasCreatePermission = await checkPermission("create:teacher");

    if (!hasRole && !hasCreatePermission) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Insufficient permissions to create teacher",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = teacherRegistrationSchema.safeParse(body);

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

    const {
      username,
      email,
      password,
      firstName,
      lastName,
      gender,
      phoneNo,
      dob,
      address,
      designation,
      schoolId,
      campusId,
      qualifications,
      joiningDate,
      salary,
    } = validationResult.data;

    const hasSchoolAccess =
      currentUser.schools.some((s) => s.schoolId === schoolId) ||
      currentUser.role === "ADMIN" ||
      currentUser.role === "SUPERADMIN";

    if (!hasSchoolAccess) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "You don't have access to this school",
        },
        { status: 403 }
      );
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "School not found" },
        { status: 404 }
      );
    }

    if (campusId) {
      const campus = await prisma.campus.findUnique({
        where: { id: campusId },
      });

      if (!campus || campus.schoolId !== schoolId) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "Campus not found or doesn't belong to school",
          },
          { status: 404 }
        );
      }
    }

    const existingVerifiedUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username, isEmailVerified: true },
          { email, isEmailVerified: true },
        ],
      },
    });

    if (existingVerifiedUser) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message:
            existingVerifiedUser.username === username
              ? "Username already taken"
              : "Email already registered",
        },
        { status: 409 }
      );
    }

    const { unHashedCode, hashedCode, expiry } = generateVerificationCode();
    const hashedPassword = await hashPassword(password);

    let newUser;
    let teacherRecord;

    await prisma.$transaction(async (tx) => {
      const existingUnverifiedUser = await tx.user.findFirst({
        where: { email, isEmailVerified: false },
      });

      if (existingUnverifiedUser) {
        newUser = await tx.user.update({
          where: { id: existingUnverifiedUser.id },
          data: {
            username,
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`,
            password: hashedPassword,
            gender,
            phoneNo,
            dob: dob ? new Date(dob) : null,
            address: address ? JSON.parse(JSON.stringify(address)) : undefined,
            designation,
            role: "TEACHER",
            verificationCode: hashedCode,
            verificationCodeExpiry: expiry,
          },
        });
      } else {
        newUser = await tx.user.create({
          data: {
            uid: generateUID(),
            username,
            email,
            password: hashedPassword,
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`,
            gender,
            phoneNo,
            dob: dob ? new Date(dob) : null,
            address: address ? JSON.parse(JSON.stringify(address)) : undefined,
            designation,
            role: "TEACHER",
            verificationCode: hashedCode,
            verificationCodeExpiry: expiry,
            isEmailVerified: false,
            status: "ACTIVE",
          },
        });
      }

      teacherRecord = await tx.teacher.upsert({
        where: { userId: newUser.id },
        create: {
          teacherId: generateTeacherID(school.code),
          userId: newUser.id,
          schoolId,
          campusId: campusId || null,
          qualifications: qualifications
            ? JSON.parse(JSON.stringify(qualifications))
            : undefined,
          joiningDate: new Date(joiningDate),
          salary: salary || null,
          status: "ACTIVE",
        },
        update: {
          schoolId,
          campusId: campusId || null,
          qualifications: qualifications
            ? JSON.parse(JSON.stringify(qualifications))
            : undefined,
          joiningDate: new Date(joiningDate),
          salary: salary || null,
        },
      });

      await tx.userSchool.upsert({
        where: {
          userId_schoolId: {
            userId: newUser.id,
            schoolId,
          },
        },
        create: {
          userId: newUser.id,
          schoolId,
          roleForSchool: "TEACHER",
        },
        update: {},
      });

      if (campusId) {
        await tx.userCampus.upsert({
          where: {
            userId_campusId: {
              userId: newUser.id,
              campusId,
            },
          },
          create: {
            userId: newUser.id,
            campusId,
            roleAtCampus: "TEACHER",
          },
          update: {},
        });
      }

      await createAuditLog({
        entityType: "Teacher",
        entityId: teacherRecord.id,
        action: existingUnverifiedUser ? "UPDATE" : "CREATE",
        performedBy: currentUser.id,
        after: {
          teacherId: teacherRecord.teacherId,
          userId: newUser.id,
          schoolId,
          campusId,
        },
        note: `Teacher ${existingUnverifiedUser ? "updated" : "created"} by ${
          currentUser.role
        }`,
        schoolId,
      });
    });

    const emailResponse = await sendVerificationEmail(
      email,
      username,
      unHashedCode
    );

    if (!emailResponse.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Teacher created but failed to send verification email",
        },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          uid: newUser!.uid,
          teacherId: teacherRecord!.teacherId,
          username: newUser!.username,
          email: newUser!.email,
          role: newUser!.role,
        },
        message: "Teacher registered successfully. Verification email sent.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in Teacher registration:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Please login to continue",
        },
        { status: 401 }
      );
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "An error occurred during registration",
      },
      { status: 500 }
    );
  }
}
