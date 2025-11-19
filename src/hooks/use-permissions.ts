// src/hooks/use-permissions.ts
"use client";

import { useCurrentUser } from "./use-auth";

export function usePermissions() {
  const user = useCurrentUser();

  const canCreateAdmin = user?.role === "SUPERADMIN";
  const canCreateSchoolAdmin =
    user?.role === "ADMIN" || user?.permissions.includes("create:school_admin");
  const canCreateTeacher =
    ["PRINCIPAL", "CAMPUSHEAD", "SCHOOLADMIN"].includes(user?.role || "") ||
    user?.permissions.includes("create:teacher");
  const canCreateStudent =
    [
      "TEACHER",
      "ADMISSIONOFFICER",
      "COMPUTEROPERATOR",
      "PRINCIPAL",
      "CAMPUSHEAD",
      "SCHOOLADMIN",
    ].includes(user?.role || "") ||
    user?.permissions.includes("create:student");
  const canApproveStudent =
    ["ADMISSIONOFFICER", "PRINCIPAL", "CAMPUSHEAD", "SCHOOLADMIN"].includes(
      user?.role || ""
    ) || user?.permissions.includes("approve:student");

  return {
    canCreateAdmin,
    canCreateSchoolAdmin,
    canCreateTeacher,
    canCreateStudent,
    canApproveStudent,
  };
}
