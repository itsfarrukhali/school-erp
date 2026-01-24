// src/validations/user.ts
import { z } from "zod";

// Base user schema for shared fields
export const baseUserSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  phoneNo: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHERS"]),
  dob: z.string().optional(),
  designation: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  avatarUrl: z.string().optional(),
});

// Admin registration schema
export const registerAdminSchema = baseUserSchema.extend({
  role: z.literal("ADMIN"),
});

// School creation schema
export const createSchoolSchema = z.object({
  name: z.string().min(3, "School name must be at least 3 characters"),
  code: z
    .string()
    .min(2, "School code must be at least 2 characters")
    .max(10, "School code must be at most 10 characters")
    .regex(/^[A-Z0-9]+$/, "School code must be uppercase letters and numbers only"),
  address: z.object({
    street: z.string().min(5, "Street address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().optional(),
    country: z.string().min(2, "Country is required"),
    postalCode: z.string().optional(),
  }),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
});

// Campus creation schema
export const createCampusSchema = z.object({
  name: z.string().min(3, "Campus name must be at least 3 characters"),
  schoolId: z.string().min(1, "School ID is required"),
  address: z.object({
    street: z.string().min(5, "Street address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().optional(),
    country: z.string().min(2, "Country is required"),
    postalCode: z.string().optional(),
  }),
  phone: z.string().optional(),
});

// Principal/School Admin registration schema
export const registerPrincipalSchema = baseUserSchema.extend({
  schoolId: z.string().min(1, "School ID is required"),
  role: z.enum(["PRINCIPAL", "SCHOOLADMIN"]),
  campusId: z.string().optional(),
});

// Staff registration schema (Accountant, Admission Officer, Campus Head, Operator)
export const registerStaffSchema = baseUserSchema.extend({
  schoolId: z.string().min(1, "School ID is required"),
  campusId: z.string().optional(),
  role: z.enum(["ACCOUNTANT", "ADMISSIONOFFICER", "CAMPUSHEAD", "COMPUTEROPERATOR"]),
});

// Teacher registration schema
export const registerTeacherSchema = baseUserSchema.extend({
  schoolId: z.string().min(1, "School ID is required"),
  campusId: z.string().optional(),
  qualifications: z.string().optional(),
  joiningDate: z.string().min(1, "Joining date is required"),
  salary: z.number().optional(),
});

// Student enrollment schema
export const enrollStudentSchema = z.object({
  studentName: z.string().min(2, "Student name must be at least 2 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
  gender: z.enum(["MALE", "FEMALE", "OTHERS"]),
  dateOfBirth: z.string().optional(),
  schoolId: z.string().min(1, "School ID is required"),
  campusId: z.string().optional(),
  classId: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  religion: z.enum(["ISLAM", "CHRISTIANITY", "HINDUISM", "BUDDHISM", "JAINISM", "ZOROASTRIANISM", "OTHERS"]).optional(),
  nationality: z.enum(["PAKISTANI", "AFGHANISTANI", "CHINESE", "IRANIAN", "INDIAN", "USA", "OTHER"]).optional(),
  // Family info
  fatherName: z.string().min(2, "Father name is required"),
  motherName: z.string().min(2, "Mother name is required"),
  guardianPhone: z.string().min(10, "Guardian phone is required"),
});

// User permission update schema
export const updateUserPermissionsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  permissions: z.array(
    z.object({
      permissionId: z.string(),
      allowed: z.boolean(),
    })
  ),
});

// User status update schema
export const updateUserStatusSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"]),
});

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type CreateCampusInput = z.infer<typeof createCampusSchema>;
export type RegisterAdminInput = z.infer<typeof registerAdminSchema>;
export type RegisterPrincipalInput = z.infer<typeof registerPrincipalSchema>;
export type RegisterStaffInput = z.infer<typeof registerStaffSchema>;
export type RegisterTeacherInput = z.infer<typeof registerTeacherSchema>;
export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;
export type UpdateUserPermissionsInput = z.infer<typeof updateUserPermissionsSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
