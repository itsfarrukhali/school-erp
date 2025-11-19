// src/utils/audit.ts
import prisma from "@/lib/prisma";

export async function createAuditLog({
  entityType,
  entityId,
  action,
  performedBy,
  before,
  after,
  note,
  schoolId,
}: {
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  before?: unknown;
  after?: unknown;
  note?: string;
  schoolId?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        entityType,
        entityId,
        action,
        performedBy,
        before: before ? JSON.stringify(before) : undefined,
        after: after ? JSON.stringify(after) : undefined,
        note,
        schoolId,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
