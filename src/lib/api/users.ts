// src/lib/api/users.ts
import { apiClient } from "./client";
import type {
  RegisterPrincipalInput,
  RegisterStaffInput,
  RegisterTeacherInput,
  EnrollStudentInput,
  UpdateUserPermissionsInput,
  RegisterAdminInput,
} from "@/validations/user";
import { Role, Status, Gender } from "@prisma/client";
import type { ApiResponse } from "@/types";

export interface User {
  id: string;
  uid: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: Role;
  gender: Gender;
  phoneNo?: string;
  designation?: string;
  avatarUrl?: string;
  status: Status;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  schools: Array<{
    schoolId: string;
    school: {
      id: string;
      name: string;
      code: string;
    };
  }>;
  campuses: Array<{
    campusId: string;
    campus: {
      id: string;
      name: string;
      campusCode: string;
    };
  }>;
}

export interface UsersListData {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Permission {
  id: string;
  name: string;
  label: string;
  category?: string;
  description?: string;
  allowed: boolean;
  source: "user" | "role" | "none";
  isOverridden: boolean;
}

export interface UserPermissionsData {
  user: {
    id: string;
    uid: string;
    fullName: string;
    email: string;
    role: Role;
  };
  permissions: Permission[];
  groupedPermissions: Record<string, Permission[]>;
  summary: {
    total: number;
    allowed: number;
    denied: number;
    overridden: number;
  };
}

export const usersApi = {
  // Get all users with filters
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: Role;
    schoolId?: string;
    campusId?: string;
    status?: Status;
  }): Promise<ApiResponse<UsersListData>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.role) searchParams.set("role", params.role);
    if (params?.schoolId) searchParams.set("schoolId", params.schoolId);
    if (params?.campusId) searchParams.set("campusId", params.campusId);
    if (params?.status) searchParams.set("status", params.status);

    return apiClient.get<UsersListData>(`/users?${searchParams.toString()}`);
  },

  // Get a single user
  async getUser(userId: string): Promise<ApiResponse<User>> {
    return apiClient.get<User>(`/users/${userId}`);
  },

  // Register Admin
  async registerAdmin(data: RegisterAdminInput): Promise<ApiResponse<User>> {
    return apiClient.post<User>("/users/register/admin", data);
  },

  // Register Principal/School Admin
  async registerPrincipal(
    data: RegisterPrincipalInput
  ): Promise<ApiResponse<User>> {
    return apiClient.post<User>("/users/register/principal", data);
  },

  // Register Staff (Accountant, Admission Officer, Campus Head, Operator)
  async registerStaff(data: RegisterStaffInput): Promise<ApiResponse<User>> {
    return apiClient.post<User>("/users/register/staff", data);
  },

  // Register Teacher
  async registerTeacher(
    data: RegisterTeacherInput
  ): Promise<ApiResponse<User>> {
    return apiClient.post<User>("/users/register/teacher", data);
  },

  // Enroll Student
  async enrollStudent(data: EnrollStudentInput): Promise<ApiResponse<User>> {
    return apiClient.post<User>("/users/register/student", data);
  },

  // Get user permissions
  async getUserPermissions(
    userId: string
  ): Promise<ApiResponse<UserPermissionsData>> {
    return apiClient.get<UserPermissionsData>(`/users/${userId}/permissions`);
  },

  // Update user permissions
  async updateUserPermissions(
    userId: string,
    data: UpdateUserPermissionsInput
  ): Promise<ApiResponse<void>> {
    return apiClient.patch<void>(`/users/${userId}/permissions`, data);
  },

  // Update user status
  async updateUserStatus(
    userId: string,
    status: Status
  ): Promise<ApiResponse<void>> {
    return apiClient.patch<void>(`/users/${userId}`, { status });
  },

  // Update user profile
  async updateProfile(
    userId: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      phoneNo: string;
      address: Record<string, unknown>;
      avatarUrl: string;
      dob: string;
    }>
  ): Promise<ApiResponse<User>> {
    return apiClient.patch<User>(`/users/${userId}`, data);
  },

  // Delete user (soft delete)
  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/users/${userId}`);
  },
};
