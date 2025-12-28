// src/app/(app)/(dashboards)/superadmin/schools/create/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { CreateSchoolForm } from "@/components/forms/create-school-form";
import { useRouter } from "next/navigation";

export default function CreateSchoolPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New School"
        description="Add a new school to the ERP system"
      />

      <CreateSchoolForm 
        onSuccess={() => {
          router.push("/superadmin");
        }}
      />
    </div>
  );
}
