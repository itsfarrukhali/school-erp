// src/app/(app)/(dashboards)/teacher/page.tsx
"use client";

import { Users, Calendar, BookOpen, ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TeacherDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Dashboard"
        description="Manage your classes and students"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="My Classes"
          value="5"
          description="Assigned classes"
          icon={BookOpen}
        />
        <StatsCard
          title="Total Students"
          value="142"
          description="Students across all classes"
          icon={Users}
        />
        <StatsCard
          title="Today's Classes"
          value="3"
          description="Scheduled for today"
          icon={Calendar}
        />
        <StatsCard
          title="Pending Assignments"
          value="8"
          description="Awaiting submission"
          icon={ClipboardCheck}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboards/teacher/create-student" className="block">
              <Button className="w-full">Create Student</Button>
            </Link>
            <Button variant="outline" className="w-full">
              Mark Attendance
            </Button>
            <Button variant="outline" className="w-full">
              View Timetable
            </Button>
            <Button variant="outline" className="w-full">
              Submit Grades
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Mathematics</p>
                  <p className="text-xs text-muted-foreground">
                    Grade 8-A • 9:00 AM - 10:00 AM
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Mathematics</p>
                  <p className="text-xs text-muted-foreground">
                    Grade 8-B • 10:15 AM - 11:15 AM
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Mathematics</p>
                  <p className="text-xs text-muted-foreground">
                    Grade 9-A • 1:00 PM - 2:00 PM
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
