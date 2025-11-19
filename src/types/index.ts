// src/types/api.ts
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface RegistrationData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | "OTHERS";
  phoneNo?: string;
  dob?: string;
  address?: Record<string, unknown>;
  designation?: string;
}

export interface TeacherData extends RegistrationData {
  schoolId: string;
  campusId?: string;
  qualifications?: Record<string, unknown>;
  joiningDate: string;
  salary?: number;
}

export interface StudentData extends RegistrationData {
  schoolId: string;
  campusId?: string;
  classId?: string;
  familyId?: string;
  grNumber: string;
  admissionNo?: string;
  religion?: string;
  bloodGroup?: string;
  nationality?: string;
}


