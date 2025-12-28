// src/app/api/v1/users/[userId]/permissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getVisiblePermissionCategories } from "@/lib/utils/permission-filter";

type Params = Promise<{ userId: string }>;

// GET - Fetch user permissions
export async function GET(
  request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ 
        success: false,
        message: "Unauthorized" 
      }, { status: 401 });
    }

    const params = await segmentData.params;
    const { userId } = params;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        uid: true,
        fullName: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ 
        success: false,
        message: "User not found" 
      }, { status: 404 });
    }

    // Get visible categories for the current user (who is viewing)
    const viewerVisibleCategories = getVisiblePermissionCategories(session.user.role);
    
    console.log(`[Permissions API] Viewer Role: ${session.user.role}`);
    console.log(`[Permissions API] Visible Categories:`, viewerVisibleCategories);

    // Get all permissions in visible categories
    let allPermissions = await prisma.permission.findMany({
      where: {
        category: {
          in: viewerVisibleCategories,
        },
      },
      include: {
        rolePermissions: {
          where: { role: user.role },
        },
        userPermissions: {
          where: { userId: user.id },
        },
      },
      orderBy: [
        { category: "asc" },
        { label: "asc" },
      ],
    });

    console.log(`[Permissions API] Found ${allPermissions.length} permissions matching categories.`);

    // Fallback: If no permissions found but user is SUPERADMIN, fetch ALL permissions
    // This handles cases where categories might be null or mismatched in DB
    if (allPermissions.length === 0 && session.user.role === "SUPERADMIN") {
      console.log(`[Permissions API] No permissions found by category. Fetching ALL permissions as fallback.`);
      allPermissions = await prisma.permission.findMany({
        include: {
          rolePermissions: {
            where: { role: user.role },
          },
          userPermissions: {
            where: { userId: user.id },
          },
        },
        orderBy: [
          { category: "asc" },
          { label: "asc" },
        ],
      });
      console.log(`[Permissions API] Fallback found ${allPermissions.length} permissions.`);
    }

    // Map permissions with their status
    const permissions = allPermissions.map((permission) => {
      const rolePermission = permission.rolePermissions[0];
      const userPermission = permission.userPermissions[0];

      const roleAllowed = rolePermission?.allowed ?? false;
      const userOverride = userPermission?.allowed;
      const finalAllowed = userOverride !== undefined ? userOverride : roleAllowed;

      return {
        id: permission.id,
        name: permission.name,
        label: permission.label,
        category: permission.category,
        description: permission.description,
        allowed: finalAllowed,
        source: userOverride !== undefined ? "user" : "role",
        isOverridden: userOverride !== undefined,
      };
    });

    // Group by category
    const groupedPermissions = permissions.reduce((acc, permission) => {
      const category = permission.category || "OTHER";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    }, {} as Record<string, typeof permissions>);

    return NextResponse.json({
      success: true,
      data: {
        user,
        permissions,
        groupedPermissions,
        summary: {
          total: permissions.length,
          allowed: permissions.filter((p) => p.allowed).length,
          denied: permissions.filter((p) => !p.allowed).length,
          overridden: permissions.filter((p) => p.isOverridden).length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to fetch user permissions",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// PATCH - Update user permissions
export async function PATCH(
  request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ 
        success: false,
        message: "Unauthorized" 
      }, { status: 401 });
    }

    // Only SUPERADMIN and ADMIN can update permissions
    if (!["SUPERADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { 
          success: false,
          message: "Insufficient permissions" 
        },
        { status: 403 }
      );
    }

    const params = await segmentData.params;
    const { userId } = params;
    const body = await request.json();
    const { permissions } = body;

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { 
          success: false,
          message: "Invalid request format" 
        },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ 
        success: false,
        message: "User not found" 
      }, { status: 404 });
    }

    // Update permissions in a transaction
    await prisma.$transaction(async (tx) => {
      for (const perm of permissions) {
        const { permissionId, allowed } = perm;

        // Check if user permission already exists
        const existing = await tx.userPermission.findFirst({
          where: {
            userId,
            permissionId,
          },
        });

        if (existing) {
          // Update existing
          await tx.userPermission.update({
            where: { id: existing.id },
            data: { allowed },
          });
        } else {
          // Create new
          await tx.userPermission.create({
            data: {
              userId,
              permissionId,
              allowed,
            },
          });
        }
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          entityType: "UserPermission",
          entityId: userId,
          action: "UPDATE",
          performedBy: session.user.id,
          after: { permissions },
          note: `Updated ${permissions.length} permission(s) for ${user.fullName}`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Permissions updated successfully",
    });
  } catch (error) {
    console.error("Error updating user permissions:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to update permissions",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
