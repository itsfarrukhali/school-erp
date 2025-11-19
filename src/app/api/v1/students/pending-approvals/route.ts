// src/app/api/v1/students/pending-approvals/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import type { ApiResponse } from "@/types";

export async function GET() {
  try {
    const currentUser = await requireAuth();

    const allowedRoles = [
      "ADMISSIONOFFICER",
      "PRINCIPAL",
      "CAMPUSHEAD",
      "SCHOOLADMIN",
    ];
    if (!allowedRoles.includes(currentUser.role)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Insufficient permissions",
        },
        { status: 403 }
      );
    }

    const schoolIds = currentUser.schools.map((s) => s.schoolId);

    const pendingStudents = await prisma.student.findMany({
      where: {
        status: "INACTIVE",
        schoolId: { in: schoolIds },
      },
      include: {
        user: {
          select: {
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
          },
        },
        school: {
          select: {
            name: true,
            code: true,
          },
        },
        campus: {
          select: {
            name: true,
          },
        },
        class: {
          select: {
            name: true,
            grade: true,
            section: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: pendingStudents,
        message: `Found ${pendingStudents.length} pending approvals`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching pending approvals:", error);

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
        message: "An error occurred",
      },
      { status: 500 }
    );
  }
}
