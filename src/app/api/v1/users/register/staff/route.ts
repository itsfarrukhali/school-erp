// src/app/api/v1/users/register/staff/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { registerStaffSchema } from "@/validations/user";
import { generateUserId } from "@/lib/utils/id-generator";
import { hashPassword } from "@/utils/password";
import { Prisma } from "@prisma/client";

/**
 * POST - Register Staff Members (Accountant, Admission Officer, Campus Head, Operator)
 * Allowed by: SuperAdmin, Admin, Principal, School Admin
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to register staff
    const allowedRoles = ["SUPERADMIN", "ADMIN", "PRINCIPAL", "SCHOOLADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "You don't have permission to register staff members" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = registerStaffSchema.parse(body);

    // For non-super admins, verify school access
    if (!["SUPERADMIN", "ADMIN"].includes(session.user.role)) {
      const hasAccess = session.user.schools.some(
        (s) => s.schoolId === validatedData.schoolId
      );
      if (!hasAccess) {
        return NextResponse.json(
          { error: "You don't have access to this school" },
          { status: 403 }
        );
      }
    }

    // Check if school exists
    const school = await prisma.school.findUnique({
      where: { id: validatedData.schoolId },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // If campus is provided, verify it belongs to the school
    if (validatedData.campusId) {
      const campus = await prisma.campus.findFirst({
        where: {
          id: validatedData.campusId,
          schoolId: validatedData.schoolId,
        },
      });
      if (!campus) {
        return NextResponse.json(
          { error: "Campus not found or doesn't belong to this school" },
          { status: 404 }
        );
      }
    }

    // Check if email or username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { username: validatedData.username },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            existingUser.email === validatedData.email
              ? "Email already exists"
              : "Username already exists",
        },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(validatedData.password);

    // Generate unique user ID
    const uid = generateUserId(validatedData.role);

    // Role to designation mapping
    const designationMap: Record<string, string> = {
      ACCOUNTANT: "Accountant",
      ADMISSIONOFFICER: "Admission Officer",
      CAMPUSHEAD: "Campus Head",
      COMPUTEROPERATOR: "Computer Operator",
    };

    // Create user and role-specific record in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
        data: {
          uid,
          username: validatedData.username,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          fullName: `${validatedData.firstName} ${validatedData.lastName}`,
          email: validatedData.email,
          password: hashedPassword,
          role: validatedData.role,
          gender: validatedData.gender,
          dob: validatedData.dob ? new Date(validatedData.dob) : null,
          phoneNo: validatedData.phoneNo,
          designation: designationMap[validatedData.role] || validatedData.role,
          address: validatedData.address || Prisma.JsonNull,
          status: "ACTIVE",
          isEmailVerified: true,
        },
      });

      // Create UserSchool relationship
      await tx.userSchool.create({
        data: {
          userId: user.id,
          schoolId: validatedData.schoolId,
          roleForSchool: validatedData.role,
        },
      });

      // If campus is assigned, create UserCampus relationship
      if (validatedData.campusId) {
        await tx.userCampus.create({
          data: {
            userId: user.id,
            campusId: validatedData.campusId,
            roleAtCampus: validatedData.role,
          },
        });
      }

      // Create role-specific record
      switch (validatedData.role) {
        case "ACCOUNTANT":
          await tx.accountant.create({
            data: {
              userId: user.id,
              schoolId: validatedData.schoolId,
            },
          });
          break;
        case "ADMISSIONOFFICER":
          await tx.admissionOfficer.create({
            data: {
              userId: user.id,
              schoolId: validatedData.schoolId,
            },
          });
          break;
        case "COMPUTEROPERATOR":
          await tx.computerOperator.create({
            data: {
              userId: user.id,
              schoolId: validatedData.schoolId,
            },
          });
          break;
      }

      // Get default role permissions and assign to user
      const rolePermissions = await tx.rolePermission.findMany({
        where: {
          role: validatedData.role,
          allowed: true,
        },
      });

      if (rolePermissions.length > 0) {
        await tx.userPermission.createMany({
          data: rolePermissions.map((rp) => ({
            userId: user.id,
            permissionId: rp.permissionId,
            allowed: true,
          })),
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          entityType: "User",
          entityId: user.id,
          action: "CREATE",
          performedBy: session.user.id,
          after: {
            uid: user.uid,
            email: user.email,
            role: user.role,
            school: school.name,
          },
          note: `${designationMap[validatedData.role]} "${
            user.fullName
          }" registered`,
          schoolId: validatedData.schoolId,
        },
      });

      return user;
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.id,
          uid: result.uid,
          email: result.email,
          username: result.username,
          fullName: result.fullName,
          role: result.role,
        },
        message: `${
          designationMap[validatedData.role]
        } registered successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering staff:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to register staff member" },
      { status: 500 }
    );
  }
}
