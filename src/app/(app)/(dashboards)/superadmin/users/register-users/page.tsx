// src/app/(app)/(dashboards)/superadmin/users/register-principal/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { RegisterUserForm } from "@/components/forms/register-user-form";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RegisterPrincipalPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Register User"
        description="Register a new system user (Admin, Principal, School Admin)"
      />

      <Tabs defaultValue="admin" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="principal">Principal</TabsTrigger>
          <TabsTrigger value="schooladmin">School Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="admin">
          <RegisterUserForm
            userType="admin"
            onSuccess={() => router.push("/superadmin/users")}
          />
        </TabsContent>

        <TabsContent value="principal">
          <RegisterUserForm
            userType="principal"
            onSuccess={() => router.push("/superadmin/users")}
          />
        </TabsContent>

        <TabsContent value="schooladmin">
          <RegisterUserForm
            userType="schooladmin"
            onSuccess={() => router.push("/superadmin/users")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
