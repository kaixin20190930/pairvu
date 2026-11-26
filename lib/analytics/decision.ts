import { z } from "zod";
import { comparisons, models, cursorBench, browseComp, sweBenchVerified } from "@/lib/models/catalog";

export const decisionPurpose = "model_decision_v1";
export const decisionPaths = new Set([
  "/", "/models", "/compare", "/leaderboard", "/llm-pricing", "/benchmarks",
  "/best/chinese-models", "/best/open-source-models",
  "/benchmarks/cursorbench", "/benchmarks/browsecomp",
  "/compare/chatgpt-vs-claude-vs-gemini",
  ...models.filter(m => m.slug !== "qwen-4-max-preview").map(m => `/models/${m.slug}`),
  ...comparisons.filter(c => c.slug !== "qwen-4-max-preview-vs-gpt-5-2").map(c => `/compare/${c.slug}`),
]);
export const decisionFlags = [
  "model_click", "comparison_click", "task_coding", "task_context", "task_batch",
  "source_specification", "source_pricing", "source_evaluation", "source_availability",
] as const;
const flags = Object.fromEntries(decisionFlags.map(name => [name, z.boolean()])) as Record<typeof decisionFlags[number], z.ZodBoolean>;
export const decisionEventSchema = z.object({
  eventName: z.literal("landing_view"),
  idempotencyKey: z.string().uuid(),
  anonymousSessionId: z.string().uuid(),
  pagePath: z.string().refine(path => decisionPaths.has(path)),
  properties: z.object({ purpose: z.literal(decisionPurpose), ...flags }).strict(),
}).strict();

export function decisionSourceRoles() {
  const roles: Record<string, string> = {};
  for (const model of models) {
    for (const source of model.sources) roles[source.url] = /benchmark|CursorBench|SWE-bench/i.test(source.label) ? "evaluation" : /availability|announcement|launch/i.test(source.label) ? "availability" : "specification";
    for (const price of model.pricing) roles[price.source.url] = "pricing";
  }
  roles["https://platform.claude.com/docs/en/build-with-claude/batch-processing"] = "pricing";
  roles["https://developers.openai.com/api/docs/guides/batch"] = "pricing";
  for (const benchmark of [cursorBench, browseComp, sweBenchVerified]) roles[benchmark.source.url] = "evaluation";
  return Object.fromEntries(Object.entries(roles).map(([url, role]) => {
    const source = new URL(url);
    return [source.origin + source.pathname.replace(/\/$/, ""), role];
  }));
}
