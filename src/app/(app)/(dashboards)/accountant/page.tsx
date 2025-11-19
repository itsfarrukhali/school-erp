// src/app/(app)/(dashboards)/accountant/page.tsx
"use client";

import { DollarSign, TrendingUp, CreditCard, Receipt } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AccountantDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Accountant Dashboard"
        description="Manage school finances and fee collections"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value="$485K"
          description="This month"
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatsCard
          title="Pending Payments"
          value="$42K"
          description="Outstanding amount"
          icon={CreditCard}
        />
        <StatsCard
          title="Collected This Week"
          value="$68K"
          description="Fee collections"
          icon={Receipt}
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatsCard
          title="Collection Rate"
          value="92%"
          description="Payment efficiency"
          icon={TrendingUp}
          trend={{ value: 3.1, isPositive: true }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full">Generate Vouchers</Button>
            <Button variant="outline" className="w-full">
              View Pending Payments
            </Button>
            <Button variant="outline" className="w-full">
              Financial Reports
            </Button>
            <Button variant="outline" className="w-full">
              Expense Management
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">Fee Payment</p>
                  <p className="text-xs text-muted-foreground">
                    Student ID: 2453 - Grade 8
                  </p>
                </div>
                <p className="text-sm font-bold text-green-600">+$1,200</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">Salary Disbursement</p>
                  <p className="text-xs text-muted-foreground">
                    Staff Payroll - 15 Members
                  </p>
                </div>
                <p className="text-sm font-bold text-red-600">-$28,500</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">Fee Payment</p>
                  <p className="text-xs text-muted-foreground">
                    Student ID: 3124 - Grade 5
                  </p>
                </div>
                <p className="text-sm font-bold text-green-600">+$950</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
