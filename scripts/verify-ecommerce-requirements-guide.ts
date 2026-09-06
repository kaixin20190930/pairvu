import fs from "node:fs";
import path from "node:path";
import { seoPages } from "../lib/seo/content-registry";

const route = "/guides/ecommerce-product-image-requirements";
const source = fs.readFileSync(path.join(process.cwd(), "app/guides/ecommerce-product-image-requirements/page.tsx"), "utf8");
const page = seoPages.find((item) => item.route === route);
const errors: string[] = [];

requireValue(Boolean(page), "Ecommerce requirements guide is missing from the SEO registry");
requireValue(page?.status === "published" && page.indexable, "Ecommerce requirements guide must be published and indexable");
requireValue(page?.parentRoute === "/guides", "Ecommerce requirements guide must remain a child of the Guides hub");

for (const heading of [
  "Separate product truth from channel eligibility",
  "How the review changes by platform",
  "Use approved views as a reference set, not as interchangeable pictures",
  "Three outcomes from one laundry-sheets product",
  "A repeatable pre-publish workflow",
  "Check current rules at the source",
  "What this process cannot certify",
  "Ecommerce product image requirements FAQ",
]) requireValue(source.includes(heading), `Missing required guide section: ${heading}`);

for (const href of [
  "/#checker",
  "/guides",
  "/use-cases/ecommerce-product-image-qa",
  "/checks/product-image-observability",
  "/examples/controlled-visual-qa-benchmark",
  "/examples/laundry-sheets-scent-count-change",
  "/examples/laundry-sheets-background-change",
  "/examples/laundry-sheets-back-view-review",
]) requireValue(source.includes(`href="${href}"`) || (href === "/guides" && source.includes("href: \"/guides\"")), `Missing static guide link: ${href}`);

for (const platform of ["Amazon", "Google Merchant Center", "eBay", "Shopify", "TikTok Shop and ads"])
  requireValue(source.includes(platform), `Missing platform-specific guidance: ${platform}`);

for (const sourceHost of ["sellercentral.amazon.com", "support.google.com", "ebay.com", "help.shopify.com", "seller-us.tiktok.com"])
  requireValue(source.includes(sourceHost), `Missing official platform source: ${sourceHost}`);

requireValue(source.includes("does not certify marketplace compliance"), "Missing marketplace-certification boundary");
requireValue(source.includes("not customer case studies or statistical claims"), "Missing controlled-comparison claim boundary");
requireValue(source.includes("faq.map"), "FAQ content must be visibly rendered");

const visibleWords = extractVisibleWords(source);
requireValue(visibleWords >= 1_000, `Ecommerce requirements guide has ${visibleWords} visible structured words; minimum is 1000`);

if (errors.length) {
  console.error(`Ecommerce requirements guide quality failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Ecommerce requirements guide quality passed: ${visibleWords} visible structured words, platform matrix, boundaries, evidence, sources, FAQ, and static links.`);

function extractVisibleWords(value: string) {
  const jsxText = [...value.matchAll(/>([^<>{]+)</g)].map((match) => match[1]);
  const faqStart = value.indexOf("const faq");
  const faqEnd = value.indexOf("] as const;", faqStart);
  const faqSource = faqStart >= 0 && faqEnd > faqStart ? value.slice(faqStart, faqEnd) : "";
  const faqText = [...faqSource.matchAll(/(?:question|answer):\s*"([^"]+)"/g)].map((match) => match[1]);
  return [...jsxText, ...faqText].join(" ").match(/[A-Za-z0-9%]+(?:[-'][A-Za-z0-9%]+)*/g)?.length ?? 0;
}

function requireValue(condition: boolean, message: string) {
  if (!condition) errors.push(message);
}
