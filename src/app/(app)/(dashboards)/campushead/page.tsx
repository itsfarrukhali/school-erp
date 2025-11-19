// src/app/(app)/(dashboards)/campushead/page.tsx
"use client";

import { Users, GraduationCap, Calendar, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CampusHeadDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Head Dashboard"
        description="Manage campus operations and oversee all activities"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Teachers"
          value="28"
          description="Campus teaching staff"
          icon={GraduationCap}
          trend={{ value: 5.2, isPositive: true }}
        />
        <StatsCard
          title="Total Students"
          value="542"
          description="Enrolled students"
          icon={Users}
          trend={{ value: 9.8, isPositive: true }}
        />
        <StatsCard
          title="Active Classes"
          value="22"
          description="Running classes"
          icon={Calendar}
        />
        <StatsCard
          title="Attendance Rate"
          value="93%"
          description="This month's average"
          icon={TrendingUp}
          trend={{ value: 1.8, isPositive: true }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboards/principal/create-teacher" className="block">
              <Button className="w-full">Create Teacher</Button>
            </Link>
            <Button variant="outline" className="w-full">
              View Timetable
            </Button>
            <Button variant="outline" className="w-full">
              Campus Reports
            </Button>
            <Button variant="outline" className="w-full">
              Manage Resources
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
                  <p className="text-sm font-medium">Teacher Hired</p>
                  <p className="text-xs text-muted-foreground">
                    Science Department - 3 hours ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Event Scheduled</p>
                  <p className="text-xs text-muted-foreground">
                    Annual Sports Day - Next Week
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Resource Allocated</p>
                  <p className="text-xs text-muted-foreground">
                    New Lab Equipment - Yesterday
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
