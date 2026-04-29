import { prisma } from "@/lib/prisma";
import { isPlanAtLeast, type PlanType } from "@/lib/plans";
import { reportAsyncError } from "@/lib/monitoring";

interface AuditParams {
  orgId: string;
  orgPlan: PlanType;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
}

export async function logAudit(params: AuditParams): Promise<void> {
  // Only persist detailed audit logs for EMPRESARIAL plan
  if (!isPlanAtLeast(params.orgPlan, "EMPRESARIAL")) return;

  prisma.auditLog.create({
    data: {
      organizationId: params.orgId,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      before: params.before ? JSON.parse(JSON.stringify(params.before)) : undefined,
      after: params.after ? JSON.parse(JSON.stringify(params.after)) : undefined,
      ip: params.ip,
    },
  }).catch((error) => {
    reportAsyncError("audit.logAudit.create", error, {
      organizationId: params.orgId,
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
    });
  }); // fire-and-forget, non-blocking
}
