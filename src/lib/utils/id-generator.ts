// src/lib/utils/id-generator.ts
import { nanoid } from "nanoid";

/**
 * Generates unique IDs for various entities in the system
 */

// User ID prefix by role
const ROLE_PREFIXES: Record<string, string> = {
  SUPERADMIN: "SA",
  ADMIN: "AD",
  PRINCIPAL: "PR",
  SCHOOLADMIN: "SA",
  ACCOUNTANT: "AC",
  ADMISSIONOFFICER: "AO",
  COMPUTEROPERATOR: "CO",
  TEACHER: "TR",
  CAMPUSHEAD: "CH",
  PARENT: "PA",
  STUDENT: "ST",
};

/**
 * Generates a unique User ID
 * Format: {RolePrefix}-{YYYYMM}-{nanoid(8)}
 */
export function generateUserId(role: string): string {
  const prefix = ROLE_PREFIXES[role] || "US";
  const date = new Date();
  const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const uniquePart = nanoid(8).toUpperCase();
  return `${prefix}-${yearMonth}-${uniquePart}`;
}

/**
 * Generates a unique School ID
 * Format: SCH-{nanoid(10)}
 */
export function generateSchoolId(): string {
  return `SCH-${nanoid(10).toUpperCase()}`;
}

/**
 * Generates a unique Campus Code
 * Format: {SchoolCode}-{CampusNumber}
 */
export function generateCampusCode(schoolCode: string, campusNumber: number): string {
  return `${schoolCode}-C${String(campusNumber).padStart(2, "0")}`;
}

/**
 * Generates a unique Teacher ID
 * Format: TR-{SchoolCode}-{YYYYMM}-{nanoid(6)}
 */
export function generateTeacherId(schoolCode: string): string {
  const date = new Date();
  const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const uniquePart = nanoid(6).toUpperCase();
  return `TR-${schoolCode}-${yearMonth}-${uniquePart}`;
}

/**
 * Generates a unique Student GR Number
 * Format: {SchoolCode}-{YYYY}-{5-digit sequence}
 */
export function generateGrNumber(schoolCode: string, sequence: number): string {
  const year = new Date().getFullYear();
  return `${schoolCode}-${year}-${String(sequence).padStart(5, "0")}`;
}

/**
 * Generates a unique Student ID
 * Format: STU-{SchoolCode}-{YYYYMM}-{nanoid(6)}
 */
export function generateStudentId(schoolCode: string): string {
  const date = new Date();
  const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const uniquePart = nanoid(6).toUpperCase();
  return `STU-${schoolCode}-${yearMonth}-${uniquePart}`;
}

/**
 * Generates a unique Parent ID
 * Format: PAR-{nanoid(10)}
 */
export function generateParentId(): string {
  return `PAR-${nanoid(10).toUpperCase()}`;
}

/**
 * Generates a unique Family ID
 * Format: FAM-{nanoid(10)}
 */
export function generateFamilyId(): string {
  return `FAM-${nanoid(10).toUpperCase()}`;
}

/**
 * Generates a unique username based on name
 */
export function generateUsername(firstName: string, lastName: string): string {
  const base = `${firstName.toLowerCase()}${lastName.toLowerCase()}`.replace(/[^a-z0-9]/g, "");
  const suffix = nanoid(4).toLowerCase();
  return `${base.slice(0, 12)}${suffix}`;
}
