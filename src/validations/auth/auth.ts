// src/utils/validators.ts
import { z } from "zod";

export const baseUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  email: z.email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be at most 50 characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be at most 50 characters"),
  gender: z.enum(["MALE", "FEMALE", "OTHERS"]),
  phoneNo: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[\d\s-]+$/.test(val),
      "Please enter a valid phone number"
    ),
  dob: z.string().optional(),
  address: z.record(z.string(), z.unknown()).optional(),
  designation: z.string().optional(),
});

export const adminRegistrationSchema = baseUserSchema.extend({
  role: z.literal("ADMIN"),
});

export const schoolAdminRegistrationSchema = baseUserSchema.extend({
  role: z.enum(["SCHOOLADMIN", "PRINCIPAL"]),
  schoolId: z.string().optional(),
});

export const teacherRegistrationSchema = baseUserSchema.extend({
  schoolId: z.string().min(1, "School ID is required"),
  campusId: z.string().optional(),
  qualifications: z.record(z.string(), z.unknown()).optional(),
  joiningDate: z.string(),
  salary: z.number().positive().optional(),
});

export const studentRegistrationSchema = baseUserSchema.extend({
  schoolId: z.string().min(1, "School ID is required"),
  campusId: z.string().optional(),
  classId: z.string().optional(),
  familyId: z.string().optional(),
  grNumber: z.string().min(1, "GR Number is required"),
  admissionNo: z.string().optional(),
  religion: z
    .enum([
      "ISLAM",
      "CHRISTIANITY",
      "HINDUISM",
      "BUDDHISM",
      "JAINISM",
      "ZOROASTRIANISM",
      "OTHERS",
    ])
    .optional(),
  bloodGroup: z
    .enum([
      "A_POSITIVE",
      "A_NEGATIVE",
      "B_POSITIVE",
      "B_NEGATIVE",
      "AB_POSITIVE",
      "AB_NEGATIVE",
      "O_POSITIVE",
      "O_NEGATIVE",
    ])
    .optional(),
  nationality: z
    .enum([
      "PAKISTANI",
      "AFGHANISTANI",
      "CHINESE",
      "IRANIAN",
      "INDIAN",
      "USA",
      "OTHER",
    ])
    .optional(),
});

export const verifyEmailSchema = z.object({
  email: z.email(),
  code: z.string().length(6, "Verification code must be 6 characters"),
});

export const approvalSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  approved: z.boolean(),
  reason: z.string().optional(),
});
