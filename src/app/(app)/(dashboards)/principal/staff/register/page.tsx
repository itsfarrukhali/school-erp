// src/app/(app)/(dashboards)/principal/staff/register/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { RegisterUserForm } from "@/components/forms/register-user-form";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RegisterStaffPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Register Staff Member"
        description="Add new staff members to your school"
      />

      <Tabs defaultValue="accountant" className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="accountant">Accountant</TabsTrigger>
          <TabsTrigger value="admissionofficer">Admission Officer</TabsTrigger>
          <TabsTrigger value="campushead">Campus Head</TabsTrigger>
          <TabsTrigger value="operator">Computer Operator</TabsTrigger>
          <TabsTrigger value="teacher">Teacher</TabsTrigger>
        </TabsList>

        <TabsContent value="accountant">
          <RegisterUserForm
            userType="accountant"
            onSuccess={() => router.push("/principal/users")}
          />
        </TabsContent>

        <TabsContent value="admissionofficer">
          <RegisterUserForm
            userType="admissionofficer"
            onSuccess={() => router.push("/principal/users")}
          />
        </TabsContent>

        <TabsContent value="campushead">
          <RegisterUserForm
            userType="campushead"
            onSuccess={() => router.push("/principal/users")}
          />
        </TabsContent>

        <TabsContent value="operator">
          <RegisterUserForm
            userType="operator"
            onSuccess={() => router.push("/principal/users")}
          />
        </TabsContent>

        <TabsContent value="teacher">
          <RegisterUserForm
            userType="teacher"
            onSuccess={() => router.push("/principal/users")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
