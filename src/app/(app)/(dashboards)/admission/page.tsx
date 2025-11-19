// src/app/(app)/(dashboards)/admission/page.tsx
"use client";

import { UserPlus, UserCheck, UserX, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdmissionDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admission Officer Dashboard"
        description="Manage student admissions and approvals"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Pending Approvals"
          value="12"
          description="Awaiting review"
          icon={UserPlus}
        />
        <StatsCard
          title="Approved This Month"
          value="58"
          description="Student admissions approved"
          icon={UserCheck}
          trend={{ value: 22.4, isPositive: true }}
        />
        <StatsCard
          title="Rejected This Month"
          value="4"
          description="Applications rejected"
          icon={UserX}
        />
        <StatsCard
          title="Total Students"
          value="856"
          description="Currently enrolled"
          icon={Users}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboards/admission/pending-approvals" className="block">
              <Button className="w-full">Pending Approvals</Button>
            </Link>
            <Link href="/dashboards/teacher/create-student" className="block">
              <Button variant="outline" className="w-full">
                Create Student
              </Button>
            </Link>
            <Button variant="outline" className="w-full">
              View All Students
            </Button>
            <Button variant="outline" className="w-full">
              Admission Reports
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
                  <p className="text-sm font-medium">Application Approved</p>
                  <p className="text-xs text-muted-foreground">
                    Ahmed Khan - Grade 5 - 30 mins ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New Application</p>
                  <p className="text-xs text-muted-foreground">
                    Sara Ali - Grade 3 - 1 hour ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Application Approved</p>
                  <p className="text-xs text-muted-foreground">
                    Omar Hassan - Grade 8 - 2 hours ago
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
