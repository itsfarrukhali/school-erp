// src/app/api/admission/submit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import prisma from "@/lib/prisma";
import { z } from "zod";

const submitAdmissionSchema = z.object({
  studentName: z.string().min(1, "Student name is required"),
  fatherName: z.string().min(1, "Father name is required"),
  motherName: z.string().min(1, "Mother name is required"),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHERS"]),
  religion: z.enum(["ISLAM", "CHRISTIANITY", "HINDUISM", "BUDDHISM", "JAINISM", "ZOROASTRIANISM", "OTHERS"]).optional(),
  nationality: z.enum(["PAKISTANI", "AFGHANISTANI", "CHINESE", "IRANIAN", "INDIAN", "USA", "OTHER"]).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
  }),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email().optional(),
  previousSchool: z.string().optional(),
  previousClass: z.string().optional(),
  classAppliedFor: z.string().min(1, "Class applied for is required"),
  schoolId: z.string().min(1, "School ID is required"),
  campusId: z.string().optional(),
  documents: z.any().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = submitAdmissionSchema.parse(body);

    // Determine status based on user role
    let status: "INQUIRY" | "PENDING_APPROVAL" | "APPROVED" = "INQUIRY";
    let admissionNo: string | undefined;
    let inquiryNo: string | undefined;

    const userRole = session.user.role;

    // Teachers submit for approval
    if (userRole === "TEACHER") {
      status = "PENDING_APPROVAL";
    }
    // Principal, Admission Officer, Admin can directly approve
    else if (
      ["PRINCIPAL", "ADMISSIONOFFICER", "ADMIN", "SUPERADMIN", "SCHOOLADMIN"].includes(
        userRole
      )
    ) {
      status = "APPROVED";
    }

    // Generate inquiry/admission number
    const count = await (prisma as any).studentAdmission.count({
      where: { schoolId: validatedData.schoolId },
    });

    if (status === "INQUIRY") {
      inquiryNo = `INQ-${new Date().getFullYear()}-${(count + 1)
        .toString()
        .padStart(5, "0")}`;
    } else {
      admissionNo = `ADM-${new Date().getFullYear()}-${(count + 1)
        .toString()
        .padStart(5, "0")}`;
    }

    // Create admission record
    const admission = await (prisma as any).studentAdmission.create({
      data: {
        studentName: validatedData.studentName,
        fatherName: validatedData.fatherName,
        motherName: validatedData.motherName,
        dateOfBirth: validatedData.dateOfBirth
          ? new Date(validatedData.dateOfBirth)
          : undefined,
        gender: validatedData.gender,
        religion: validatedData.religion,
        nationality: validatedData.nationality,
        address: validatedData.address,
        phoneNumber: validatedData.phoneNumber,
        email: validatedData.email,
        previousSchool: validatedData.previousSchool,
        previousClass: validatedData.previousClass,
        classAppliedFor: validatedData.classAppliedFor,
        status,
        submittedBy: session.user.id,
        submittedByRole: userRole,
        schoolId: validatedData.schoolId,
        campusId: validatedData.campusId,
        documents: validatedData.documents,
        notes: validatedData.notes,
        admissionNo,
        inquiryNo,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "StudentAdmission",
        entityId: admission.id,
        action: "CREATE",
        performedBy: session.user.id,
        schoolId: validatedData.schoolId,
        after: admission,
        note: `Submitted admission for ${validatedData.studentName}`,
      },
    });

    return NextResponse.json({
      success: true,
      admission,
      message:
        status === "PENDING_APPROVAL"
          ? "Admission submitted for approval"
          : status === "APPROVED"
          ? "Admission approved"
          : "Inquiry submitted",
    });
  } catch (error) {
    console.error("Error submitting admission:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit admission" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve admissions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");
    const status = searchParams.get("status");
    const submittedBy = searchParams.get("submittedBy");

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    const where: any = { schoolId };
    if (status) {
      where.status = status;
    }
    if (submittedBy) {
      where.submittedBy = submittedBy;
    }

    const admissions = await prisma.studentAdmission.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      admissions,
    });
  } catch (error) {
    console.error("Error fetching admissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch admissions" },
      { status: 500 }
    );
  }
}
