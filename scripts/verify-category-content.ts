import fs from "node:fs";
import path from "node:path";
import { categoryPageContents, type CategoryPageContent } from "../lib/seo/category-content";
import { seoPages } from "../lib/seo/content-registry";

const errors: string[] = [];
const root = process.cwd();
const publishedCategories = seoPages.filter((page) => page.family === "category" && page.status === "published");

for (const page of publishedCategories) {
  const content = categoryPageContents.find((candidate) => candidate.route === page.route);
  if (!content) {
    errors.push(`${page.route}: published category has no quality manifest`);
    continue;
  }

  verifyCategory(content);
}

for (const content of categoryPageContents) {
  const registryPage = seoPages.find((page) => page.route === content.route);
  if (!registryPage) {
    errors.push(`${content.route}: quality manifest has no SEO registry entry`);
  } else if (registryPage.status !== "published" || !registryPage.indexable) {
    errors.push(`${content.route}: approved quality manifest must be published and indexable`);
  }
}

for (let leftIndex = 0; leftIndex < categoryPageContents.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < categoryPageContents.length; rightIndex += 1) {
    verifyCategoryPair(categoryPageContents[leftIndex], categoryPageContents[rightIndex]);
  }
}

if (errors.length) {
  console.error(`Category content quality failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Category content quality passed: ${publishedCategories.length} published flagship page(s).`);

function verifyCategory(content: CategoryPageContent) {
  const prefix = `${content.route}:`;
  const roles = new Set(content.evidence.map((item) => item.role));
  const decisions = new Set(content.evidence.map((item) => item.decision));
  const evidenceLinks = new Set(content.evidence.map((item) => item.href));
  const wordCount = countWords(content);

  requireValue(Boolean(content.founderApprovedAt), `${prefix} missing founder approval date`);
  requireValue(content.audience.length >= 120, `${prefix} audience definition is too shallow`);
  requireValue(content.searchIntentEvidence.length >= 160, `${prefix} search-intent evidence is too shallow`);
  requireValue(content.packagingFormats.length >= 5, `${prefix} needs at least 5 supported packaging formats`);
  requireValue(content.identityHierarchy.length >= 6, `${prefix} needs at least 6 identity attributes`);
  requireValue(content.decisionRules.length >= 8, `${prefix} needs at least 8 PASS/REVIEW/FAIL decision rules`);
  requireValue(content.evidence.length >= 3, `${prefix} needs at least 3 controlled evidence cases`);
  requireValue(roles.has("product_change"), `${prefix} needs a confirmed product-change case`);
  requireValue(roles.has("hard_negative"), `${prefix} needs a hard-negative case`);
  requireValue(roles.has("observability"), `${prefix} needs an observability case`);
  requireValue(decisions.has("PASS") && decisions.has("REVIEW") && decisions.has("FAIL"), `${prefix} evidence must cover PASS, REVIEW, and FAIL`);
  requireValue(evidenceLinks.size === content.evidence.length, `${prefix} evidence links must be unique`);
  requireValue(content.failureModes.length >= 5, `${prefix} needs at least 5 category-specific failure modes`);
  requireValue(content.uniqueInsights.length >= 3, `${prefix} needs at least 3 category-specific insight sections`);
  requireValue(content.inputRequirements.length >= 5, `${prefix} needs at least 5 input requirements`);
  requireValue(content.workflow.length >= 5, `${prefix} needs at least 5 workflow steps`);
  requireValue(content.limitations.length >= 6, `${prefix} needs at least 6 explicit limitations`);
  requireValue(content.faq.length >= 5, `${prefix} needs at least 5 category-specific questions`);
  requireValue(wordCount >= 1_500, `${prefix} has ${wordCount} structured content words; minimum is 1500`);

  for (const rule of content.decisionRules) {
    requireValue(rule.pass.length >= 45, `${prefix} PASS guidance is too short for ${rule.attribute}`);
    requireValue(rule.review.length >= 45, `${prefix} REVIEW guidance is too short for ${rule.attribute}`);
    requireValue(rule.fail.length >= 45, `${prefix} FAIL guidance is too short for ${rule.attribute}`);
  }

  for (const evidence of content.evidence) {
    const registryEvidence = seoPages.find((page) => page.route === evidence.href);
    requireValue(Boolean(registryEvidence?.status === "published"), `${prefix} evidence route is not published: ${evidence.href}`);
    requireAsset(evidence.original, prefix);
    requireAsset(evidence.candidate, prefix);
  }
}

function requireAsset(asset: string, prefix: string) {
  const assetPath = path.join(root, "public", asset.replace(/^\//, ""));
  requireValue(fs.existsSync(assetPath), `${prefix} missing evidence asset: ${asset}`);
}

function requireValue(condition: boolean, message: string) {
  if (!condition) errors.push(message);
}

function countWords(value: unknown): number {
  if (typeof value === "string") return value.match(/[A-Za-z0-9%]+(?:[-'][A-Za-z0-9%]+)*/g)?.length ?? 0;
  if (Array.isArray(value)) return value.reduce((total, item) => total + countWords(item), 0);
  if (value && typeof value === "object") {
    return Object.values(value).reduce<number>((total, item) => total + countWords(item), 0);
  }
  return 0;
}

function verifyCategoryPair(left: CategoryPageContent, right: CategoryPageContent) {
  const leftTokens = meaningfulTokens(left);
  const rightTokens = meaningfulTokens(right);
  const intersection = new Set([...leftTokens].filter((token) => rightTokens.has(token)));
  const union = new Set([...leftTokens, ...rightTokens]);
  const similarity = union.size ? intersection.size / union.size : 1;
  const sharedEvidence = left.evidence.filter((item) => right.evidence.some((candidate) => candidate.href === item.href));
  const sharedInsightTitles = left.uniqueInsights.filter((item) =>
    right.uniqueInsights.some((candidate) => candidate.title.toLowerCase() === item.title.toLowerCase()),
  );

  requireValue(
    similarity < 0.55,
    `${left.route} and ${right.route}: lexical overlap ${(similarity * 100).toFixed(1)}% exceeds 55%`,
  );
  requireValue(
    sharedEvidence.length <= 1,
    `${left.route} and ${right.route}: category pages may share at most one controlled evidence case`,
  );
  requireValue(
    sharedInsightTitles.length === 0,
    `${left.route} and ${right.route}: category insight titles must be unique`,
  );
}

function meaningfulTokens(content: CategoryPageContent) {
  const ignored = new Set([
    "about", "after", "again", "against", "also", "another", "before", "between", "both", "candidate",
    "category", "change", "changed", "check", "compare", "comparison", "detail", "different", "does", "enough",
    "evidence", "final", "from", "image", "images", "into", "match", "pairvu", "product", "reference", "remain",
    "review", "should", "that", "their", "these", "they", "this", "visible", "when", "where", "which", "while",
    "with", "without",
  ]);
  const serialized = JSON.stringify(content).toLowerCase();
  const words = serialized.match(/[a-z0-9%]+(?:-[a-z0-9%]+)*/g) ?? [];
  return new Set(words.filter((word) => word.length >= 4 && !ignored.has(word)));
}
