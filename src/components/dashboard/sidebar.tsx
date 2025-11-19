// src/components/dashboard/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  GraduationCap,
  School,
  CheckCircle,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCurrentUser } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { authApi } from "@/lib/api/auth";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const permissions = usePermissions();

  const getNavItems = (): NavItem[] => {
    const role = user?.role;

    const baseItems: NavItem[] = [
      {
        title: "Dashboard",
        href: `/${role?.toLowerCase()}`,
        icon: LayoutDashboard,
        permission: true,
      },
    ];

    const roleSpecificItems: Record<string, NavItem[]> = {
      SUPERADMIN: [
        {
          title: "Create Admin",
          href: "/superadmin/create-admin",
          icon: UserPlus,
          permission: permissions.canCreateAdmin,
        },
      ],
      ADMIN: [
        {
          title: "Create School Admin",
          href: "/admin/create-school-admin",
          icon: UserPlus,
          permission: permissions.canCreateSchoolAdmin,
        },
      ],
      PRINCIPAL: [
        {
          title: "Create Teacher",
          href: "/principal/create-teacher",
          icon: GraduationCap,
          permission: permissions.canCreateTeacher,
        },
      ],
      SCHOOLADMIN: [
        {
          title: "Create Teacher",
          href: "/principal/create-teacher",
          icon: GraduationCap,
          permission: permissions.canCreateTeacher,
        },
      ],
      TEACHER: [
        {
          title: "Create Student",
          href: "/teacher/create-student",
          icon: Users,
          permission: permissions.canCreateStudent,
        },
      ],
      ADMISSIONOFFICER: [
        {
          title: "Pending Approvals",
          href: "/admission/pending-approvals",
          icon: CheckCircle,
          permission: permissions.canApproveStudent,
        },
      ],
    };

    return [...baseItems, ...(roleSpecificItems[role || ""] || [])].filter(
      (item) => item.permission
    );
  };

  const navItems = getNavItems();

  return (
    <div className="flex h-full flex-col border-r bg-card">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <School className="h-6 w-6" />
          <span className="text-lg font-bold">School ERP</span>
        </Link>
      </div>

      <Separator />

      <ScrollArea className="flex-1 p-4">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-secondary"
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      <div className="p-4 space-y-2">
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={() => authApi.logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
