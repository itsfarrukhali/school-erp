// src/app/(app)/(dashboards)/parent/page.tsx
"use client";

import { Users, Calendar, Trophy, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ParentDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Parent Dashboard"
        description="Monitor your children's academic progress"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="My Children"
          value="2"
          description="Enrolled students"
          icon={Users}
        />
        <StatsCard
          title="Average Attendance"
          value="95%"
          description="This month"
          icon={Calendar}
        />
        <StatsCard
          title="Upcoming Events"
          value="4"
          description="School activities"
          icon={Trophy}
        />
        <StatsCard
          title="Fee Status"
          value="Paid"
          description="All children"
          icon={DollarSign}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Children&apos;s Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">Ahmed Khan</p>
                    <p className="text-sm text-muted-foreground">Grade 8-A • GR-2453</p>
                  </div>
                  <Button size="sm" variant="outline">View Details</Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Attendance</p>
                    <p className="font-medium text-green-600">96%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Average Grade</p>
                    <p className="font-medium text-blue-600">A (88%)</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">Sara Khan</p>
                    <p className="text-sm text-muted-foreground">Grade 5-B • GR-1892</p>
                  </div>
                  <Button size="sm" variant="outline">View Details</Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Attendance</p>
                    <p className="font-medium text-green-600">94%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Average Grade</p>
                    <p className="font-medium text-blue-600">A+ (92%)</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
            <Button variant="outline" className="w-full">
              Contact Teachers
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
