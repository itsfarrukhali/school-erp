// src/app/api/v1/students/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { studentRegistrationSchema } from "@/validations/auth/auth";
import { hashPassword } from "@/utils/password";
import { generateVerificationCode } from "@/utils/generateVerifyCodes";
import { generateUID, generateStudentID } from "@/utils/generateIds";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";
import { requireAuth, checkPermission } from "@/lib/auth";
import { createAuditLog } from "@/utils/audit";
import type { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth();

    const allowedRoles = [
      "TEACHER",
      "ADMISSIONOFFICER",
      "COMPUTEROPERATOR",
      "PRINCIPAL",
      "CAMPUSHEAD",
      "SCHOOLADMIN",
    ];
    const hasRole = allowedRoles.includes(currentUser.role);
    const hasCreatePermission = await checkPermission("create:student");

    if (!hasRole && !hasCreatePermission) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Insufficient permissions to create student",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = studentRegistrationSchema.safeParse(body);

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
      schoolId,
      campusId,
      classId,
      familyId,
      grNumber,
      admissionNo,
      religion,
      bloodGroup,
      nationality,
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

    const existingGR = await prisma.student.findUnique({
      where: {
        schoolId_grNumber: {
          schoolId,
          grNumber,
        },
      },
    });

    if (existingGR) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "GR Number already exists in this school" },
        { status: 409 }
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

    if (classId) {
      const classRecord = await prisma.class.findUnique({
        where: { id: classId },
      });

      if (!classRecord || classRecord.schoolId !== schoolId) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "Class not found or doesn't belong to school",
          },
          { status: 404 }
        );
      }
    }

    if (familyId) {
      const family = await prisma.family.findUnique({
        where: { id: familyId },
      });

      if (!family) {
        return NextResponse.json<ApiResponse>(
          { success: false, message: "Family not found" },
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

    const needsApproval = currentUser.role === "COMPUTEROPERATOR";
    const studentStatus = needsApproval ? "INACTIVE" : "ACTIVE";

    let newUser;
    let studentRecord;

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
            role: "STUDENT",
            verificationCode: hashedCode,
            verificationCodeExpiry: expiry,
            status: studentStatus,
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
            role: "STUDENT",
            verificationCode: hashedCode,
            verificationCodeExpiry: expiry,
            isEmailVerified: false,
            status: studentStatus,
          },
        });
      }

      studentRecord = await tx.student.upsert({
        where: { userId: newUser.id },
        create: {
          studentId: generateStudentID(school.code),
          userId: newUser.id,
          schoolId,
          campusId: campusId || null,
          classId: classId || null,
          familyId: familyId || null,
          grNumber,
          admissionNo: admissionNo || null,
          studentName: `${firstName} ${lastName}`,
          shortName: firstName,
          gender,
          dateOfBirth: dob ? new Date(dob) : null,
          religion: religion || null,
          bloodGroup: bloodGroup || null,
          nationality: nationality || "PAKISTANI",
          address: address ? JSON.parse(JSON.stringify(address)) : {},
          phoneNumber: phoneNo || null,
          email: email || null,
          status: studentStatus,
        },
        update: {
          schoolId,
          campusId: campusId || null,
          classId: classId || null,
          familyId: familyId || null,
          grNumber,
          admissionNo: admissionNo || null,
          studentName: `${firstName} ${lastName}`,
          dateOfBirth: dob ? new Date(dob) : null,
          religion: religion || null,
          bloodGroup: bloodGroup || null,
          nationality: nationality || "PAKISTANI",
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
          roleForSchool: "STUDENT",
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
            roleAtCampus: "STUDENT",
          },
          update: {},
        });
      }

      await createAuditLog({
        entityType: "Student",
        entityId: studentRecord.id,
        action: existingUnverifiedUser ? "UPDATE" : "CREATE",
        performedBy: currentUser.id,
        after: {
          studentId: studentRecord.studentId,
          grNumber: studentRecord.grNumber,
          userId: newUser.id,
          schoolId,
          needsApproval,
        },
        note: `Student ${existingUnverifiedUser ? "updated" : "created"} by ${
          currentUser.role
        }${needsApproval ? " - Awaiting approval" : ""}`,
        schoolId,
      });
    });

    if (!needsApproval) {
      const emailResponse = await sendVerificationEmail(
        email,
        username,
        unHashedCode
      );

      if (!emailResponse.success) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "Student created but failed to send verification email",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          uid: newUser!.uid,
          studentId: studentRecord!.studentId,
          grNumber: studentRecord!.grNumber,
          username: newUser!.username,
          email: newUser!.email,
          role: newUser!.role,
          needsApproval,
        },
        message: needsApproval
          ? "Student created. Awaiting approval from Admission Officer or Head."
          : "Student registered successfully. Verification email sent.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in Student registration:", error);

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
