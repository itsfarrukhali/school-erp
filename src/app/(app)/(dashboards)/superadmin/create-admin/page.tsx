// src/app/(app)/(dashboards)/superadmin/create-admin/page.tsx
import { PageHeader } from "@/components/shared/page-header";
import { AdminRegistrationForm } from "@/components/forms/admin-registration-form";

export default function CreateAdminPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Create Admin"
        description="Register a new administrator for the platform"
      />
      <AdminRegistrationForm />
    </div>
  );
}
