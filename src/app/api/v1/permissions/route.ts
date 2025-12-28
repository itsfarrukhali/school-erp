// src/app/api/v1/permissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET - Get all available permissions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and principals can view all permissions
    const allowedRoles = ["SUPERADMIN", "ADMIN", "PRINCIPAL", "SCHOOLADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "You don't have permission to view permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";

    const where = category ? { category } : {};

    const permissions = await prisma.permission.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Group by category
    const grouped = permissions.reduce(
      (acc, perm) => {
        const cat = perm.category || "General";
        if (!acc[cat]) {
          acc[cat] = [];
        }
        acc[cat].push(perm);
        return acc;
      },
      {} as Record<string, typeof permissions>
    );

    return NextResponse.json({
      success: true,
      data: permissions,
      grouped,
      categories: Object.keys(grouped),
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new permission (SuperAdmin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SuperAdmin can create permissions
    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Only SuperAdmin can create permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, label, category, description } = body;

    if (!name || !label) {
      return NextResponse.json(
        { error: "Name and label are required" },
        { status: 400 }
      );
    }

    // Check if permission already exists
    const existing = await prisma.permission.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Permission with this name already exists" },
        { status: 400 }
      );
    }

    const permission = await prisma.permission.create({
      data: {
        name,
        label,
        category: category || "General",
        description,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: permission,
        message: "Permission created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating permission:", error);
    return NextResponse.json(
      { error: "Failed to create permission" },
      { status: 500 }
    );
  }
}
