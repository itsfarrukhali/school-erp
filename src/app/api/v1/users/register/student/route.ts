// src/app/api/v1/users/register/student/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { enrollStudentSchema } from "@/validations/user";
import {
  generateUserId,
  generateStudentId,
  generateGrNumber,
  generateFamilyId,
  generateUsername,
} from "@/lib/utils/id-generator";
import { hashPassword } from "@/utils/password";
import { Prisma } from "@prisma/client";

/**
 * POST - Enroll Student (Direct enrollment, bypassing admission workflow)
 * Allowed by: SuperAdmin, Admin, Principal, School Admin, Admission Officer, Teacher
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to enroll students
    const allowedRoles = [
      "SUPERADMIN",
      "ADMIN",
      "PRINCIPAL",
      "SCHOOLADMIN",
      "ADMISSIONOFFICER",
      "TEACHER",
    ];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "You don't have permission to enroll students" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = enrollStudentSchema.parse(body);

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

    // If class is provided, verify it belongs to the school
    if (validatedData.classId) {
      const classRecord = await prisma.class.findFirst({
        where: {
          id: validatedData.classId,
          schoolId: validatedData.schoolId,
        },
      });
      if (!classRecord) {
        return NextResponse.json(
          { error: "Class not found or doesn't belong to this school" },
          { status: 404 }
        );
      }
    }

    // Check if email already exists (if provided)
    if (validatedData.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        );
      }
    }

    // Get next GR number sequence
    const lastStudent = await prisma.student.findFirst({
      where: { schoolId: validatedData.schoolId },
      orderBy: { createdAt: "desc" },
    });

    let sequence = 1;
    if (lastStudent?.grNumber) {
      const parts = lastStudent.grNumber.split("-");
      if (parts.length === 3) {
        sequence = parseInt(parts[2]) + 1;
      }
    }

    // Generate unique IDs
    const uid = generateUserId("STUDENT");
    const studentId = generateStudentId(school.code);
    const grNumber = generateGrNumber(school.code, sequence);
    const username = generateUsername(
      validatedData.firstName,
      validatedData.lastName
    );

    // Hash the password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user, student, and family records in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create or find family
      const familyId = generateFamilyId();
      const family = await tx.family.create({
        data: {
          familyId,
          fatherName: validatedData.fatherName,
          motherName: validatedData.motherName,
          guardianName: validatedData.fatherName,
          guardianRelation: "Father",
          kidsCount: 1,
          nationality: validatedData.nationality,
          address: validatedData.address || {},
          primaryPhone: validatedData.guardianPhone,
          email: validatedData.email,
        },
      });

      // Create the user
      const user = await tx.user.create({
        data: {
          uid,
          username,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          fullName: `${validatedData.firstName} ${validatedData.lastName}`,
          email: validatedData.email || `${username}@student.local`,
          password: hashedPassword,
          role: "STUDENT",
          gender: validatedData.gender,
          dob: validatedData.dateOfBirth
            ? new Date(validatedData.dateOfBirth)
            : null,
          phoneNo: validatedData.phoneNumber,
          designation: "Student",
          address: validatedData.address || Prisma.JsonNull,
          status: "ACTIVE",
          isEmailVerified: !validatedData.email, // Auto-verify if no real email
        },
      });

      // Create Student record
      const student = await tx.student.create({
        data: {
          studentId,
          grNumber,
          studentName: validatedData.studentName,
          shortName: validatedData.firstName,
          dateOfBirth: validatedData.dateOfBirth
            ? new Date(validatedData.dateOfBirth)
            : null,
          gender: validatedData.gender,
          religion: validatedData.religion,
          nationality: validatedData.nationality,
          address: validatedData.address || {},
          phoneNumber: validatedData.phoneNumber,
          email: validatedData.email,
          status: "ACTIVE",
          userId: user.id,
          schoolId: validatedData.schoolId,
          campusId: validatedData.campusId || null,
          classId: validatedData.classId || null,
          familyId: family.id,
        },
      });

      // Create UserSchool relationship
      await tx.userSchool.create({
        data: {
          userId: user.id,
          schoolId: validatedData.schoolId,
          roleForSchool: "STUDENT",
        },
      });

      // If campus is assigned, create UserCampus relationship
      if (validatedData.campusId) {
        await tx.userCampus.create({
          data: {
            userId: user.id,
            campusId: validatedData.campusId,
            roleAtCampus: "STUDENT",
          },
        });
      }

      // Get default role permissions and assign to user
      const rolePermissions = await tx.rolePermission.findMany({
        where: {
          role: "STUDENT",
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
          entityType: "Student",
          entityId: student.id,
          action: "CREATE",
          performedBy: session.user.id,
          after: {
            studentId: student.studentId,
            grNumber: student.grNumber,
            userId: user.id,
            email: user.email,
            school: school.name,
          },
          note: `Student "${user.fullName}" enrolled with GR# ${grNumber}`,
          schoolId: validatedData.schoolId,
        },
      });

      return { user, student, family };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.user.id,
          uid: result.user.uid,
          studentId: result.student.studentId,
          grNumber: result.student.grNumber,
          username: result.user.username,
          email: result.user.email,
          fullName: result.user.fullName,
          role: result.user.role,
        },
        message: "Student enrolled successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error enrolling student:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to enroll student" },
      { status: 500 }
    );
  }
}
