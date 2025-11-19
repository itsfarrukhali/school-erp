// src/lib/api/auth.ts
import { signIn, signOut } from "next-auth/react";
import type {
  LoginCredentials,
  VerifyEmailData,
  ApiResponse,
} from "@/types/api";
import { apiClient } from "./client";

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const result = await signIn("credentials", {
      ...credentials,
      redirect: false,
    });

    if (result?.error) {
      return {
        success: false,
        message: result.error,
      };
    }

    return {
      success: true,
      message: "Login successful",
    };
  },

  logout: async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  },

  verifyEmail: async (data: VerifyEmailData): Promise<ApiResponse> => {
    return apiClient.post("/auth/verify-email", data);
  },
};
