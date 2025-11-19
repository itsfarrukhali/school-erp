// src/app/(app)/(dashboards)/admin/page.tsx
"use client";

import { Users, School, TrendingUp, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Manage school administrators and oversee multiple schools"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total School Admins"
          value="24"
          description="Active school administrators"
          icon={Users}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatsCard
          title="Schools Managed"
          value="18"
          description="Schools under supervision"
          icon={School}
          trend={{ value: 8.3, isPositive: true }}
        />
        <StatsCard
          title="Active Users"
          value="1,842"
          description="Users across all schools"
          icon={UserCheck}
        />
        <StatsCard
          title="Growth Rate"
          value="18%"
          description="Platform growth this month"
          icon={TrendingUp}
          trend={{ value: 4.2, isPositive: true }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboards/admin/create-school-admin" className="block">
              <Button className="w-full">Create School Admin</Button>
            </Link>
            <Button variant="outline" className="w-full">
              View All School Admins
            </Button>
            <Button variant="outline" className="w-full">
              Manage Schools
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">School Admin Created</p>
                  <p className="text-xs text-muted-foreground">
                    abc.school@admin.com - 1 hour ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New School Onboarded</p>
                  <p className="text-xs text-muted-foreground">
                    Green Valley School - 3 hours ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Principal Assigned</p>
                  <p className="text-xs text-muted-foreground">
                    City High School - 1 day ago
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
