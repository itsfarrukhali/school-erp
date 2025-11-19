// src/app/(app)/(dashboards)/superadmin/page.tsx
"use client";

import { Users, UserCheck, School, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin Dashboard"
        description="Manage system administrators and monitor platform activity"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Admins"
          value="12"
          description="Active platform administrators"
          icon={Users}
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatsCard
          title="Total Schools"
          value="45"
          description="Schools using the platform"
          icon={School}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatsCard
          title="Active Users"
          value="2,456"
          description="Users logged in this month"
          icon={UserCheck}
        />
        <StatsCard
          title="Growth Rate"
          value="23%"
          description="Platform growth this quarter"
          icon={TrendingUp}
          trend={{ value: 5.3, isPositive: true }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboards/superadmin/create-admin" className="block">
              <Button className="w-full">Create New Admin</Button>
            </Link>
            <Button variant="outline" className="w-full">
              View All Admins
            </Button>
            <Button variant="outline" className="w-full">
              System Settings
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
                  <p className="text-sm font-medium">Admin Created</p>
                  <p className="text-xs text-muted-foreground">
                    john@admin.com - 2 hours ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New School Added</p>
                  <p className="text-xs text-muted-foreground">
                    ABC School - 5 hours ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">System Updated</p>
                  <p className="text-xs text-muted-foreground">
                    Version 2.1.0 - 1 day ago
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
