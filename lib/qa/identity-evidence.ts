import type { VisionObservation } from "./types";
import { isProtocolIdentity } from "./identity-protocol";

export const IDENTITY_EVIDENCE_VERSION = "identity-evidence-004";

// Detect explicit absence/illegibility, not generic "no differences" statements.
const textAbsent = /\b(?:no|without)\s+(?:(?:readable|legible|identity[- ]bearing|visible|any)\s+)*(?:text|words|lettering|characters|values)\b(?!\s+(?:differences?|changes?))|\b(?:text|words|lettering|characters)\b[^.]{0,45}\b(?:unreadable|illegible|not readable|cannot be read)\b/i;
const logoAbsent = /\b(?:no|without)\s+(?:(?:visible|recognizable|identifiable|distinctive|any)\s+)*(?:logo|brand|mark)\b(?!\s+(?:differences?|changes?))|\b(?:logo|brand|mark)\b[^.]{0,45}\b(?:unidentifiable|not identifiable|cannot be identified)\b/i;
const genericLogo = /\b(?:logo|brand)\s+(?:bar|rectangle|rectangular bar)|\b(?:bar|rectangle)\s+(?:as|is)\s+(?:a\s+)?logo\b/i;
const placeholder = /^(?:none|null|n\/?a|unknown|unreadable|not visible|not applicable|no text|no logo)$/i;

/** Canonical view for checks only. Never overwrite the original model evidence. */
export function visibleIdentity(value: string): string {
  return value.replace(/[®™℠]/gu, "").normalize("NFKC").replace(/\s+/gu, " ")
    .replace(/[\p{Default_Ignorable_Code_Point}\p{Cc}\p{Cf}]/gu, "").trim();
}

// Explicit metric/count units only; no guessed locale or ounce conventions.
const quantityUnits: Record<string, [string, bigint, bigint]> = {};
function unit(aliases: string[], dimension: string, numerator: bigint, denominator = BigInt(1)) {
  for (const alias of aliases) quantityUnits[alias] = [dimension, numerator, denominator];
}
unit(["ml", "milliliter", "milliliters", "millilitre", "millilitres"], "volume", BigInt(1), BigInt(1000));
unit(["cl", "centiliter", "centiliters", "centilitre", "centilitres"], "volume", BigInt(1), BigInt(100));
unit(["dl", "deciliter", "deciliters", "decilitre", "decilitres"], "volume", BigInt(1), BigInt(10));
unit(["l", "liter", "liters", "litre", "litres"], "volume", BigInt(1));
unit(["mg", "milligram", "milligrams"], "mass", BigInt(1), BigInt(1000));
unit(["g", "gram", "grams"], "mass", BigInt(1));
unit(["kg", "kilogram", "kilograms"], "mass", BigInt(1000));
unit(["mm", "millimeter", "millimeters", "millimetre", "millimetres"], "length", BigInt(1), BigInt(1000));
unit(["cm", "centimeter", "centimeters", "centimetre", "centimetres"], "length", BigInt(1), BigInt(100));
unit(["m", "meter", "meters", "metre", "metres"], "length", BigInt(1));
unit(["pc", "pcs", "piece", "pieces", "count", "ct"], "count", BigInt(1));
unit(["%", "percent"], "percent", BigInt(1));
const quantityPattern = new RegExp(`(?<![\\p{L}\\p{N}.,+-])([+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+))\\s*(${Object.keys(quantityUnits).sort((a,b)=>b.length-a.length).join("|")})(?![\\p{L}\\p{N}])`, "giu");
function gcd(a: bigint, b: bigint): bigint { a = a < BigInt(0) ? -a : a; while (b) { const remainder = a % b; a = b; b = remainder; } return a; }

