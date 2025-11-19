// src/lib/utils/dashboard-routes.ts
import type { Role } from "@/types/api";

/**
 * Maps user role to their respective dashboard route
 */
export const getDashboardRoute = (role: Role): string => {
  const roleRoutes: Record<Role, string> = {
    SUPERADMIN: "/superadmin",
    ADMIN: "/admin",
    SCHOOLADMIN: "/schooladmin",
    PRINCIPAL: "/principal",
    CAMPUSHEAD: "/campushead",
    TEACHER: "/teacher",
    ADMISSIONOFFICER: "/admission",
    COMPUTEROPERATOR: "/operator",
    ACCOUNTANT: "/accountant",
    STUDENT: "/student",
    PARENT: "/parent",
  };

  return roleRoutes[role] || "/student";
};
