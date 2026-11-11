import assert from "node:assert/strict";
import sitemap from "../app/sitemap";
import { comparisons, modelMap, models, publishedModelSlugs } from "../lib/models/catalog";
import { NextRequest } from "next/server";
import { middleware } from "../middleware";

const urls = sitemap().map((entry) => new URL(entry.url).pathname);
assert.equal(urls.length, 16, "expected the 15 first-week content URLs plus privacy");
assert.equal(new Set(urls).size, urls.length, "sitemap routes must be unique");
for (const route of ["/", "/compare", "/leaderboard", "/llm-pricing", "/privacy", "/benchmarks/cursorbench", "/benchmarks/browsecomp"]) assert(urls.includes(route), `missing ${route}`);
for (const retired of ["/examples", "/checks", "/categories", "/use-cases", "/guides", "/how-pairvu-works", "/pricing", "/ai-product-photography"]) assert(!urls.some((route) => route === retired || route.startsWith(`${retired}/`)), `retired route leaked: ${retired}`);
for (const slug of publishedModelSlugs) assert(urls.includes(`/models/${slug}`));
for (const comparison of comparisons) {
  assert(modelMap.has(comparison.a) && modelMap.has(comparison.b));
  assert(urls.includes(`/compare/${comparison.slug}`));
}
for (const model of models) {
  assert(model.sources.length > 0, `${model.slug} needs a source`);
  for (const source of model.sources) {
    assert(source.url.startsWith("https://"));
    assert.equal(source.accessed, "2026-11-11");
  }
  for (const [field, sourceIndex] of Object.entries(model.fieldSources)) {
    if (sourceIndex !== null) assert(model.sources[sourceIndex], `${model.slug}.${field} source index is invalid`);
  }
  assert.notEqual(model.fieldSources.releaseDate, null);
  assert.notEqual(model.fieldSources.contextTokens, null);
  if (model.parameters) assert.notEqual(model.fieldSources.parameters, null);
  if (model.inputUsd !== undefined) assert.notEqual(model.fieldSources.inputUsd, null);
  if (model.outputUsd !== undefined) assert.notEqual(model.fieldSources.outputUsd, null);
}
assert(!modelMap.has("qwen-3-8-27b"));
assert(modelMap.has("fable-5-2"));

const responseFor = (path: string) => middleware(new NextRequest(`https://pairvu.test${path}`));
for (const path of ["/api/health", "/api/runtime-config", "/account", "/sign-in"]) {
  const response = responseFor(path);
  assert.equal(response.status, 200, `${path} must pass through middleware`);
  assert.equal(response.headers.get("x-middleware-next"), "1", `${path} must not be rewritten`);
}
for (const path of ["/guides", "/guides/", "/pricing", "/pricing/", "/examples/retired", "/checks/retired"]) {
  assert.equal(responseFor(path).status, 410, `${path} must return 410`);
}
assert.equal(responseFor("/examples").status, 301);
assert.equal(responseFor("/examples/").status, 301);
assert.equal(responseFor("/checks").headers.get("location"), "https://pairvu.test/leaderboard");
console.log(`PIVOT-01 inventory passed: ${urls.length} sitemap URLs, ${models.length} sourced model records, ${comparisons.length} comparisons.`);
