// src/app/(app)/(dashboards)/operator/page.tsx
"use client";

import { FileText, Users, CheckCircle, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function OperatorDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Computer Operator Dashboard"
        description="Manage data entry and record keeping"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Records Created"
          value="124"
          description="This month"
          icon={FileText}
          trend={{ value: 18.2, isPositive: true }}
        />
        <StatsCard
          title="Students Processed"
          value="86"
          description="Data entry completed"
          icon={Users}
        />
        <StatsCard
          title="Pending Tasks"
          value="12"
          description="Awaiting processing"
          icon={CheckCircle}
        />
        <StatsCard
          title="Efficiency Rate"
          value="94%"
          description="Task completion"
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
            <Link href="/dashboards/teacher/create-student" className="block">
              <Button className="w-full">Create Student Record</Button>
            </Link>
            <Button variant="outline" className="w-full">
              Update Student Data
            </Button>
            <Button variant="outline" className="w-full">
              Generate Reports
            </Button>
            <Button variant="outline" className="w-full">
              Data Management
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Student Record Added</p>
                  <p className="text-xs text-muted-foreground">
                    GR-2453 - Grade 7 - 30 mins ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Data Updated</p>
                  <p className="text-xs text-muted-foreground">
                    Attendance Records - 1 hour ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Report Generated</p>
                  <p className="text-xs text-muted-foreground">
                    Monthly Student Report - 2 hours ago
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
