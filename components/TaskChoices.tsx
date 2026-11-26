import Link from "next/link";
import { modelMap } from "@/lib/models/catalog";

const groups = [
  {
    id: "coding", title: "Coding and agent workflows",
    reason: "Compare interface and tool requirements first. Carbon has a historical named-setup coding result; these candidates have no matched quality ranking here.",
    models: [
      ["gpt-6-2-astra", "Text/image OpenAI integration and up to 128K output. Check long-input billing."],
      ["gemini-4-carbon", "Google positions Carbon for difficult multi-step coding and debugging; deeper exploration can consume more tokens."],
      ["claude-opus-5-5", "Evaluate for long-running coding. Its historical CursorBench score applies only to the named configuration."],
    ],
  },
  {
    id: "context", title: "Long documents",
    reason: "Window capacity alone does not measure recall. Check accepted input modalities, output budget and total request cost.",
    models: [
      ["gpt-6-2-sol", "1.05M context with lower base token prices than Astra; test extraction quality."],
      ["gpt-6-2-astra", "1.05M context; input above 272K changes rates for the whole request."],
      ["gemini-4-argon", "1,048,576 tokens shared across input, thinking and output; accepts native audio, video and PDF."],
    ],
  },
  {
    id: "batch", title: "Asynchronous batch processing",
    reason: "For work that can wait, Claude API Message Batches at POST /v1/messages/batches discounts standard input/output rates by 50%. Batches expire after 24 hours, so inspect per-request results and handle expiration. These are API token prices, not self-hosting or consumer subscription costs.",
    models: [
      ["claude-haiku-5-5", "Batch USD $0.05 input / $0.25 output per million for prompts up to 100K tokens; $0.25 / $1.25 above 100K. Evaluate repetitive extraction and classification first."],
      ["claude-opus-5-5", "Batch USD $2 input / $10 output per million. Consider when fewer failures justify the higher token rate; no cost-per-completed-task claim is established."],
      ["claude-sonnet-5-5", "Batch USD $1 input / $5 output per million. Evaluate as a middle-cost candidate against Haiku and Opus on the same cases."],
    ],
  },
];
export function TaskChoices() {
  return <section>
    <h2>Start with your task</h2>
    {groups.map(group => <section key={group.id} data-decision-task={group.id}>
      <h3>{group.title}</h3><p>{group.reason}</p>
      <ul>{group.models.map(([slug, reason]) => <li key={slug}><Link href={`/models/${slug}`}>{modelMap.get(slug)!.name}</Link> — {reason} <Link href={`/models/${slug}#sources`}>Dated specifications and sources</Link></li>)}</ul>
      {group.id === "batch" && <p><a href="https://platform.claude.com/docs/en/build-with-claude/batch-processing">Official supported-model prices, asynchronous API and 24-hour expiry</a> · accessed November 26, 2026. Tool charges, cache conditions and other channels can change the bill.</p>}
    </section>)}
    <p>Recommendations are editorial starting points. Use each profile’s dated sources and evaluate representative cases before committing.</p>
  </section>;
}
