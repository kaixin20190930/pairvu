export const PLAN_CODES = ["free", "starter", "growth", "agency"] as const;

export type PlanCode = (typeof PLAN_CODES)[number];
export type RetentionPolicyKey = "authenticated_7d" | "paid_30d";

export interface PlanEntitlements {
  code: PlanCode;
  name: string;
  monthlyPriceCents: number;
  includedMonthlyCredits: number;
  batchItemLimit: number;
  csvExportEnabled: boolean;
  priorityQueueEnabled: boolean;
  retentionPolicyKey: RetentionPolicyKey;
  retentionDays: number;
}

export const PLAN_ENTITLEMENTS: Record<PlanCode, PlanEntitlements> = {
  free: {
    code: "free",
    name: "Free",
    monthlyPriceCents: 0,
    includedMonthlyCredits: 10,
    batchItemLimit: 5,
    csvExportEnabled: false,
    priorityQueueEnabled: false,
    retentionPolicyKey: "authenticated_7d",
    retentionDays: 7,
  },
  starter: {
    code: "starter",
    name: "Starter",
    monthlyPriceCents: 1900,
    includedMonthlyCredits: 150,
    batchItemLimit: 20,
    csvExportEnabled: true,
    priorityQueueEnabled: false,
    retentionPolicyKey: "paid_30d",
    retentionDays: 30,
  },
  growth: {
    code: "growth",
    name: "Growth",
    monthlyPriceCents: 4900,
    includedMonthlyCredits: 600,
    batchItemLimit: 20,
    csvExportEnabled: true,
    priorityQueueEnabled: true,
    retentionPolicyKey: "paid_30d",
    retentionDays: 30,
  },
  agency: {
    code: "agency",
    name: "Agency",
    monthlyPriceCents: 9900,
    includedMonthlyCredits: 1500,
    batchItemLimit: 20,
    csvExportEnabled: true,
    priorityQueueEnabled: true,
    retentionPolicyKey: "paid_30d",
    retentionDays: 30,
  },
};

export function isPlanCode(value: string): value is PlanCode {
  return PLAN_CODES.includes(value as PlanCode);
}
