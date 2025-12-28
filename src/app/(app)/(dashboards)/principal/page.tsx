// src/app/(app)/(dashboards)/principal/page.tsx
"use client";

import { useState } from "react";
import {
  Users,
  GraduationCap,
  UserPlus,
  Shield,
  Calendar,
  DollarSign,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

export default function PrincipalDashboard() {
  const { user } = useAuth();
  const [stats] = useState({
    totalStaff: 0,
    totalTeachers: 0,
    totalStudents: 0,
    pendingAdmissions: 0,
  });

  const schoolName = user?.schools?.[0]?.schoolName || "Your School";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Principal Dashboard"
        description={`Welcome back! Managing ${schoolName}`}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Staff"
          value={stats.totalStaff.toString()}
          description="School staff members"
          icon={Users}
        />
        <StatsCard
          title="Teachers"
          value={stats.totalTeachers.toString()}
          description="Active teachers"
          icon={BookOpen}
        />
        <StatsCard
          title="Students"
          value={stats.totalStudents.toString()}
          description="Enrolled students"
          icon={GraduationCap}
        />
        <StatsCard
          title="Pending Admissions"
          value={stats.pendingAdmissions.toString()}
          description="Awaiting approval"
          icon={ClipboardList}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/principal/staff/register">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Register Staff</h3>
                <p className="text-sm text-muted-foreground">
                  Add new staff member
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/principal/users">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <Shield className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold">Manage Permissions</h3>
                <p className="text-sm text-muted-foreground">
                  Control user access
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/principal/admissions">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <ClipboardList className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold">Review Admissions</h3>
                <p className="text-sm text-muted-foreground">
                  Approve/reject applications
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/principal/reports">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                <DollarSign className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold">Financial Reports</h3>
                <p className="text-sm text-muted-foreground">
                  View fee collections
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Overview Tabs */}
      <Tabs defaultValue="staff" className="space-y-4">
        <TabsList>
          <TabsTrigger value="staff">Staff Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Staff by Role</CardTitle>
                <CardDescription>Distribution of staff members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Accountants</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Admission Officers</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Campus Heads</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Computer Operators</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Teachers</span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Staff Activity</CardTitle>
                <CardDescription>Latest staff logins</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Student Overview</CardTitle>
              <CardDescription>Students by class</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No students enrolled yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today&apos;s Attendance</CardTitle>
              <CardDescription>Attendance summary for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No attendance data available</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
