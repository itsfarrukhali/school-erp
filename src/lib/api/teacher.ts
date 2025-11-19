// src/lib/api/teacher.ts
import type { TeacherRegistrationData, ApiResponse } from "@/types/api";
import { apiClient } from "./client";

export const teacherApi = {
  createTeacher: async (
    data: TeacherRegistrationData
  ): Promise<
    ApiResponse<{
      uid: string;
      teacherId: string;
      username: string;
      email: string;
    }>
  > => {
    return apiClient.post("/staff/register-teacher", data);
  },
};
