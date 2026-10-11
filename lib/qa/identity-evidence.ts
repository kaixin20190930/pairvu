import type { VisionObservation } from "./types";

// Detect explicit absence/illegibility, not generic "no differences" statements.
const textAbsent = /\b(?:no|without)\s+(?:(?:readable|legible|identity[- ]bearing|visible|any)\s+)*(?:text|words|lettering|characters|values)\b(?!\s+(?:differences?|changes?))|\b(?:text|words|lettering|characters)\b[^.]{0,45}\b(?:unreadable|illegible|not readable|cannot be read)\b/i;
const logoAbsent = /\b(?:no|without)\s+(?:(?:visible|recognizable|identifiable|distinctive|any)\s+)*(?:logo|brand|mark)\b(?!\s+(?:differences?|changes?))|\b(?:logo|brand|mark)\b[^.]{0,45}\b(?:unidentifiable|not identifiable|cannot be identified)\b/i;
const genericLogo = /\b(?:logo|brand)\s+(?:bar|rectangle|rectangular bar)|\b(?:bar|rectangle)\s+(?:as|is)\s+(?:a\s+)?logo\b/i;
const placeholder = /^(?:none|null|n\/?a|unknown|unreadable|not visible|not applicable|no text|no logo)$/i;
const geometricIdentity = /^(?:(?:a|an|the|black|white|blue|red|green|solid|plain|rectangular|rectangle|square|circular|round|horizontal|vertical|logo|brand|mark|bar|shape|at|top|center|of|bottle)[\s,.-]*)+$/i;

/** Narrow consistency guard, not an OCR or visual verification algorithm. */
export function identityEvidenceProblem(observation: VisionObservation): string | null {
  if (!["logo", "visible_text"].includes(observation.checkType)) return null;
  const evidence = observation.evidence;
  const descriptions = [evidence.referenceObservation, evidence.candidateObservation, evidence.comparisonSummary, observation.explanation, ...(evidence.visibleEvidence ?? [])].filter(Boolean).join(". ");
  const absent = observation.checkType === "visible_text" ? textAbsent : logoAbsent;
  if (absent.test(descriptions)) {
    return observation.checkType === "visible_text"
      ? "Readable identity-bearing text is absent or unreadable; visual similarity cannot verify this check."
      : "A recognizable logo identity is absent or cannot be established.";
  }
  const identity = evidence.identityEvidence;
  if (identity) {
    for (const value of [identity.reference, identity.candidate]) {
      if (typeof value !== "string" || !value.trim() || placeholder.test(value.trim()) || absent.test(value) || (observation.checkType === "logo" && geometricIdentity.test(value.trim()))) {
        return "Both images require directly observed identity evidence; empty, unreadable or generic shape evidence is insufficient.";
      }
    }
  }
  if (observation.checkType === "logo" && genericLogo.test(descriptions)) {
    return "A generic geometric bar does not establish a recognizable logo identity.";
  }
  return null;
}
