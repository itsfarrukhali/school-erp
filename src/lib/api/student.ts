// src/lib/api/student.ts
import type {
  StudentRegistrationData,
  ApprovalData,
  PendingStudent,
  ApiResponse,
} from "@/types/api";
import { apiClient } from "./client";

export const studentApi = {
  createStudent: async (
    data: StudentRegistrationData
  ): Promise<
    ApiResponse<{
      uid: string;
      studentId: string;
      grNumber: string;
      needsApproval: boolean;
    }>
  > => {
    return apiClient.post("/students/register", data);
  },

  getPendingApprovals: async (): Promise<ApiResponse<PendingStudent[]>> => {
    return apiClient.get("/students/pending-approvals");
  },

  approveStudent: async (data: ApprovalData): Promise<ApiResponse> => {
    return apiClient.post("/students/approve", data);
  },
};
