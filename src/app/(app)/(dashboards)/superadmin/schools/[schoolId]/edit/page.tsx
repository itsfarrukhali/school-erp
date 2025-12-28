// src/app/(app)/(dashboards)/superadmin/schools/[schoolId]/edit/page.tsx
"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EditSchoolForm } from "@/components/forms/edit-school-form";
import { schoolsApi, type School } from "@/lib/api/schools";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "sonner";

export default function EditSchoolPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const router = useRouter();
  const { schoolId } = use(params);
  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const response = await schoolsApi.getSchool(schoolId);
        if (response.success && response.data) {
          setSchool(response.data);
        } else {
          toast.error("Failed to load school", {
            description: response.message,
          });
          router.push("/superadmin/schools");
        }
      } catch (error) {
        console.error("Error fetching school:", error);
        toast.error("Error loading school");
        router.push("/superadmin/schools");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchool();
  }, [schoolId, router]);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!school) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={`Edit ${school.name}`}
          description="Update school information"
        />
      </div>

      <EditSchoolForm school={school} />
    </div>
  );
}
