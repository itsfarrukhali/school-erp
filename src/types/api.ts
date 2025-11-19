export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

// src/types/user.ts
export type Role =
  | "SUPERADMIN"
  | "ADMIN"
  | "SCHOOLADMIN"
  | "PRINCIPAL"
  | "CAMPUSHEAD"
  | "TEACHER"
  | "ADMISSIONOFFICER"
  | "COMPUTEROPERATOR"
  | "ACCOUNTANT"
  | "STUDENT"
  | "PARENT";

export type Status = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";

export type Gender = "MALE" | "FEMALE" | "OTHERS";

export interface School {
  schoolId: string;
  schoolName: string;
  roleForSchool: Role;
}

export interface Campus {
  campusId: string;
  campusName: string;
  roleAtCampus: Role | null;
}

export interface User {
  id: string;
  uid: string;
  email: string;
  username: string;
  role: Role;
  firstName: string;
  lastName: string;
  status: Status;
  isEmailVerified: boolean;
  schools: School[];
  campuses: Campus[];
  permissions: string[];
}

export interface LoginCredentials {
  identifier: string;  // username or email
  password: string;
}

export interface VerifyEmailData {
  email: string;
  code: string;
}

export interface AdminRegistrationData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  phoneNo?: string;
  dob?: string;
  designation?: string;
  role: "ADMIN";
}

export interface SchoolAdminRegistrationData
  extends Omit<AdminRegistrationData, "role"> {
  role: "SCHOOLADMIN" | "PRINCIPAL";
  schoolId?: string;
}

export interface TeacherRegistrationData
  extends Omit<AdminRegistrationData, "role"> {
  schoolId: string;
  campusId?: string;
  qualifications?: Record<string, unknown>;
  joiningDate: string;
  salary?: number;
}

export interface StudentRegistrationData
  extends Omit<AdminRegistrationData, "role"> {
  schoolId: string;
  campusId?: string;
  classId?: string;
  familyId?: string;
  grNumber: string;
  admissionNo?: string;
  religion?: string;
  bloodGroup?: string;
  nationality?: string;
  address?: Record<string, unknown>;
}

export interface PendingStudent {
  id: string;
  studentId: string;
  grNumber: string;
  user: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
  };
  school: {
    name: string;
    code: string;
  };
  campus: {
    name: string;
  } | null;
  class: {
    name: string;
    grade: string;
    section: string;
  } | null;
}

export interface ApprovalData {
  studentId: string;
  approved: boolean;
  reason?: string;
}
