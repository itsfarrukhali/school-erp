// src/app/api/v1/students/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { approvalSchema } from "@/validations/auth/auth";
import { requireAuth, checkPermission } from "@/lib/auth";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";
import { createAuditLog } from "@/utils/audit";
import { generateVerificationCode } from "@/utils/generateVerifyCodes";
import type { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth();

    const allowedRoles = [
      "ADMISSIONOFFICER",
      "PRINCIPAL",
      "CAMPUSHEAD",
      "SCHOOLADMIN",
    ];
    const hasRole = allowedRoles.includes(currentUser.role);
    const hasApprovePermission = await checkPermission("approve:student");

    if (!hasRole && !hasApprovePermission) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Insufficient permissions to approve students",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = approvalSchema.safeParse(body);

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

    const { studentId, approved, reason } = validationResult.data;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    if (student.status !== "INACTIVE") {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Student does not require approval" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      if (approved) {
        await tx.student.update({
          where: { id: studentId },
          data: { status: "ACTIVE" },
        });

        await tx.user.update({
          where: { id: student.userId },
          data: { status: "ACTIVE" },
        });

        const needsNewCode =
          !student.user?.verificationCodeExpiry ||
          student.user.verificationCodeExpiry < new Date();

        if (needsNewCode && student.user?.email && student.user?.username) {
          const { unHashedCode, hashedCode, expiry } =
            generateVerificationCode();

          await tx.user.update({
            where: { id: student.userId },
            data: {
              verificationCode: hashedCode,
              verificationCodeExpiry: expiry,
            },
          });

          await sendVerificationEmail(
            student.user.email,
            student.user.username,
            unHashedCode
          );
        }
      } else {
        await tx.student.update({
          where: { id: studentId },
          data: { status: "DELETED" },
        });

        await tx.user.update({
          where: { id: student.userId },
          data: { status: "DELETED" },
        });
      }

      await createAuditLog({
        entityType: "Student",
        entityId: studentId,
        action: approved ? "APPROVE" : "REJECT",
        performedBy: currentUser.id,
        before: { status: student.status },
        after: { status: approved ? "ACTIVE" : "DELETED" },
        note:
          reason ||
          `Student ${approved ? "approved" : "rejected"} by ${
            currentUser.role
          }`,
        schoolId: student.schoolId,
      });
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: approved
          ? "Student approved successfully"
          : "Student rejected successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in student approval:", error);

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
        message: "An error occurred during approval",
      },
      { status: 500 }
    );
  }
}