/** Compare literal identity evidence, not free-form descriptions or visual truth. */
export function canonicalIdentity(value: string, quantities: boolean): string {
  const normalized = visibleIdentity(value).toLowerCase();
  const parts: string[][] = [];
  function literal(text: string) {
    let cursor = 0;
    const appendText = (text: string) => {
      const canonical = text.replace(/[.,;:!?()[\]{}"'’“”]/gu, " ").replace(/\s+/gu, " ").trim();
      if (canonical) parts.push(["text", canonical]);
    };
    // Preserve signs, leading zeros and unknown decimal/grouping conventions.
    for (const match of text.matchAll(/(?<![\p{L}\p{N}.,+-])([+-]?(?:\d+(?:[.,]\d+)?|\.\d+))(?![\p{L}\p{N}])/gu)) {
      appendText(text.slice(cursor, match.index));
      parts.push(["literal-number", match[0]]);
      cursor = match.index + match[0].length;
    }
    appendText(text.slice(cursor));
  }
  let cursor = 0;
  if (quantities) for (const match of normalized.matchAll(quantityPattern)) {
    const [, number, name] = match;
    if (number.length > 60) continue;
    literal(normalized.slice(cursor, match.index));
    const [dimension, factor, divisor] = quantityUnits[name.toLowerCase()];
    const [integer, fraction = ""] = number.split(".");
    const negative = number.startsWith("-");
    let numerator = BigInt((integer.replace(/^[+-]/, "") || "0") + fraction) * factor * (negative ? -BigInt(1) : BigInt(1));
    let denominator = BigInt(10) ** BigInt(fraction.length) * divisor;
    const common = gcd(numerator, denominator); numerator /= common; denominator /= common;
    parts.push(["quantity", dimension, String(numerator), String(denominator)]);
    cursor = match.index + match[0].length;
  }
  literal(normalized.slice(cursor));
  // Typed segments cannot collide with model text that resembles an internal marker.
  return JSON.stringify(parts);
}

/** Narrow consistency guard, not an OCR or visual verification algorithm. */
export function identityEvidenceProblem(observation: VisionObservation): {reason: string; kind: "insufficient" | "conflict"} | null {
  if (!["logo", "visible_text"].includes(observation.checkType)) return null;
  const evidence = observation.evidence;
  const descriptions = [evidence.referenceObservation, evidence.candidateObservation, evidence.comparisonSummary, observation.explanation, ...(evidence.visibleEvidence ?? [])].filter(Boolean).join(". ");
  const absent = observation.checkType === "visible_text" ? textAbsent : logoAbsent;
  if (absent.test(descriptions)) {
    return {kind: "insufficient", reason: observation.checkType === "visible_text"
      ? "Readable identity-bearing text is absent or unreadable; visual similarity cannot verify this check."
      : "A recognizable logo identity is absent or cannot be established."};
  }
  const identity = evidence.identityEvidence;
  if (identity) {
    const expectedKind = observation.checkType === "logo" ? "brand_name" : "readable_text";
    if (identity.referenceKind !== expectedKind || identity.candidateKind !== expectedKind) {
      return {kind: "insufficient", reason: "Identity evidence must declare directly comparable readable text or a brand name; untyped, symbolic and object geometry evidence cannot establish identity."};
    }
    for (const value of [identity.reference, identity.candidate]) {
      if (typeof value === "string" && isProtocolIdentity(value)) {
        return {kind: "insufficient", reason: "Protocol metadata or a template placeholder is not directly observed entity identity; human review is required."};
      }
      if (typeof value !== "string" || !/[\p{L}\p{N}]/u.test(visibleIdentity(value)) || placeholder.test(visibleIdentity(value)) || absent.test(visibleIdentity(value))) {
        return {kind: "insufficient", reason: "Both images require visible identity evidence; blank, invisible or unreadable content is insufficient."};
      }
    }
    if (observation.status === "match" && canonicalIdentity(identity.reference!, observation.checkType === "visible_text") !== canonicalIdentity(identity.candidate!, observation.checkType === "visible_text")) {
      return {kind: "conflict", reason: "The reported match contradicts the separate identity transcriptions or their printed quantities/units; human review is required."};
    }
  }
  if (observation.checkType === "logo" && genericLogo.test(descriptions)) {
    return {kind: "insufficient", reason: "A generic geometric bar does not establish a recognizable logo identity."};
  }
  return null;
}
