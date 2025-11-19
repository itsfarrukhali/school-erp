// src/lib/api/admin.ts
import type {
  AdminRegistrationData,
  SchoolAdminRegistrationData,
  ApiResponse,
} from "@/types/api";
import { apiClient } from "./client";

export const adminApi = {
  createAdmin: async (
    data: AdminRegistrationData
  ): Promise<ApiResponse<{ uid: string; username: string; email: string }>> => {
    return apiClient.post("/admin/register-admin", data);
  },

  createSchoolAdmin: async (
    data: SchoolAdminRegistrationData
  ): Promise<ApiResponse<{ uid: string; username: string; email: string }>> => {
    return apiClient.post("/admin/register-school-admin", data);
  },
};
