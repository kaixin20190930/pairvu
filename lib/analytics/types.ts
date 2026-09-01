export const PRODUCT_EVENT_NAMES = [
  "landing_view",
  "checker_started",
  "reference_upload_started",
  "reference_upload_completed",
  "reference_upload_failed",
  "candidate_upload_started",
  "candidate_upload_completed",
  "candidate_upload_failed",
  "analysis_submit_attempted",
  "analysis_submit_blocked",
  "analysis_started",
  "analysis_completed",
  "analysis_failed",
  "result_viewed",
  "issue_expanded",
  "feedback_submitted",
  "retry_clicked",
  "second_check_started",
  "contact_opt_in",
] as const;

export const CLIENT_PRODUCT_EVENT_NAMES = [
  "landing_view",
  "checker_started",
  "reference_upload_started",
  "reference_upload_completed",
  "reference_upload_failed",
  "candidate_upload_started",
  "candidate_upload_completed",
  "candidate_upload_failed",
  "analysis_submit_attempted",
  "analysis_submit_blocked",
  "result_viewed",
  "issue_expanded",
  "feedback_submitted",
  "retry_clicked",
  "second_check_started",
  "contact_opt_in",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];
export type ClientProductEventName = (typeof CLIENT_PRODUCT_EVENT_NAMES)[number];
export type ProductEventSource = "client" | "server";
export type ProductEventProperty = string | number | boolean | null;

export interface AcquisitionAttribution {
  referrerDomain?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

export interface ProductEventInput {
  idempotencyKey: string;
  eventName: ProductEventName;
  eventSource: ProductEventSource;
  anonymousSessionId: string;
  analysisId?: string;
  occurredAt: string;
  pagePath?: string;
  attribution?: AcquisitionAttribution;
  locale?: string;
  deviceClass?: string;
  properties?: Record<string, ProductEventProperty>;
}
