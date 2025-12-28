// src/app/(app)/(dashboards)/teacher/page.tsx
"use client";

import { useState } from "react";
import {
  GraduationCap,
  UserPlus,
  Calendar,
  BookOpen,
  ClipboardList,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats] = useState({
    myStudents: 0,
    classesAssigned: 0,
    todayAttendance: 0,
    pendingResults: 0,
  });

  const schoolName = user?.schools?.[0]?.schoolName || "School";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Dashboard"
        description={`Welcome back, ${user?.firstName || "Teacher"}! - ${schoolName}`}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="My Students"
          value={stats.myStudents.toString()}
          description="Students in your classes"
          icon={GraduationCap}
        />
        <StatsCard
          title="Classes"
          value={stats.classesAssigned.toString()}
          description="Assigned classes"
          icon={BookOpen}
        />
        <StatsCard
          title="Today's Attendance"
          value={`${stats.todayAttendance}%`}
          description="Students present"
          icon={Calendar}
        />
        <StatsCard
          title="Pending Results"
          value={stats.pendingResults.toString()}
          description="Results to submit"
          icon={ClipboardList}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/teacher/students/enroll">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Enroll Student</h3>
                <p className="text-sm text-muted-foreground">
                  Submit new admission
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/teacher/attendance">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <Calendar className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold">Mark Attendance</h3>
                <p className="text-sm text-muted-foreground">
                  Record student attendance
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/teacher/results">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <ClipboardList className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold">Enter Results</h3>
                <p className="text-sm text-muted-foreground">
                  Submit exam results
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/teacher/students">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                <Users className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold">My Students</h3>
                <p className="text-sm text-muted-foreground">
                  View student list
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Overview Tabs */}
      <Tabs defaultValue="classes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="classes">My Classes</TabsTrigger>
          <TabsTrigger value="schedule">Today&apos;s Schedule</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assigned Classes</CardTitle>
              <CardDescription>Classes you are teaching</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No classes assigned yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today&apos;s Schedule</CardTitle>
              <CardDescription>Your classes for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No schedule available</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Your latest actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
