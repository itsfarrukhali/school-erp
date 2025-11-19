// src/app/api/v1/admin/register-admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { adminRegistrationSchema } from "@/validations/auth/auth";
import { hashPassword } from "@/utils/password";
import { generateVerificationCode } from "@/utils/generateVerifyCodes";
import { generateUID } from "@/utils/generateIds";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";
import { requireRole } from "@/lib/auth";
import { createAuditLog } from "@/utils/audit";
import type { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireRole("SUPERADMIN");

    const body = await request.json();
    const validationResult = adminRegistrationSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Validation errors",
          errors,
        },
        { status: 400 }
      );
    }

    const {
      username,
      email,
      password,
      firstName,
      lastName,
      gender,
      phoneNo,
      dob,
      address,
      designation,
    } = validationResult.data;

    const existingVerifiedUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username, isEmailVerified: true },
          { email, isEmailVerified: true },
        ],
      },
    });

    if (existingVerifiedUser) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message:
            existingVerifiedUser.username === username
              ? "Username already taken"
              : "Email already registered",
        },
        { status: 409 }
      );
    }

    const { unHashedCode, hashedCode, expiry } = generateVerificationCode();
    const hashedPassword = await hashPassword(password);

    let newUser;

    await prisma.$transaction(async (tx) => {
      const existingUnverifiedUser = await tx.user.findFirst({
        where: { email, isEmailVerified: false },
      });

      if (existingUnverifiedUser) {
        newUser = await tx.user.update({
          where: { id: existingUnverifiedUser.id },
          data: {
            username,
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`,
            password: hashedPassword,
            gender,
            phoneNo,
            dob: dob ? new Date(dob) : null,
            address: address ? JSON.parse(JSON.stringify(address)) : undefined,
            designation,
            role: "ADMIN",
            verificationCode: hashedCode,
            verificationCodeExpiry: expiry,
          },
        });
      } else {
        newUser = await tx.user.create({
          data: {
            uid: generateUID(),
            username,
            email,
            password: hashedPassword,
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`,
            gender,
            phoneNo,
            dob: dob ? new Date(dob) : null,
            address: address ? JSON.parse(JSON.stringify(address)) : undefined,
            designation,
            role: "ADMIN",
            verificationCode: hashedCode,
            verificationCodeExpiry: expiry,
            isEmailVerified: false,
            status: "ACTIVE",
          },
        });
      }

      await createAuditLog({
        entityType: "User",
        entityId: newUser.id,
        action: existingUnverifiedUser ? "UPDATE" : "CREATE",
        performedBy: currentUser.id,
        after: {
          uid: newUser.uid,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
        },
        note: `Admin ${
          existingUnverifiedUser ? "updated" : "created"
        } by SuperAdmin`,
      });
    });

    const emailResponse = await sendVerificationEmail(
      email,
      username,
      unHashedCode
    );

    if (!emailResponse.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Admin created but failed to send verification email",
        },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          uid: newUser!.uid,
          username: newUser!.username,
          email: newUser!.email,
          role: newUser!.role,
        },
        message: "Admin registered successfully. Verification email sent.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in Admin registration:", error);

    if (
      error instanceof Error &&
      (error.message === "Unauthorized" ||
        error.message === "Insufficient permissions")
    ) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Only SuperAdmin can create Admins",
        },
        { status: 403 }
      );
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "An error occurred during registration",
      },
      { status: 500 }
    );
  }
}
