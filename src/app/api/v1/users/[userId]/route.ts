// src/app/api/v1/users/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { updateUserStatusSchema } from "@/validations/user";

type Params = Promise<{ userId: string }>;

/**
 * GET - Get user details
 */
export async function GET(
  _request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await segmentData.params;
    const { userId } = params;

    // Users can view their own profile, or admins can view others
    const canView =
      session.user.id === userId ||
      ["SUPERADMIN", "ADMIN", "PRINCIPAL", "SCHOOLADMIN"].includes(
        session.user.role
      );

    if (!canView) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        uid: true,
        username: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        role: true,
        gender: true,
        dob: true,
        phoneNo: true,
        designation: true,
        address: true,
        avatarUrl: true,
        status: true,
        isEmailVerified: true,
        lastLogin: true,
        createdAt: true,
        schools: {
          include: {
            school: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        campuses: {
          include: {
            campus: {
              select: {
                id: true,
                name: true,
                campusCode: true,
              },
            },
          },
        },
        teacher: true,
        student: true,
        schoolAdmin: true,
        accountant: true,
        admissionOfficer: true,
        computerOperator: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // For non-super admins, check school access
    if (!["SUPERADMIN", "ADMIN"].includes(session.user.role)) {
      const hasAccess = user.schools.some((us) =>
        session.user.schools.some((ss) => ss.schoolId === us.schoolId)
      );
      if (!hasAccess && session.user.id !== userId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Remove password from response
    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update user status or profile
 */
export async function PATCH(
  request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await segmentData.params;
    const { userId } = params;

    const body = await request.json();

    // Check if this is a status update or profile update
    const isStatusUpdate = "status" in body;

    if (isStatusUpdate) {
      // Only admins and principals can change user status
      const allowedRoles = ["SUPERADMIN", "ADMIN", "PRINCIPAL", "SCHOOLADMIN"];
      if (!allowedRoles.includes(session.user.role)) {
        return NextResponse.json(
          { error: "You don't have permission to change user status" },
          { status: 403 }
        );
      }

      const validatedData = updateUserStatusSchema.parse({
        userId,
        status: body.status,
      });

      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          schools: true,
        },
      });

      if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Prevent SuperAdmin status changes unless by SuperAdmin
      if (
        targetUser.role === "SUPERADMIN" &&
        session.user.role !== "SUPERADMIN"
      ) {
        return NextResponse.json(
          { error: "Cannot modify SuperAdmin status" },
          { status: 403 }
        );
      }

      // For non-super admins, verify school access
      if (!["SUPERADMIN", "ADMIN"].includes(session.user.role)) {
        const hasAccess = targetUser.schools.some((us) =>
          session.user.schools.some((ss) => ss.schoolId === us.schoolId)
        );
        if (!hasAccess) {
          return NextResponse.json(
            { error: "You don't have access to this user's school" },
            { status: 403 }
          );
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { status: validatedData.status },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          entityType: "User",
          entityId: userId,
          action: "STATUS_UPDATE",
          performedBy: session.user.id,
          before: { status: targetUser.status },
          after: { status: updatedUser.status },
          note: `User "${targetUser.fullName}" status changed from ${targetUser.status} to ${validatedData.status}`,
          schoolId: targetUser.schools[0]?.schoolId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "User status updated successfully",
        data: { status: updatedUser.status },
      });
    } else {
      // Profile update - users can update their own profile
      const canUpdate =
        session.user.id === userId ||
        ["SUPERADMIN", "ADMIN", "PRINCIPAL", "SCHOOLADMIN"].includes(
          session.user.role
        );

      if (!canUpdate) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      const allowedFields = [
        "firstName",
        "lastName",
        "phoneNo",
        "address",
        "avatarUrl",
        "dob",
      ];

      const updateData: Record<string, unknown> = {};
      for (const field of allowedFields) {
        if (field in body) {
          if (field === "dob" && body.dob) {
            updateData[field] = new Date(body.dob);
          } else {
            updateData[field] = body[field];
          }
        }
      }

      // Update fullName if firstName or lastName changed
      if (updateData.firstName || updateData.lastName) {
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true },
        });
        if (currentUser) {
          updateData.fullName = `${
            updateData.firstName || currentUser.firstName
          } ${updateData.lastName || currentUser.lastName}`;
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          uid: true,
          firstName: true,
          lastName: true,
          fullName: true,
          phoneNo: true,
          address: true,
          avatarUrl: true,
          dob: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
      });
    }
  } catch (error) {
    console.error("Error updating user:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a user (Soft delete by setting status to DELETED)
 * Only SUPERADMIN can delete users
 * Implements soft delete pattern for data integrity and audit trail
 */
export async function DELETE(
  request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    // Only SUPERADMIN can delete users
    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "Only Super Admins can delete users",
        },
        { status: 403 }
      );
    }

        const params = await segmentData.params;
    const { userId } = params;

    // Prevent self-deletion
    if (session.user.id === userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Operation",
          message: "You cannot delete your own account",
        },
        { status: 400 }
      );
    }

    // Fetch the user with all related data for validation
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        schools: {
          include: {
            school: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        campuses: true,
        teacher: true,
        student: true,
        parent: true,
        schoolAdmin: true,
        accountant: true,
        admissionOfficer: true,
        computerOperator: true,
        userPermissions: true,
      },
    });

    if (!userToDelete) {
      return NextResponse.json(
        {
          success: false,
          error: "Not Found",
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // Prevent deletion of other SUPERADMIN users
    if (userToDelete.role === "SUPERADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "Cannot delete Super Admin accounts",
        },
        { status: 403 }
      );
    }

    // Check if user is already deleted
    if (userToDelete.status === "DELETED") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Operation",
          message: "User is already deleted",
        },
        { status: 400 }
      );
    }

    // Use transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Soft delete the user (set status to DELETED)
      const deletedUser = await tx.user.update({
        where: { id: userId },
        data: {
          status: "DELETED",
          // Append _DELETED_timestamp to make unique fields available for reuse
          email: `${userToDelete.email}_DELETED_${Date.now()}`,
          username: `${userToDelete.username}_DELETED_${Date.now()}`,
          uid: `${userToDelete.uid}_DELETED_${Date.now()}`,
        },
        select: {
          id: true,
          uid: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
        },
      });

      // 2. Delete related role-specific records
      if (userToDelete.teacher) {
        await tx.teacher.update({
          where: { id: userToDelete.teacher.id },
          data: { status: "DELETED" },
        });
      }

      if (userToDelete.student) {
        await tx.student.update({
          where: { id: userToDelete.student.id },
          data: { status: "DELETED" },
        });
      }

      if (userToDelete.schoolAdmin) {
        await tx.schoolAdmin.delete({
          where: { id: userToDelete.schoolAdmin.id },
        });
      }

      if (userToDelete.accountant) {
        await tx.accountant.delete({
          where: { id: userToDelete.accountant.id },
        });
      }

      if (userToDelete.admissionOfficer) {
        await tx.admissionOfficer.delete({
          where: { id: userToDelete.admissionOfficer.id },
        });
      }

      if (userToDelete.computerOperator) {
        await tx.computerOperator.delete({
          where: { id: userToDelete.computerOperator.id },
        });
      }

      if (userToDelete.parent) {
        await tx.parent.delete({
          where: { id: userToDelete.parent.id },
        });
      }

      // 3. Remove user-school and user-campus associations
      await tx.userSchool.deleteMany({
        where: { userId },
      });

      await tx.userCampus.deleteMany({
        where: { userId },
      });

      // 4. Remove user-specific permissions
      await tx.userPermission.deleteMany({
        where: { userId },
      });

      // 5. Create comprehensive audit log
      await tx.auditLog.create({
        data: {
          entityType: "User",
          entityId: userId,
          action: "DELETE",
          performedBy: session.user.id,
          before: {
            uid: userToDelete.uid,
            fullName: userToDelete.fullName,
            email: userToDelete.email,
            role: userToDelete.role,
            status: userToDelete.status,
            schools: userToDelete.schools.map((us) => ({
              schoolId: us.schoolId,
              schoolName: us.school.name,
              schoolCode: us.school.code,
            })),
            hasTeacher: !!userToDelete.teacher,
            hasStudent: !!userToDelete.student,
            hasParent: !!userToDelete.parent,
          },
          after: {
            status: "DELETED",
            deletedAt: new Date().toISOString(),
          },
          note: `User "${userToDelete.fullName}" (${userToDelete.role}) was deleted by Super Admin`,
          schoolId: userToDelete.schools[0]?.schoolId || null,
        },
      });

      return deletedUser;
    });

    return NextResponse.json(
      {
        success: true,
        message: "User deleted successfully",
        data: {
          id: result.id,
          fullName: result.fullName,
          status: result.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes("Foreign key constraint")) {
        return NextResponse.json(
          {
            success: false,
            error: "Constraint Violation",
            message:
              "Cannot delete user due to existing dependencies. Please remove related records first.",
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to delete user",
      },
      { status: 500 }
    );
  }
}
