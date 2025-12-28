// src/app/api/v1/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role, Prisma } from "@prisma/client";

/**
 * GET - List users with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission to view users
    const allowedRoles = [
      "SUPERADMIN",
      "ADMIN",
      "PRINCIPAL",
      "SCHOOLADMIN",
      "CAMPUSHEAD",
      "ADMISSIONOFFICER",
      "COMPUTEROPERATOR",
    ];

    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "You don't have permission to view users" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") as Role | null;
    const schoolId = searchParams.get("schoolId") || "";
    const campusId = searchParams.get("campusId") || "";
    const status = searchParams.get("status") || "";

    const skip = (page - 1) * limit;

    // Build where clause with proper type safety
    const where: Prisma.UserWhereInput = {};

    // Search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { uid: { contains: search, mode: "insensitive" } },
      ];
    }

    // Role filter
    if (role) {
      where.role = role;
    }

    // Status filter
    if (status) {
      where.status = status as Prisma.EnumStatusFilter | undefined;
    }

    // School filter - for non-super admins, restrict to their schools
    if (!["SUPERADMIN", "ADMIN"].includes(session.user.role)) {
      const userSchoolIds = session.user.schools.map((s) => s.schoolId);
      where.schools = {
        some: {
          schoolId: schoolId
            ? { in: [schoolId].filter((id) => userSchoolIds.includes(id)) }
            : { in: userSchoolIds },
        },
      };
    } else if (schoolId) {
      where.schools = {
        some: {
          schoolId,
        },
      };
    }

    // Campus filter
    if (campusId) {
      where.campuses = {
        some: {
          campusId,
        },
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
          phoneNo: true,
          designation: true,
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
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
