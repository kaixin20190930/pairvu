import fs from "node:fs";
import path from "node:path";
import { checkPageContents, type CheckPageContent } from "../lib/seo/check-content";
import { seoPages } from "../lib/seo/content-registry";

const errors: string[] = [];
const root = process.cwd();
const publishedChecks = seoPages.filter((page) => page.family === "check" && page.status === "published");

for (const page of publishedChecks) {
  const content = checkPageContents.find((candidate) => candidate.route === page.route);
  if (!content) errors.push(`${page.route}: published check has no quality manifest`);
  else verifyCheck(content);
}

for (const content of checkPageContents) {
  const page = seoPages.find((candidate) => candidate.route === content.route);
  if (!page) errors.push(`${content.route}: quality manifest has no SEO registry entry`);
  else if (page.status !== "published" || !page.indexable) errors.push(`${content.route}: approved manifest must be published and indexable`);
}

for (let left = 0; left < checkPageContents.length; left += 1) {
  for (let right = left + 1; right < checkPageContents.length; right += 1) verifyPair(checkPageContents[left], checkPageContents[right]);
}

if (errors.length) {
  console.error(`Check content quality failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Check content quality passed: ${publishedChecks.length} published flagship page(s).`);

function verifyCheck(content: CheckPageContent) {
  const prefix = `${content.route}:`;
  const roles = new Set(content.evidence.map((item) => item.role));
  const decisions = new Set(content.evidence.map((item) => item.decision));
  requireValue(Boolean(content.founderApprovedAt), `${prefix} missing founder approval date`);
  requireValue(content.audience.length >= 120, `${prefix} audience is too shallow`);
  requireValue(content.directAnswer.length >= 250, `${prefix} direct answer is too shallow`);
  requireValue(content.scopeDistinction.length >= 220, `${prefix} scope distinction is too shallow`);
  requireValue(content.dimensions.length >= 4, `${prefix} needs at least 4 diagnostic dimensions`);
  requireValue(content.decisionRules.length >= 6, `${prefix} needs at least 6 decision rules`);
  requireValue(content.evidence.length >= 4, `${prefix} needs at least 4 controlled cases`);
  requireValue(roles.has("product_change") && roles.has("hard_negative") && roles.has("observability"), `${prefix} evidence roles are incomplete`);
  requireValue(decisions.has("PASS") && decisions.has("REVIEW") && decisions.has("FAIL"), `${prefix} evidence must cover PASS, REVIEW, and FAIL`);
  requireValue(content.diagnosticQuestions.length >= 5, `${prefix} needs at least 5 diagnostic questions`);
  requireValue(content.failureModes.length >= 5, `${prefix} needs at least 5 failure modes`);
  requireValue(content.workflow.length >= 5, `${prefix} needs at least 5 workflow steps`);
  requireValue(content.limitations.length >= 6, `${prefix} needs at least 6 limitations`);
  requireValue(content.faq.length >= 5, `${prefix} needs at least 5 FAQs`);
  requireValue(countWords(content) >= 1_500, `${prefix} has ${countWords(content)} structured words; minimum is 1500`);

  for (const rule of content.decisionRules) {
    requireValue(rule.pass.length >= 45 && rule.review.length >= 45 && rule.fail.length >= 45, `${prefix} decision guidance is too short for ${rule.condition}`);
  }
  for (const evidence of content.evidence) {
    requireValue(seoPages.some((page) => page.route === evidence.href && page.status === "published"), `${prefix} unpublished evidence: ${evidence.href}`);
    requireAsset(evidence.original, prefix);
    requireAsset(evidence.candidate, prefix);
  }
}

function verifyPair(left: CheckPageContent, right: CheckPageContent) {
  const leftTokens = meaningfulTokens(left);
  const rightTokens = meaningfulTokens(right);
  const intersection = new Set([...leftTokens].filter((token) => rightTokens.has(token)));
  const union = new Set([...leftTokens, ...rightTokens]);
  const similarity = union.size ? intersection.size / union.size : 1;
  const sharedEvidence = left.evidence.filter((item) => right.evidence.some((candidate) => candidate.href === item.href));
  const sharedDimensions = left.dimensions.filter((item) => right.dimensions.some((candidate) => candidate.title.toLowerCase() === item.title.toLowerCase()));
  requireValue(similarity < 0.55, `${left.route} and ${right.route}: lexical overlap ${(similarity * 100).toFixed(1)}% exceeds 55%`);
  requireValue(sharedEvidence.length <= 1, `${left.route} and ${right.route}: checks may share at most one controlled case`);
  requireValue(sharedDimensions.length === 0, `${left.route} and ${right.route}: diagnostic dimension titles must be unique`);
}

function requireAsset(asset: string, prefix: string) {
  requireValue(fs.existsSync(path.join(root, "public", asset.replace(/^\//, ""))), `${prefix} missing asset: ${asset}`);
}

function requireValue(condition: boolean, message: string) {
  if (!condition) errors.push(message);
}

function countWords(value: unknown): number {
  if (typeof value === "string") return value.match(/[A-Za-z0-9%]+(?:[-'][A-Za-z0-9%]+)*/g)?.length ?? 0;
  if (Array.isArray(value)) return value.reduce((total, item) => total + countWords(item), 0);
  if (value && typeof value === "object") return Object.values(value).reduce<number>((total, item) => total + countWords(item), 0);
  return 0;
}

function meaningfulTokens(content: CheckPageContent) {
  const ignored = new Set(["about", "after", "again", "approved", "before", "between", "both", "candidate", "change", "changed", "check", "compare", "comparison", "different", "evidence", "final", "from", "image", "images", "pairvu", "product", "reference", "review", "should", "that", "their", "these", "they", "this", "visible", "when", "where", "which", "while", "with", "without"]);
  const words = JSON.stringify(content).toLowerCase().match(/[a-z0-9%]+(?:-[a-z0-9%]+)*/g) ?? [];
  return new Set(words.filter((word) => word.length >= 4 && !ignored.has(word)));
}
