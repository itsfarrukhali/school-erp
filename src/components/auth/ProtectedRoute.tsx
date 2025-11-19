// src/components/auth/ProtectedRoute.tsx

"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Role } from "@prisma/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  requiredPermissions?: string[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermissions,
  redirectTo = "/auth/signin",
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push(redirectTo);
      return;
    }

    // Check role-based access
    if (allowedRoles && !allowedRoles.includes(session.user.role)) {
      router.push("/unauthorized");
      return;
    }

    // Check permission-based access
    if (requiredPermissions) {
      const hasAllPermissions = requiredPermissions.every((perm) =>
        session.user.permissions.includes(perm)
      );

      if (!hasAllPermissions) {
        router.push("/unauthorized");
        return;
      }
    }
  }, [session, status, allowedRoles, requiredPermissions, router, redirectTo]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
