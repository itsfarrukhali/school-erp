// src/lib/api/schools.ts
import { apiClient } from "./client";
import type { CreateSchoolInput } from "@/validations/user";
import type { ApiResponse } from "@/types";

export interface School {
  id: string;
  sid: string;
  name: string;
  code: string;
  address: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
  };
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    campuses: number;
    users: number;
    students: number;
    teachers: number;
  };
}

export interface SchoolsListData {
  data: School[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const schoolsApi = {
  // Get all schools with pagination
  async getSchools(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<SchoolsListData>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);

    return await apiClient.get<SchoolsListData>(
      `/schools?${searchParams.toString()}`
    );
  },

  // Get a single school
  async getSchool(schoolId: string): Promise<ApiResponse<School>> {
    return await apiClient.get<School>(
      `/schools/${schoolId}`
    );
  },

  // Create a new school
  async createSchool(data: CreateSchoolInput): Promise<ApiResponse<School>> {
    return await apiClient.post<School>("/schools", data);
  },

  // Update a school
  async updateSchool(
    schoolId: string,
    data: Partial<CreateSchoolInput>
  ): Promise<ApiResponse<School>> {
    return await apiClient.patch<School>(
      `/schools/${schoolId}`,
      data
    );
  },

  // Delete a school
  async deleteSchool(schoolId: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/schools/${schoolId}`
    );
  },
};
