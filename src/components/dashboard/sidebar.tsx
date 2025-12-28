// src/components/dashboard/sidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  GraduationCap,
  School,
  Building2,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Shield,
  FileText,
  DollarSign,
  UserCheck,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCurrentUser } from "@/hooks/use-auth";
import { authApi } from "@/lib/api/auth";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const [openSections, setOpenSections] = useState<string[]>(["schools", "users", "staff"]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const getNavItems = (): NavItem[] => {
    const role = user?.role;

    switch (role) {
      case "SUPERADMIN":
        return [
          {
            title: "Dashboard",
            href: "/superadmin",
            icon: LayoutDashboard,
          },
          {
            title: "Schools",
            icon: Building2,
            children: [
              {
                title: "All Schools",
                href: "/superadmin/schools",
                icon: School,
              },
              {
                title: "Create School",
                href: "/superadmin/schools/create",
                icon: UserPlus,
              },
            ],
          },
          {
            title: "Users",
            icon: Users,
            children: [
              {
                title: "All Users",
                href: "/superadmin/users",
                icon: Users,
              },
              {
                title: "Register Principal",
                href: "/superadmin/users/register-principal",
                icon: UserPlus,
              },
            ],
          },
          {
            title: "System",
            icon: Settings,
            children: [
              {
                title: "Permissions",
                href: "/superadmin/permissions",
                icon: Shield,
              },
              {
                title: "Audit Logs",
                href: "/superadmin/audit-logs",
                icon: FileText,
              },
            ],
          },
        ];

      case "ADMIN":
      case "SCHOOLADMIN":
        return [
          {
            title: "Dashboard",
            href: "/admin",
            icon: LayoutDashboard,
          },
          {
            title: "Campuses",
            icon: Building2,
            children: [
              {
                title: "All Campuses",
                href: "/admin/campuses",
                icon: Building2,
              },
              {
                title: "Create Campus",
                href: "/admin/campuses/create",
                icon: UserPlus,
              },
            ],
          },
          {
            title: "Staff",
            icon: Users,
            children: [
              {
                title: "All Staff",
                href: "/admin/staff",
                icon: Users,
              },
              {
                title: "Register Principal",
                href: "/admin/staff/register-principal",
                icon: UserPlus,
              },
              {
                title: "Register Teacher",
                href: "/admin/staff/register-teacher",
                icon: GraduationCap,
              },
              {
                title: "Register Accountant",
                href: "/admin/staff/register-accountant",
                icon: DollarSign,
              },
            ],
          },
          {
            title: "Reports",
            href: "/admin/reports",
            icon: FileText,
          },
        ];

      case "PRINCIPAL":
        return [
          {
            title: "Dashboard",
            href: "/principal",
            icon: LayoutDashboard,
          },
          {
            title: "Staff",
            icon: Users,
            children: [
              {
                title: "All Staff",
                href: "/principal/staff",
                icon: Users,
              },
              {
                title: "Teachers",
                href: "/principal/teachers",
                icon: GraduationCap,
              },
            ],
          },
          {
            title: "Students",
            icon: GraduationCap,
            children: [
              {
                title: "All Students",
                href: "/principal/students",
                icon: GraduationCap,
              },
              {
                title: "Pending Admissions",
                href: "/principal/admissions/pending",
                icon: UserCheck,
              },
            ],
          },
          {
            title: "Academic",
            icon: BookOpen,
            children: [
              {
                title: "Classes",
                href: "/principal/classes",
                icon: BookOpen,
              },
              {
                title: "Attendance",
                href: "/principal/attendance",
                icon: UserCheck,
              },
            ],
          },
          {
            title: "Finance",
            icon: DollarSign,
            children: [
              {
                title: "Fee Discounts",
                href: "/principal/discounts",
                icon: DollarSign,
              },
            ],
          },
        ];

      case "TEACHER":
        return [
          {
            title: "Dashboard",
            href: "/teacher",
            icon: LayoutDashboard,
          },
          {
            title: "Classes",
            href: "/teacher/classes",
            icon: BookOpen,
          },
          {
            title: "Attendance",
            href: "/teacher/attendance",
            icon: UserCheck,
          },
          {
            title: "Admissions",
            href: "/teacher/admissions/new",
            icon: UserPlus,
          },
        ];

      case "ACCOUNTANT":
        return [
          {
            title: "Dashboard",
            href: "/accountant",
            icon: LayoutDashboard,
          },
          {
            title: "Vouchers",
            icon: FileText,
            children: [
              {
                title: "Generate Voucher",
                href: "/accountant/vouchers/generate",
                icon: UserPlus,
              },
              {
                title: "All Vouchers",
                href: "/accountant/vouchers",
                icon: FileText,
              },
            ],
          },
          {
            title: "Payments",
            icon: DollarSign,
            children: [
              {
                title: "Import Statement",
                href: "/accountant/payments/import",
                icon: UserPlus,
              },
              {
                title: "Unmatched Payments",
                href: "/accountant/payments/unmatched",
                icon: FileText,
              },
              {
                title: "Reconciliation",
                href: "/accountant/payments/reconciliation",
                icon: FileText,
              },
            ],
          },
          {
            title: "Reports",
            href: "/accountant/reports",
            icon: FileText,
          },
        ];

      case "ADMISSIONOFFICER":
        return [
          {
            title: "Dashboard",
            href: "/admission-officer",
            icon: LayoutDashboard,
          },
          {
            title: "Inquiries",
            icon: UserCheck,
            children: [
              {
                title: "New Inquiry",
                href: "/admission-officer/inquiries/new",
                icon: UserPlus,
              },
              {
                title: "All Inquiries",
                href: "/admission-officer/inquiries",
                icon: FileText,
              },
            ],
          },
          {
            title: "Reports",
            href: "/admission-officer/reports",
            icon: FileText,
          },
        ];

      case "COMPUTEROPERATOR":
        return [
          {
            title: "Dashboard",
            href: "/computer-operator",
            icon: LayoutDashboard,
          },
          {
            title: "Data Entry",
            href: "/computer-operator/data-entry",
            icon: FileText,
          },
          {
            title: "Reports",
            href: "/computer-operator/reports",
            icon: FileText,
          },
        ];

      default:
        return [
          {
            title: "Dashboard",
            href: "/",
            icon: LayoutDashboard,
          },
        ];
    }
  };

  const navItems = getNavItems();

  const renderNavItem = (item: NavItem, depth = 0) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isActive = pathname === item.href;
    const sectionKey = item.title.toLowerCase().replace(/\s+/g, "-");
    const isOpen = openSections.includes(sectionKey);

    if (hasChildren) {
      return (
        <Collapsible
          key={item.title}
          open={isOpen}
          onOpenChange={() => toggleSection(sectionKey)}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-between",
                depth > 0 && "pl-8"
              )}
            >
              <div className="flex items-center">
                <Icon className="mr-2 h-4 w-4" />
                {item.title}
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            {item.children?.map((child) => renderNavItem(child, depth + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Link key={item.href} href={item.href || "#"}>
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start",
            depth > 0 && "pl-8",
            isActive && "bg-secondary"
          )}
        >
          <Icon className="mr-2 h-4 w-4" />
          {item.title}
        </Button>
      </Link>
    );
  };

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
        <nav className="space-y-1">
          {navItems.map((item) => renderNavItem(item))}
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
