import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { CreateCampusForm } from "@/components/forms/create-campus-form";
import { PageHeader } from "@/components/shared/page-header";

interface CreateCampusPageProps {
  params: Promise<{
    schoolId: string;
  }>;
}

export default async function CreateCampusPage({ params }: CreateCampusPageProps) {
  const { schoolId } = await params;

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true },
  });

  if (!school) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Campus"
        description={`Add a new campus to ${school.name}`}
      />
      <CreateCampusForm schoolId={school.id} schoolName={school.name} />
    </div>
  );
}
