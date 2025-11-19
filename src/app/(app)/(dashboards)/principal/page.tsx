// src/app/(app)/(dashboards)/principal/page.tsx
"use client";

import { Users, GraduationCap, Calendar, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PrincipalDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Principal Dashboard"
        description="Manage campus academics and oversee teaching staff"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Teachers"
          value="32"
          description="Teaching staff"
          icon={GraduationCap}
          trend={{ value: 4.5, isPositive: true }}
        />
        <StatsCard
          title="Total Students"
          value="624"
          description="Enrolled students"
          icon={Users}
          trend={{ value: 8.7, isPositive: true }}
        />
        <StatsCard
          title="Active Classes"
          value="28"
          description="Running classes"
          icon={Calendar}
        />
        <StatsCard
          title="Attendance Rate"
          value="94%"
          description="This month's average"
          icon={TrendingUp}
          trend={{ value: 2.3, isPositive: true }}
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
              Student Reports
            </Button>
            <Button variant="outline" className="w-full">
              Academic Calendar
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
                  <p className="text-sm font-medium">Exam Scheduled</p>
                  <p className="text-xs text-muted-foreground">
                    Mid-term Exams - Starts Dec 15
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Teacher Assigned</p>
                  <p className="text-xs text-muted-foreground">
                    English - Grade 8-A - 2 hours ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Parent Meeting</p>
                  <p className="text-xs text-muted-foreground">
                    Tomorrow at 10:00 AM
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
