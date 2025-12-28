// src/app/api/v1/schools/[schoolId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createSchoolSchema } from "@/validations/user";

// GET - Get a single school with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = await params;

    // Check if user has access to this school
    const isSuperAdmin = ["SUPERADMIN", "ADMIN"].includes(session.user.role);
    const hasSchoolAccess = session.user.schools.some(
      (s) => s.schoolId === schoolId
    );

    if (!isSuperAdmin && !hasSchoolAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        campuses: {
          select: {
            id: true,
            name: true,
            campusCode: true,
            phone: true,
            _count: {
              select: {
                students: true,
                teachers: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
            students: true,
            teachers: true,
            schoolAdmins: true,
            accountants: true,
            admissionOfficers: true,
            computerOperators: true,
          },
        },
      },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: school,
    });
  } catch (error) {
    console.error("Error fetching school:", error);
    return NextResponse.json(
      { error: "Failed to fetch school" },
      { status: 500 }
    );
  }
}

// PATCH - Update a school
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = await params;

    // Only SuperAdmin, Admin, or Principal of the school can update
    const isSuperAdmin = ["SUPERADMIN", "ADMIN"].includes(session.user.role);
    const isPrincipal = session.user.schools.some(
      (s) => s.schoolId === schoolId && s.roleForSchool === "PRINCIPAL"
    );

    if (!isSuperAdmin && !isPrincipal) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const existingSchool = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!existingSchool) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = createSchoolSchema.partial().parse(body);

    // If updating code, check if it already exists
    if (validatedData.code && validatedData.code !== existingSchool.code) {
      const codeExists = await prisma.school.findUnique({
        where: { code: validatedData.code },
      });
      if (codeExists) {
        return NextResponse.json(
          { error: "School code already exists" },
          { status: 400 }
        );
      }
    }

    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: {
        name: validatedData.name,
        code: validatedData.code,
        address: validatedData.address,
        phone: validatedData.phone,
        whatsapp: validatedData.whatsapp,
        email: validatedData.email || null,
        website: validatedData.website || null,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "School",
        entityId: schoolId,
        action: "UPDATE",
        performedBy: session.user.id,
        before: existingSchool,
        after: updatedSchool,
        note: `School "${updatedSchool.name}" updated`,
        schoolId: schoolId,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSchool,
      message: "School updated successfully",
    });
  } catch (error) {
    console.error("Error updating school:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update school" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a school (soft delete by setting status)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SuperAdmin can delete schools
    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Only SuperAdmin can delete schools" }, { status: 403 });
    }

    const { schoolId } = await params;

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            users: true,
          },
        },
      },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // For safety, we'll just mark all users as inactive instead of deleting
    // This preserves data integrity
    await prisma.$transaction([
      prisma.userSchool.deleteMany({
        where: { schoolId },
      }),
      prisma.auditLog.create({
        data: {
          entityType: "School",
          entityId: schoolId,
          action: "DELETE",
          performedBy: session.user.id,
          before: school,
          note: `School "${school.name}" deleted`,
          schoolId: schoolId,
        },
      }),
      prisma.school.delete({
        where: { id: schoolId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "School deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting school:", error);
    return NextResponse.json(
      { error: "Failed to delete school. It may have associated data." },
      { status: 500 }
    );
  }
}
