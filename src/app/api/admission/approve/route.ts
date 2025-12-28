// src/app/api/admission/approve/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { nanoid } from "nanoid";
import { Status, Role } from "@prisma/client";

const approveAdmissionSchema = z.object({
  admissionId: z.string().min(1, "Admission ID is required"),
  classId: z.string().min(1, "Class ID is required"),
  notes: z.string().optional(),
});

/**
 * Generate GR Number (General Register Number)
 * Format: SCHOOL_CODE-YEAR-SEQUENCE
 */
async function generateGRNumber(schoolId: string): Promise<string> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { code: true },
  });

  if (!school) {
    throw new Error("School not found");
  }

  const year = new Date().getFullYear();
  const count = await prisma.student.count({
    where: { schoolId },
  });

  const sequence = (count + 1).toString().padStart(5, "0");
  return `${school.code}-${year}-${sequence}`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to approve admissions
    const allowedRoles = [
      "SUPERADMIN",
      "ADMIN",
      "SCHOOLADMIN",
      "PRINCIPAL",
      "ADMISSIONOFFICER",
    ];

    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "You don't have permission to approve admissions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = approveAdmissionSchema.parse(body);

    // Get admission record
    const admission = await (prisma as any).studentAdmission.findUnique({
      where: { id: validatedData.admissionId },
    });

    if (!admission) {
      return NextResponse.json({ error: "Admission not found" }, { status: 404 });
    }

    if (admission.status === "ENROLLED") {
      return NextResponse.json(
        { error: "Student already enrolled" },
        { status: 400 }
      );
    }

    // Generate GR Number
    const grNumber = await generateGRNumber(admission.schoolId);

    // Generate student ID
    const studentId = nanoid();
    const userId = nanoid();

    // Create user account for student
    const user = await prisma.user.create({
      data: {
        id: userId,
        uid: `STU-${grNumber}`,
        username: `student_${grNumber.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
        firstName: admission.studentName.split(" ")[0],
        lastName: admission.studentName.split(" ").slice(1).join(" ") || "",
        fullName: admission.studentName,
        email: admission.email || `${grNumber.toLowerCase()}@temp.school.edu`,
        password: "$2a$10$defaultpasswordhash", // TODO: Generate proper password
        role: Role.STUDENT,
        gender: admission.gender,
        dob: admission.dateOfBirth,
        phoneNo: admission.phoneNumber,
        address: admission.address as any,
        status: Status.ACTIVE,
      },
    });

    // Create student record
    const student = await prisma.student.create({
      data: {
        id: studentId,
        studentId: `STU-${studentId.slice(0, 8)}`,
        grNumber,
        admissionNo: admission.admissionNo,
        studentName: admission.studentName,
        dateOfBirth: admission.dateOfBirth,
        gender: admission.gender,
        religion: admission.religion,
        nationality: admission.nationality,
        address: admission.address as any,
        phoneNumber: admission.phoneNumber,
        email: admission.email,
        userId: user.id,
        schoolId: admission.schoolId,
        campusId: admission.campusId,
        classId: validatedData.classId,
        status: Status.ACTIVE,
      },
    });

    // Update admission record
    await (prisma as any).studentAdmission.update({
      where: { id: admission.id },
      data: {
        status: "ENROLLED",
        grNumber,
        enrolledStudentId: student.id,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        notes: validatedData.notes,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "StudentAdmission",
        entityId: admission.id,
        action: "APPROVE",
        performedBy: session.user.id,
        schoolId: admission.schoolId,
        before: admission,
        after: { status: "ENROLLED", grNumber, studentId: student.id },
        note: `Approved admission and enrolled student ${admission.studentName} with GR Number ${grNumber}`,
      },
    });

    return NextResponse.json({
      success: true,
      student,
      grNumber,
      message: "Admission approved and student enrolled successfully",
    });
  } catch (error) {
    console.error("Error approving admission:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to approve admission" },
      { status: 500 }
    );
  }
}
