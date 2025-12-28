"use client"

import * as React from "react"
import {
  BookOpen,
  Building2,
  ChevronRight,
  DollarSign,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  School,
  Settings,
  Shield,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useCurrentUser } from "@/hooks/use-auth"
import { authApi } from "@/lib/api/auth"

interface NavItem {
  title: string
  url?: string
  icon: React.ComponentType<{ className?: string }>
  items?: NavItem[]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const user = useCurrentUser()

  const getNavItems = (): NavItem[] => {
    const role = user?.role

    switch (role) {
      case "SUPERADMIN":
        return [
          {
            title: "Dashboard",
            url: "/superadmin",
            icon: LayoutDashboard,
          },
          {
            title: "Schools",
            icon: Building2,
            items: [
              {
                title: "All Schools",
                url: "/superadmin/schools",
                icon: School,
              },
              {
                title: "Create School",
                url: "/superadmin/schools/create",
                icon: UserPlus,
              },
            ],
          },
          {
            title: "Users",
            icon: Users,
            items: [
              {
                title: "All Users",
                url: "/superadmin/users",
                icon: Users,
              },
              {
                title: "Register Principal",
                url: "/superadmin/users/register-principal",
                icon: UserPlus,
              },
            ],
          },
          {
            title: "System",
            icon: Settings,
            items: [
              {
                title: "Permissions",
                url: "/superadmin/permissions",
                icon: Shield,
              },
              {
                title: "Audit Logs",
                url: "/superadmin/audit-logs",
                icon: FileText,
              },
            ],
          },
        ]

      case "ADMIN":
      case "SCHOOLADMIN":
        return [
          {
            title: "Dashboard",
            url: "/admin",
            icon: LayoutDashboard,
          },
          {
            title: "Campuses",
            icon: Building2,
            items: [
              {
                title: "All Campuses",
                url: "/admin/campuses",
                icon: Building2,
              },
              {
                title: "Create Campus",
                url: "/admin/campuses/create",
                icon: UserPlus,
              },
            ],
          },
          {
            title: "Staff",
            icon: Users,
            items: [
              {
                title: "All Staff",
                url: "/admin/staff",
                icon: Users,
              },
              {
                title: "Register Principal",
                url: "/admin/staff/register-principal",
                icon: UserPlus,
              },
              {
                title: "Register Teacher",
                url: "/admin/staff/register-teacher",
                icon: GraduationCap,
              },
              {
                title: "Register Accountant",
                url: "/admin/staff/register-accountant",
                icon: DollarSign,
              },
            ],
          },
          {
            title: "Reports",
            url: "/admin/reports",
            icon: FileText,
          },
        ]

      case "PRINCIPAL":
        return [
          {
            title: "Dashboard",
            url: "/principal",
            icon: LayoutDashboard,
          },
          {
            title: "Staff",
            icon: Users,
            items: [
              {
                title: "All Staff",
                url: "/principal/staff",
                icon: Users,
              },
              {
                title: "Teachers",
                url: "/principal/teachers",
                icon: GraduationCap,
              },
            ],
          },
          {
            title: "Students",
            icon: GraduationCap,
            items: [
              {
                title: "All Students",
                url: "/principal/students",
                icon: GraduationCap,
              },
              {
                title: "Pending Admissions",
                url: "/principal/admissions/pending",
                icon: UserCheck,
              },
            ],
          },
          {
            title: "Academic",
            icon: BookOpen,
            items: [
              {
                title: "Classes",
                url: "/principal/classes",
                icon: BookOpen,
              },
              {
                title: "Attendance",
                url: "/principal/attendance",
                icon: UserCheck,
              },
            ],
          },
          {
            title: "Finance",
            icon: DollarSign,
            items: [
              {
                title: "Fee Discounts",
                url: "/principal/discounts",
                icon: DollarSign,
              },
            ],
          },
        ]

      case "TEACHER":
        return [
          {
            title: "Dashboard",
            url: "/teacher",
            icon: LayoutDashboard,
          },
          {
            title: "Classes",
            url: "/teacher/classes",
            icon: BookOpen,
          },
          {
            title: "Attendance",
            url: "/teacher/attendance",
            icon: UserCheck,
          },
          {
            title: "Admissions",
            url: "/teacher/admissions/new",
            icon: UserPlus,
          },
        ]

      case "ACCOUNTANT":
        return [
          {
            title: "Dashboard",
            url: "/accountant",
            icon: LayoutDashboard,
          },
          {
            title: "Vouchers",
            icon: FileText,
            items: [
              {
                title: "Generate Voucher",
                url: "/accountant/vouchers/generate",
                icon: UserPlus,
              },
              {
                title: "All Vouchers",
                url: "/accountant/vouchers",
                icon: FileText,
              },
            ],
          },
          {
            title: "Payments",
            icon: DollarSign,
            items: [
              {
                title: "Import Statement",
                url: "/accountant/payments/import",
                icon: UserPlus,
              },
              {
                title: "Unmatched Payments",
                url: "/accountant/payments/unmatched",
                icon: FileText,
              },
              {
                title: "Reconciliation",
                url: "/accountant/payments/reconciliation",
                icon: FileText,
              },
            ],
          },
          {
            title: "Reports",
            url: "/accountant/reports",
            icon: FileText,
          },
        ]

      case "ADMISSIONOFFICER":
        return [
          {
            title: "Dashboard",
            url: "/admission-officer",
            icon: LayoutDashboard,
          },
          {
            title: "Inquiries",
            icon: UserCheck,
            items: [
              {
                title: "New Inquiry",
                url: "/admission-officer/inquiries/new",
                icon: UserPlus,
              },
              {
                title: "All Inquiries",
                url: "/admission-officer/inquiries",
                icon: FileText,
              },
            ],
          },
          {
            title: "Reports",
            url: "/admission-officer/reports",
            icon: FileText,
          },
        ]

      case "COMPUTEROPERATOR":
        return [
          {
            title: "Dashboard",
            url: "/computer-operator",
            icon: LayoutDashboard,
          },
          {
            title: "Data Entry",
            url: "/computer-operator/data-entry",
            icon: FileText,
          },
          {
            title: "Reports",
            url: "/computer-operator/reports",
            icon: FileText,
          },
        ]

      default:
        return [
          {
            title: "Dashboard",
            url: "/",
            icon: LayoutDashboard,
          },
        ]
    }
  }

  const navItems = getNavItems()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <School className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">School ERP</span>
            <span className="truncate text-xs">Enterprise Edition</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={item.items && item.items.length > 0}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  {item.items ? (
                    <>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === subItem.url}
                              >
                                <Link href={subItem.url || "#"}>
                                  {subItem.icon && <subItem.icon />}
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.title}
                    >
                      <Link href={item.url || "#"}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => authApi.logout()}
              className="text-destructive hover:text-destructive"
            >
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
