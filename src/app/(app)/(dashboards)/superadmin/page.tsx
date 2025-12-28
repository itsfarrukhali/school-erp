// src/app/(app)/(dashboards)/superadmin/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Building2,
  GraduationCap,
  UserPlus,
  Settings,
  BarChart3,
  Shield,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { schoolsApi } from "@/lib/api/schools";
import { usersApi } from "@/lib/api/users";
import { toast } from "sonner";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [schoolsRes, usersRes] = await Promise.all([
          schoolsApi.getSchools({ limit: 1 }),
          usersApi.getUsers({ limit: 1 }),
        ]);

        setStats({
          totalSchools: schoolsRes.success
            ? schoolsRes.data?.pagination?.total || 0
            : 0,
          totalUsers: usersRes.success
            ? usersRes.data?.pagination?.total || 0
            : 0,
          totalStudents: 0,
          totalTeachers: 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        toast.error("Failed to load dashboard statistics");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin Dashboard"
        description="Manage schools, administrators, and system-wide settings"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Schools"
          value={isLoading ? "..." : stats.totalSchools.toString()}
          description="Registered schools"
          icon={Building2}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatsCard
          title="Total Users"
          value={isLoading ? "..." : stats.totalUsers.toString()}
          description="All system users"
          icon={Users}
        />
        <StatsCard
          title="Students"
          value={isLoading ? "..." : stats.totalStudents.toString()}
          description="Enrolled students"
          icon={GraduationCap}
        />
        <StatsCard
          title="Teachers"
          value={isLoading ? "..." : stats.totalTeachers.toString()}
          description="Active teachers"
          icon={Users}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/superadmin/schools/create">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors group h-full">
            <CardContent className="flex flex-col items-center justify-center gap-3 p-6 min-h-[140px]">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">Create School</h3>
                <p className="text-sm text-muted-foreground">
                  Add a new school
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/superadmin/users/register-principal">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors group h-full">
            <CardContent className="flex flex-col items-center justify-center gap-3 p-6 min-h-[140px]">
              <div className="p-3 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <UserPlus className="h-6 w-6 text-blue-500" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">Register Principal</h3>
                <p className="text-sm text-muted-foreground">
                  Add school principal
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/superadmin/users">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors group h-full">
            <CardContent className="flex flex-col items-center justify-center gap-3 p-6 min-h-[140px]">
              <div className="p-3 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">Manage Users</h3>
                <p className="text-sm text-muted-foreground">View all users</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/superadmin/settings">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors group h-full">
            <CardContent className="flex flex-col items-center justify-center gap-3 p-6 min-h-[140px]">
              <div className="p-3 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                <Settings className="h-6 w-6 text-orange-500" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">System Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Configure system
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Overview Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Schools Overview</CardTitle>
                <CardDescription>
                  Recent schools added to the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No schools yet</p>
                  <Link href="/superadmin/schools/create">
                    <Button variant="link" className="mt-2">
                      Create your first school
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Statistics</CardTitle>
                <CardDescription>Users by role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Principals
                    </span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      School Admins
                    </span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Teachers
                    </span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Students
                    </span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>
                Latest actions performed in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analytics</CardTitle>
              <CardDescription>
                System-wide analytics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Analytics coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
