// src/lib/utils/permission-filter.ts
import { Role } from "@prisma/client";

export type PermissionCategory = 
  | "SYSTEM" 
  | "SCHOOL" 
  | "CAMPUS" 
  | "STAFF" 
  | "STUDENT" 
  | "FINANCE"
  | "ACADEMIC"
  | "REPORTS";

/**
 * Maps each role to the permission categories they can view and manage
 */
const rolePermissionMap: Record<Role, PermissionCategory[]> = {
  SUPERADMIN: ["SYSTEM", "SCHOOL", "CAMPUS", "STAFF", "STUDENT", "FINANCE", "ACADEMIC", "REPORTS"],
  ADMIN: ["SCHOOL", "CAMPUS", "STAFF", "STUDENT", "FINANCE", "ACADEMIC", "REPORTS"],
  SCHOOLADMIN: ["SCHOOL", "CAMPUS", "STAFF", "STUDENT", "FINANCE", "ACADEMIC", "REPORTS"],
  PRINCIPAL: ["CAMPUS", "STAFF", "STUDENT", "FINANCE", "ACADEMIC", "REPORTS"],
  CAMPUSHEAD: ["CAMPUS", "STAFF", "STUDENT", "ACADEMIC", "REPORTS"],
  TEACHER: ["STUDENT", "ACADEMIC"],
  ACCOUNTANT: ["FINANCE", "REPORTS"],
  ADMISSIONOFFICER: ["STUDENT", "REPORTS"],
  COMPUTEROPERATOR: ["STUDENT", "STAFF", "REPORTS"],
  STUDENT: [],
  PARENT: [],
};

/**
 * Get the permission categories visible to a specific role
 */
export function getVisiblePermissionCategories(role: Role): PermissionCategory[] {
  return rolePermissionMap[role] || [];
}

/**
 * Check if a user role can view a specific permission category
 */
export function canViewPermissionCategory(
  userRole: Role, 
  category: string | null | undefined
): boolean {
  if (!category) return false;
  const allowedCategories = getVisiblePermissionCategories(userRole);
  return allowedCategories.includes(category as PermissionCategory);
}

/**
 * Filter permissions array based on user role
 */
export function filterPermissionsByRole<T extends { category?: string | null }>(
  userRole: Role,
  permissions: T[]
): T[] {
  const allowedCategories = getVisiblePermissionCategories(userRole);
  return permissions.filter(p => 
    p.category && allowedCategories.includes(p.category as PermissionCategory)
  );
}

/**
 * Get human-readable category labels
 */
export const categoryLabels: Record<PermissionCategory, string> = {
  SYSTEM: "System Administration",
  SCHOOL: "School Management",
  CAMPUS: "Campus Management",
  STAFF: "Staff Management",
  STUDENT: "Student Management",
  FINANCE: "Financial Operations",
  ACADEMIC: "Academic Operations",
  REPORTS: "Reports & Analytics",
};

/**
 * Get category description
 */
export const categoryDescriptions: Record<PermissionCategory, string> = {
  SYSTEM: "System-wide settings and configurations",
  SCHOOL: "School creation, updates, and management",
  CAMPUS: "Campus operations and management",
  STAFF: "Staff hiring, management, and assignments",
  STUDENT: "Student admissions, records, and management",
  FINANCE: "Fee management, payments, and reconciliation",
  ACADEMIC: "Classes, subjects, exams, and attendance",
  REPORTS: "Generate and view various reports",
};
