import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    SUPERADMIN: "bg-purple-500",
    ADMIN: "bg-red-500",
    SCHOOLADMIN: "bg-blue-500",
    PRINCIPAL: "bg-indigo-500",
    TEACHER: "bg-green-500",
    ADMISSIONOFFICER: "bg-yellow-500",
    COMPUTEROPERATOR: "bg-orange-500",
    STUDENT: "bg-cyan-500",
  };
  return colors[role] || "bg-gray-500";
}
