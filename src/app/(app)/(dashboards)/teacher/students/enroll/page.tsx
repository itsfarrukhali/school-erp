// src/app/(app)/(dashboards)/teacher/students/enroll/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { EnrollStudentForm } from "@/components/forms/enroll-student-form";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function EnrollStudentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const schoolId = user?.schools?.[0]?.schoolId;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enroll New Student"
        description="Submit a new student admission application"
      />

      <EnrollStudentForm
        defaultSchoolId={schoolId}
        onSuccess={() => router.push("/teacher")}
      />
    </div>
  );
}
