import {REVIEW_ACTIONS, REVIEW_CATEGORIES, ReviewError, type ReviewInput} from "./types";

const invalid = () => {throw new ReviewError("invalid_review", "Provide a request UUID, current revision, action, category, reason (1–1000 characters) and optional note (up to 2000 characters).", 400);};
export function normalizeReview(value: unknown): ReviewInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
  const v = value as Record<string, unknown>;
  if (Object.keys(v).some(k => !["requestId", "expectedRevision", "action", "category", "reason", "note"].includes(k))) return invalid();
  if (typeof v.requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.requestId) || !Number.isSafeInteger(v.expectedRevision) || Number(v.expectedRevision) < 0 || Number(v.expectedRevision) >= Number.MAX_SAFE_INTEGER) return invalid();
  if (!REVIEW_ACTIONS.includes(v.action as ReviewInput["action"]) || !REVIEW_CATEGORIES.includes(v.category as ReviewInput["category"])) return invalid();
  if (typeof v.reason !== "string" || !v.reason.trim() || v.reason.trim().length > 1000 || !/[\p{L}\p{N}\p{P}\p{S}]/u.test(v.reason.replace(/[\p{Default_Ignorable_Code_Point}\p{Cc}\p{Cf}]/gu,""))) return invalid();
  if (v.note != null && (typeof v.note !== "string" || v.note.trim().length > 2000)) return invalid();
  return {requestId: v.requestId.toLowerCase(), expectedRevision: v.expectedRevision as number, action: v.action as ReviewInput["action"], category: v.category as ReviewInput["category"], reason: v.reason.trim(), note: typeof v.note === "string" ? v.note.trim() || null : null};
}
export async function readReviewRequest(request: Request): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new ReviewError("invalid_review", "Use application/json.", 400);
  const reader = request.body?.getReader(); let bytes = 0; const chunks: Uint8Array[] = [];
  if (reader) for (;;) {const {done,value} = await reader.read(); if(done) break; bytes += value.byteLength; if(bytes > 16384) {await reader.cancel(); throw new ReviewError("review_too_large", "Review request exceeds 16 KiB.", 413);} chunks.push(value);}
  const data = new Uint8Array(bytes); let offset=0; for(const chunk of chunks) {data.set(chunk,offset); offset+=chunk.length;}
  try {return JSON.parse(new TextDecoder().decode(data));} catch {throw new ReviewError("invalid_review", "Provide valid JSON.", 400);}
}
export function requireSameOrigin(request: Request) {
  const origin=request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin || ["cross-site","same-site"].includes(request.headers.get("sec-fetch-site") ?? "")) throw new ReviewError("review_origin_rejected", "Submit this decision from the same origin.",403);
}
export async function reviewHash(value: string) {
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
}
