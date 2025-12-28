// src/app/(app)/(dashboards)/principal/users/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { UsersList } from "@/components/users/users-list";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

export default function PrincipalUsersPage() {
  const { user } = useAuth();
  const schoolId = user?.schools?.[0]?.schoolId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Staff & User Management"
          description="View and manage staff members and their permissions"
        />
        <Link href="/principal/staff/register">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Register Staff
          </Button>
        </Link>
      </div>

      <UsersList 
        schoolId={schoolId}
        showPermissionManager={true} 
      />
    </div>
  );
}
