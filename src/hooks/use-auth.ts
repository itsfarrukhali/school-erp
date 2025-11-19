// src/hooks/use-auth.ts
"use client";

import { useSession } from "next-auth/react";
import type { User, Role } from "@/types/api";

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user as User | undefined,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    isUnauthenticated: status === "unauthenticated",
  };
}

export function useCurrentUser(): User | undefined {
  const { user } = useAuth();
  return user;
}

export function useHasRole(...roles: Role[]): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return roles.includes(user.role);
}

export function useHasPermission(permissionName: string): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return user.permissions.includes(permissionName);
}
