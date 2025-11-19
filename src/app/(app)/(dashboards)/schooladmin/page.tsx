// src/app/(app)/(dashboards)/schooladmin/page.tsx
"use client";

import { Users, GraduationCap, School, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SchoolAdminDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="School Admin Dashboard"
        description="Manage school operations and oversee staff and students"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Teachers"
          value="48"
          description="Active teaching staff"
          icon={GraduationCap}
          trend={{ value: 6.2, isPositive: true }}
        />
        <StatsCard
          title="Total Students"
          value="856"
          description="Enrolled students"
          icon={Users}
          trend={{ value: 12.8, isPositive: true }}
        />
        <StatsCard
          title="Active Campuses"
          value="3"
          description="School campuses"
          icon={School}
        />
        <StatsCard
          title="This Month Admissions"
          value="42"
          description="New student admissions"
          icon={TrendingUp}
          trend={{ value: 15.3, isPositive: true }}
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
            <Link href="/dashboards/teacher/create-student" className="block">
              <Button variant="outline" className="w-full">
                Create Student
              </Button>
            </Link>
            <Button variant="outline" className="w-full">
              View Classes
            </Button>
            <Button variant="outline" className="w-full">
              School Settings
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
                  <p className="text-sm font-medium">New Teacher Joined</p>
                  <p className="text-xs text-muted-foreground">
                    Sarah Johnson - Math - 2 hours ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Student Enrolled</p>
                  <p className="text-xs text-muted-foreground">
                    Grade 5-A - 45 students - 4 hours ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Class Created</p>
                  <p className="text-xs text-muted-foreground">
                    Grade 6-B - 1 day ago
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
