// src/app/api/fee/generate-voucher/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import prisma from "@/lib/prisma";
import { generateSequentialPaymentCode } from "@/lib/payment-code-generator";
import { z } from "zod";

const generateVoucherSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  month: z.string().optional(), // e.g., "2024-01"
  academicYear: z.string().optional(), // e.g., "2024-2025"
  feeStructureId: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  dueDate: z.string().datetime("Invalid due date"),
  discountApplied: z.number().min(0).default(0),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to generate vouchers
    const allowedRoles = [
      "SUPERADMIN",
      "ADMIN",
      "SCHOOLADMIN",
      "PRINCIPAL",
      "ACCOUNTANT",
      "ADMISSIONOFFICER",
    ];

    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "You don't have permission to generate vouchers" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = generateVoucherSchema.parse(body);

    // Get student details
    const student = await prisma.student.findUnique({
      where: { id: validatedData.studentId },
      include: {
        school: true,
        campus: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Generate unique payment code
    const paymentCode = await generateSequentialPaymentCode(student.schoolId);

    // Generate voucher number
    const voucherCount = await prisma.voucher.count({
      where: { schoolId: student.schoolId },
    });
    const voucherNumber = `VCH-${student.school.code}-${(voucherCount + 1)
      .toString()
      .padStart(6, "0")}`;

    // Calculate amount due
    const amountDue = validatedData.amount - validatedData.discountApplied;

    // Create voucher
    const voucher = await prisma.voucher.create({
      data: {
        voucherNumber,
        paymentCode,
        schoolId: student.schoolId,
        campusId: student.campusId,
        studentId: student.id,
        feeStructureId: validatedData.feeStructureId,
        month: validatedData.month,
        academicYear: validatedData.academicYear,
        issueDate: new Date(),
        dueDate: new Date(validatedData.dueDate),
        amountExpected: validatedData.amount,
        discountApplied: validatedData.discountApplied,
        amountDue,
        status: "PENDING",
        createdBy: session.user.id,
      },
      include: {
        student: {
          select: {
            studentName: true,
            grNumber: true,
            class: {
              select: {
                name: true,
                section: true,
              },
            },
          },
        },
        school: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "Voucher",
        entityId: voucher.id,
        action: "CREATE",
        performedBy: session.user.id,
        schoolId: student.schoolId,
        after: voucher,
        note: `Generated voucher ${voucherNumber} for student ${student.studentName}`,
      },
    });

    return NextResponse.json({
      success: true,
      voucher,
      message: "Voucher generated successfully",
    });
  } catch (error) {
    console.error("Error generating voucher:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate voucher" },
      { status: 500 }
    );
  }
}
