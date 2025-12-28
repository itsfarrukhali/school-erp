import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import prisma from "@/lib/prisma";
import { createCampusSchema } from "@/validations/user";
import { nanoid } from "nanoid";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== Role.SUPERADMIN) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const body = await req.json();
    const validation = createCampusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validation.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { name, schoolId, address, phone } = validation.data;

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return NextResponse.json(
        {
          success: false,
          message: "School not found",
        },
        { status: 404 }
      );
    }

    // Generate unique campus code
    const campusCode = `CMP-${nanoid(6).toUpperCase()}`;

    const campus = await prisma.campus.create({
      data: {
        name,
        schoolId,
        address: address as any, // Prisma Json type workaround
        phone,
        campusCode,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: campus,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[CAMPUS_CREATE]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");

    const whereClause: any = {};
    if (schoolId) {
      whereClause.schoolId = schoolId;
    }

    const campuses = await prisma.campus.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        school: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: campuses,
    });
  } catch (error) {
    console.error("[CAMPUS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
