// src/app/(app)/(dashboards)/student/page.tsx
"use client";

import { BookOpen, Calendar, Trophy, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Dashboard"
        description="View your academic information and progress"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="My Classes"
          value="8"
          description="Enrolled subjects"
          icon={BookOpen}
        />
        <StatsCard
          title="Attendance Rate"
          value="96%"
          description="This month"
          icon={Calendar}
        />
        <StatsCard
          title="Upcoming Exams"
          value="3"
          description="In next 2 weeks"
          icon={Trophy}
        />
        <StatsCard
          title="Fee Status"
          value="Paid"
          description="Current month"
          icon={DollarSign}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full">View Timetable</Button>
            <Button variant="outline" className="w-full">
              Check Attendance
            </Button>
            <Button variant="outline" className="w-full">
              View Results
            </Button>
            <Button variant="outline" className="w-full">
              Fee Vouchers
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">Mathematics</p>
                  <p className="text-xs text-muted-foreground">Mid-term Exam</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">92/100</p>
                  <p className="text-xs text-muted-foreground">Grade: A</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">English</p>
                  <p className="text-xs text-muted-foreground">Mid-term Exam</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">88/100</p>
                  <p className="text-xs text-muted-foreground">Grade: A</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">Science</p>
                  <p className="text-xs text-muted-foreground">Mid-term Exam</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600">85/100</p>
                  <p className="text-xs text-muted-foreground">Grade: B+</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
