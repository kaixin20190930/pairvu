import fs from "node:fs";
import path from "node:path";
import { seoPages } from "../lib/seo/content-registry";

const route = "/use-cases/amazon-product-image-qa";
const file = path.join(process.cwd(), "app/use-cases/amazon-product-image-qa/page.tsx");
const source = fs.readFileSync(file, "utf8");
const page = seoPages.find((item) => item.route === route);
const errors: string[] = [];

requireValue(Boolean(page), "Amazon use-case route is missing from the SEO registry");
requireValue(page?.status === "published" && page.indexable, "Amazon use-case route must remain published and indexable");
requireValue(!page?.title.toLowerCase().includes("amazon image validator"), "Amazon Image Validator must not become the page title");

for (const heading of [
  "How Pairvu differs from an Amazon image validator",
  "Choose evidence for the exact product and image role",
  "A changed scene and a changed package face are not the same problem",
  "Route each Pairvu verdict before the Amazon review",
  "Amazon product image QA FAQ",
]) {
  requireValue(source.includes(heading), `Missing required Amazon use-case section: ${heading}`);
}

for (const href of [
  "/#checker",
  "/examples",
  "/examples/controlled-visual-qa-benchmark",
  "/examples/label-value-change-ai-product-image",
  "/examples/laundry-sheets-background-change",
  "/examples/laundry-sheets-back-view-review",
  "/checks/product-logo",
  "/checks/product-label-text",
  "/checks/product-quantity",
  "/ai-product-photography",
]) {
  requireValue(source.includes(`href="${href}"`), `Missing static Amazon use-case link: ${href}`);
}

requireValue(source.includes("Pairvu does not certify Amazon compliance"), "Missing marketplace-certification boundary");
requireValue(/not a customer case study or a statistical performance\s+claim/.test(source), "Missing controlled-comparison claim boundary");
requireValue((source.match(/<details key=/g) ?? []).length === 1 && source.includes("amazonFaq.map"), "FAQ must render from the visible Amazon FAQ data");
requireValue(source.includes("<th scope=\"row\">FAIL</th>") && source.includes("<th scope=\"row\">PASS</th>") && source.includes("<th scope=\"row\">REVIEW</th>"), "Verdict action table must cover FAIL, PASS, and REVIEW");

const visibleWords = extractVisibleWords(source);
requireValue(visibleWords >= 1_000, `Amazon use-case has ${visibleWords} visible structured words; minimum is 1000`);

if (errors.length) {
  console.error(`Amazon use-case quality failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Amazon use-case quality passed: ${visibleWords} visible structured words, complete verdict paths, boundaries, evidence, FAQ, and static links.`);

function extractVisibleWords(value: string) {
  const jsxText = [...value.matchAll(/>([^<>{]+)</g)].map((match) => match[1]);
  const faqStart = value.indexOf("const amazonFaq");
  const faqEnd = value.indexOf("] as const;", faqStart);
  const faqSource = faqStart >= 0 && faqEnd > faqStart ? value.slice(faqStart, faqEnd) : "";
  const faqText = [...faqSource.matchAll(/(?:question|answer):\s*(?:\n\s*)?"([^"]+)"/g)].map((match) => match[1]);
  return [...jsxText, ...faqText].join(" ").match(/[A-Za-z0-9%]+(?:[-'][A-Za-z0-9%]+)*/g)?.length ?? 0;
}

function requireValue(condition: boolean, message: string) {
  if (!condition) errors.push(message);
}
