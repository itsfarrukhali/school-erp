// src/lib/api/campuses.ts
import { apiClient } from "./client";
import type { CreateCampusInput } from "@/validations/user";
import type { ApiResponse } from "@/types";

export interface Campus {
  id: string;
  name: string;
  campusCode: string;
  address: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
  };
  phone?: string;
  email?: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  school?: {
    id: string;
    name: string;
  };
}

export interface CampusesListData {
  data: Campus[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const campusesApi = {
  // Get all campuses with pagination
  async getCampuses(params?: {
    page?: number;
    limit?: number;
    search?: string;
    schoolId?: string;
  }): Promise<ApiResponse<CampusesListData>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.schoolId) searchParams.set("schoolId", params.schoolId);

    return await apiClient.get<CampusesListData>(
      `/campuses?${searchParams.toString()}`
    );
  },

  // Get a single campus
  async getCampus(campusId: string): Promise<ApiResponse<Campus>> {
    return await apiClient.get<Campus>(`/campuses/${campusId}`);
  },

  // Create a new campus
  async createCampus(data: CreateCampusInput): Promise<ApiResponse<Campus>> {
    return await apiClient.post<Campus>("/campuses", data);
  },

  // Update a campus
  async updateCampus(
    campusId: string,
    data: Partial<CreateCampusInput>
  ): Promise<ApiResponse<Campus>> {
    return await apiClient.patch<Campus>(`/campuses/${campusId}`, data);
  },

  // Delete a campus
  async deleteCampus(campusId: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/campuses/${campusId}`);
  },
};
