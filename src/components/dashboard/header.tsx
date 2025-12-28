// src/components/dashboard/header.tsx
"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useCurrentUser } from "@/hooks/use-auth";
import { getInitials, getRoleBadgeColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ROLES } from "@/lib/constants";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardHeader() {
  const user = useCurrentUser();

  if (!user) return null;

  return (
    <header className="border-b bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h2 className="text-xl font-semibold">
              Welcome back, {user.firstName}!
            </h2>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">
                {user.firstName} {user.lastName}
              </p>
              <Badge
                className={`${getRoleBadgeColor(user.role)} text-white text-xs`}
              >
                {ROLES[user.role]}
              </Badge>
            </div>
            <Avatar>
              <AvatarFallback>
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
