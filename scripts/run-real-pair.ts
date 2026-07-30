import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { OpenAIVisionProvider } from "@/lib/ai/providers/openai-vision-provider";
import { DEFAULT_OPENAI_MODEL, DEFAULT_OPENAI_PROMPT_VERSION } from "@/lib/config/openai";
import { M0QAEngine } from "@/lib/qa/engine";
import { M0RiskPolicy } from "@/lib/qa/m0-policy";
import type { M0AnalysisInput } from "@/lib/qa/types";

const REPORT_PATH = "eval/real-m0/reports/real-pair-latest.json";

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Real pair analysis failed.");
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const reference = await loadImage(args.reference);
  const candidate = await loadImage(args.candidate);
  const analysisId = crypto.randomUUID();
  const input: M0AnalysisInput = {
    analysisId,
    reference: {
      assetId: `${analysisId}_reference`,
      mimeType: reference.mimeType,
      r2Key: `local-pair/${analysisId}/reference`,
      dataUrl: reference.dataUrl,
    },
    candidate: {
      assetId: `${analysisId}_candidate`,
      mimeType: candidate.mimeType,
      r2Key: `local-pair/${analysisId}/candidate`,
      dataUrl: candidate.dataUrl,
    },
    selectedChecks: [
      "logo",
      "visible_text",
      "quantity",
      "dominant_color",
      "major_components",
      "major_shape_packaging",
    ],
    category: args.category,
  };

  const startedAt = Date.now();
  const engine = new M0QAEngine(
    new OpenAIVisionProvider({
      apiKey,
      model: process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL,
      promptVersion: process.env.OPENAI_PROMPT_VERSION ?? DEFAULT_OPENAI_PROMPT_VERSION,
    }),
    new M0RiskPolicy(),
  );
  const result = await engine.analyze(input);
  const totalLatencyMs = Date.now() - startedAt;
  const report = {
    generatedAt: new Date().toISOString(),
    label: args.label,
    expectedBehavior: args.expected,
    matchedExpectedBehavior: args.expected ? result.verdict === args.expected.toLowerCase() : null,
    reference: {
      fileName: basename(args.reference),
      mimeType: reference.mimeType,
      sha256: reference.sha256,
    },
    candidate: {
      fileName: basename(args.candidate),
      mimeType: candidate.mimeType,
      sha256: candidate.sha256,
    },
    category: args.category ?? null,
    finalVerdict: result.verdict,
    observations: result.observations,
    issues: result.productIssues,
    limitations: result.limitations,
    coverage: result.coverage,
    versions: result.versions,
    modelCall: result.modelCalls[0] ?? null,
    totalLatencyMs,
    estimatedCostUsd: result.estimatedCostUsd ?? null,
  };

  await mkdir("eval/real-m0/reports", { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`Verdict: ${result.verdict.toUpperCase()}`);
  console.log(`Prompt: ${result.modelCalls[0]?.promptVersion ?? "unknown"}`);
  console.log(`OpenAI latency: ${result.modelCalls[0]?.latencyMs ?? 0} ms`);
  console.log(`Total latency: ${totalLatencyMs} ms`);
  for (const observation of result.observations) {
    console.log(
      `${observation.checkType}: ${observation.status} / ${observation.differenceKind ?? "none"} / ${observation.confidence}`,
    );
  }
  console.log(`Report: ${REPORT_PATH}`);

  if (args.expected && result.verdict !== args.expected.toLowerCase()) {
    process.exitCode = 2;
  }
}

function parseArgs(argv: string[]) {
  const values = new Map<string, string>();

  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];

    if (key?.startsWith("--") && value && !value.startsWith("--")) {
      values.set(key.slice(2), value);
      index += 1;
    }
  }

  const reference = values.get("reference");
  const candidate = values.get("candidate");
  const expected = values.get("expected")?.toUpperCase();

  if (!reference || !candidate) {
    throw new Error("Usage: --reference <path> --candidate <path> [--expected PASS|REVIEW|FAIL] [--label name]");
  }

  if (expected && !["PASS", "REVIEW", "FAIL"].includes(expected)) {
    throw new Error("--expected must be PASS, REVIEW, or FAIL.");
  }

  return {
    reference,
    candidate,
    expected: expected as "PASS" | "REVIEW" | "FAIL" | undefined,
    label: values.get("label") ?? "local-real-pair",
    category: values.get("category"),
  };
}

async function loadImage(path: string) {
  const bytes = await readFile(path);
  const mimeType = mimeTypeFor(path);

  return {
    mimeType,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    dataUrl: `data:${mimeType};base64,${bytes.toString("base64")}`,
  };
}

function mimeTypeFor(path: string) {
  switch (extname(path).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    default:
      throw new Error(`Unsupported image extension: ${extname(path) || "(none)"}`);
  }
}
