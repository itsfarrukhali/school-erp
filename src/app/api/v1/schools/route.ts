// src/app/api/v1/schools/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createSchoolSchema } from "@/validations/user";
import { generateSchoolId } from "@/lib/utils/id-generator";

// GET - List all schools (with pagination and search)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ 
        success: false,
        message: "Unauthorized" 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Build where clause based on role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let whereClause: any = {};

    // SuperAdmin and Admin can see all schools
    if (["SUPERADMIN", "ADMIN", "SCHOOLADMIN"].includes(session.user.role)) {
      if (search) {
        whereClause = {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { code: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        };
      }
    } else {
      // Other roles can only see schools they're assigned to
      const userSchools = await prisma.userSchool.findMany({
        where: { userId: session.user.id },
        select: { schoolId: true },
      });

      const schoolIds = userSchools.map((us) => us.schoolId);

      if (schoolIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            data: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
            },
          },
        });
      }

      whereClause = {
        id: { in: schoolIds },
      };

      if (search) {
        whereClause = {
          AND: [
            { id: { in: schoolIds } },
            {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { code: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
              ],
            },
          ],
        };
      }
    }

    const [schools, total] = await Promise.all([
      prisma.school.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              campuses: true,
              users: true,
              students: true,
              teachers: true,
            },
          },
        },
      }),
      prisma.school.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        data: schools,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching schools:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to fetch schools",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// POST - Create a new school
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ 
        success: false,
        message: "Unauthorized" 
      }, { status: 401 });
    }

    // Only SuperAdmin and Admin can create schools
    if (![" SUPERADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { 
          success: false,
          message: "Insufficient permissions" 
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createSchoolSchema.parse(body);

    // Check if school code already exists
    const existingSchool = await prisma.school.findUnique({
      where: { code: validatedData.code },
    });

    if (existingSchool) {
      return NextResponse.json(
        { 
          success: false,
          message: "School code already exists" 
        },
        { status: 400 }
      );
    }

    // Create the school
    const school = await prisma.school.create({
      data: {
        sid: generateSchoolId(),
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
        entityId: school.id,
        action: "CREATE",
        performedBy: session.user.id,
        after: school,
        note: `School "${school.name}" created`,
        schoolId: school.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: school,
        message: "School created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating school:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { 
          success: false,
          message: "Validation failed", 
          details: error 
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to create school" 
      },
      { status: 500 }
    );
  }
}
