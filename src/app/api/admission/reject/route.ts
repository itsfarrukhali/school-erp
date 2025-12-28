// src/app/api/admission/reject/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import prisma from "@/lib/prisma";
import { z } from "zod";

const rejectAdmissionSchema = z.object({
  admissionId: z.string().min(1, "Admission ID is required"),
  rejectionReason: z.string().min(1, "Rejection reason is required"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to reject admissions
    const allowedRoles = [
      "SUPERADMIN",
      "ADMIN",
      "SCHOOLADMIN",
      "PRINCIPAL",
      "ADMISSIONOFFICER",
    ];

    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "You don't have permission to reject admissions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = rejectAdmissionSchema.parse(body);

    // Get admission record
    const admission = await (prisma as any).studentAdmission.findUnique({
      where: { id: validatedData.admissionId },
    });

    if (!admission) {
      return NextResponse.json({ error: "Admission not found" }, { status: 404 });
    }

    if (admission.status === "ENROLLED") {
      return NextResponse.json(
        { error: "Cannot reject an enrolled student" },
        { status: 400 }
      );
    }

    // Update admission record
    const updatedAdmission = await (prisma as any).studentAdmission.update({
      where: { id: admission.id },
      data: {
        status: "REJECTED",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        rejectionReason: validatedData.rejectionReason,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "StudentAdmission",
        entityId: admission.id,
        action: "REJECT",
        performedBy: session.user.id,
        schoolId: admission.schoolId,
        before: admission,
        after: updatedAdmission,
        note: `Rejected admission for ${admission.studentName}: ${validatedData.rejectionReason}`,
      },
    });

    return NextResponse.json({
      success: true,
      admission: updatedAdmission,
      message: "Admission rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting admission:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to reject admission" },
      { status: 500 }
    );
  }
}
