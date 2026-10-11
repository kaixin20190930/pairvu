export const REVIEW_ACTIONS = ["approve", "reject", "revoke"] as const;
export const REVIEW_CATEGORIES = ["false_positive", "false_negative", "intentional_change", "wrong_reference", "insufficient_evidence", "other"] as const;
export interface ReviewInput {
  requestId: string;
  expectedRevision: number;
  action: typeof REVIEW_ACTIONS[number];
  category: typeof REVIEW_CATEGORIES[number];
  reason: string;
  note: string | null;
}
export interface ReviewEvent extends ReviewInput {
  id: string;
  analysisId: string;
  workspaceId: string;
  actorId: string;
  revision: number;
  previousDecisionId: string | null;
  createdAt: string;
  machineSnapshot: Record<string, unknown>;
  machineSha256: string;
}
export interface ReviewState {
  revision: number;
  latest: ReviewEvent | null;
  currentDecision: ReviewEvent | null;
  history: ReviewEvent[];
  historyLimit: number;
}
export class ReviewError extends Error {
  constructor(public code: string, message: string, public status: number) {super(message);}
}
