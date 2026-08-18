import { seoPages } from "../lib/seo/content-registry";

const pages = seoPages.filter((page) => page.status === "published");
const threshold = 0.62;
const stopWords = new Set([
  "a", "against", "ai", "an", "and", "approved", "before", "change", "changed", "changes", "check",
  "checker", "compare", "comparison", "controlled", "edited", "fidelity", "for", "from", "how", "image",
  "images", "in", "of", "on", "or", "packaging", "pairvu", "product", "products", "publishing", "see", "the",
  "to", "visible", "where", "with",
]);

type Candidate = {
  left: string;
  right: string;
  score: number;
  shared: string[];
};

const candidates: Candidate[] = [];

for (let leftIndex = 0; leftIndex < pages.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < pages.length; rightIndex += 1) {
    const left = pages[leftIndex];
    const right = pages[rightIndex];
    const leftTokens = tokens([left.primaryKeyword, ...left.ownedSecondaryKeywords, left.intent].join(" "));
    const rightTokens = tokens([right.primaryKeyword, ...right.ownedSecondaryKeywords, right.intent].join(" "));
    const shared = [...leftTokens].filter((token) => rightTokens.has(token));
    const union = new Set([...leftTokens, ...rightTokens]);
    const score = union.size ? shared.length / union.size : 0;

    if (score >= threshold) {
      candidates.push({ left: left.route, right: right.route, score, shared: shared.sort() });
    }
  }
}

candidates.sort((a, b) => b.score - a.score);

if (!candidates.length) {
  console.log(`SEO semantic-overlap report: no published route pairs at or above ${threshold}.`);
  process.exit(0);
}

console.log(`SEO semantic-overlap report: ${candidates.length} candidate pair(s) at or above ${threshold}.`);
for (const candidate of candidates) {
  console.log(
    `- ${candidate.score.toFixed(2)} ${candidate.left} <> ${candidate.right} [${candidate.shared.join(", ")}]`,
  );
}
console.log("Review these pairs manually. This command reports risk; it does not prove cannibalization.");

function tokens(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter((token) => token.length > 2 && !stopWords.has(token)),
  );
}
