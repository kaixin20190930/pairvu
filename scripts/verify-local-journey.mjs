import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname } from "node:path";

const REPORT_PATH = "eval/real-m0/reports/local-journey-latest.json";

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Local journey verification failed.");
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sessionId = crypto.randomUUID();
  const attribution = {
    utmSource: "local_verification",
    utmMedium: "test",
    utmCampaign: "m0_public_beta",
    utmContent: "capacity_pair",
  };
  const steps = [];

  await recordEvent(args.baseUrl, {
    eventName: "landing_view",
    anonymousSessionId: sessionId,
    pagePath: "/?utm_source=local_verification&utm_medium=test&utm_campaign=m0_public_beta",
    attribution,
  });
  steps.push("landing_view");

  await recordEvent(args.baseUrl, {
    eventName: "checker_started",
    anonymousSessionId: sessionId,
    pagePath: "/",
    attribution,
  });
  steps.push("checker_started");

  const referenceAssetId = await uploadAsset(
    args.baseUrl,
    args.reference,
    "reference",
    sessionId,
    attribution,
  );
  steps.push("reference_upload_completed");

  const candidateAssetId = await uploadAsset(
    args.baseUrl,
    args.candidate,
    "candidate",
    sessionId,
    attribution,
  );
  steps.push("candidate_upload_completed");

  const analysisId = crypto.randomUUID();
  const idempotencyKey = crypto.randomUUID();
  const analysisResponse = await fetch(`${args.baseUrl}/api/analyses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      referenceAssetId,
      candidateAssetId,
      anonymousSessionId: sessionId,
      analysisId,
      idempotencyKey,
    }),
  });
  const analysisPayload = await analysisResponse.json();
  if (!analysisResponse.ok || !analysisPayload.analysis) {
    throw new Error(
      `Analysis failed with ${analysisResponse.status}: ${analysisPayload.message ?? analysisPayload.error ?? "unknown"}`,
    );
  }
  const analysis = analysisPayload.analysis;
  steps.push("analysis_completed");

  await recordEvent(args.baseUrl, {
    eventName: "result_viewed",
    anonymousSessionId: sessionId,
    analysisId: analysis.id,
    pagePath: "/",
    attribution,
    properties: {
      verdict: analysis.verdict,
    },
  });
  steps.push("result_viewed");

  const feedbackResponse = await fetch(`${args.baseUrl}/api/analyses/${analysis.id}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      feedbackKind: "correct",
      anonymousSessionId: sessionId,
    }),
  });
  if (!feedbackResponse.ok) {
    throw new Error(`Feedback failed with ${feedbackResponse.status}.`);
  }
  steps.push("feedback_saved");

  await recordEvent(args.baseUrl, {
    eventName: "feedback_submitted",
    anonymousSessionId: sessionId,
    analysisId: analysis.id,
    pagePath: "/",
    attribution,
    properties: {
      feedbackKind: "correct",
    },
  });
  steps.push("feedback_submitted");

  await recordEvent(args.baseUrl, {
    eventName: "second_check_started",
    anonymousSessionId: sessionId,
    analysisId: analysis.id,
    pagePath: "/",
    attribution,
  });
  steps.push("second_check_started");

  const report = {
    generatedAt: new Date().toISOString(),
    sessionId,
    analysisId: analysis.id,
    referenceFileName: basename(args.reference),
    candidateFileName: basename(args.candidate),
    verdict: analysis.verdict,
    promptVersion: analysis.modelCalls?.[0]?.promptVersion ?? null,
    productIssueTypes: analysis.productIssues?.map((issue) => issue.type) ?? [],
    observationStatuses:
      analysis.observations?.map((observation) => ({
        checkType: observation.checkType,
        status: observation.status,
        differenceKind: observation.differenceKind ?? null,
      })) ?? [],
    steps,
  };

  await mkdir("eval/real-m0/reports", { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`Session: ${sessionId}`);
  console.log(`Analysis: ${analysis.id}`);
  console.log(`Verdict: ${String(analysis.verdict).toUpperCase()}`);
  console.log(`Prompt: ${report.promptVersion ?? "unknown"}`);
  console.log(`Journey steps: ${steps.length}`);
  console.log(`Report: ${REPORT_PATH}`);
}

async function uploadAsset(baseUrl, path, kind, sessionId, attribution) {
  const bytes = await readFile(path);
  const mimeType = mimeTypeFor(path);
  const eventPrefix = kind === "reference" ? "reference" : "candidate";

  await recordEvent(baseUrl, {
    eventName: `${eventPrefix}_upload_started`,
    anonymousSessionId: sessionId,
    pagePath: "/",
    attribution,
    properties: {
      mimeType,
      sizeBucket: sizeBucket(bytes.length),
    },
  });

  const formData = new FormData();
  formData.append("file", new Blob([bytes], { type: mimeType }), basename(path));
  formData.append("kind", kind);
  formData.append("anonymousSessionId", sessionId);

  const response = await fetch(`${baseUrl}/api/assets/upload`, {
    method: "POST",
    body: formData,
  });
  const payload = await response.json();
  if (!response.ok || !payload.asset?.id) {
    throw new Error(
      `${kind} upload failed with ${response.status}: ${payload.message ?? payload.error ?? "unknown"}`,
    );
  }

  await recordEvent(baseUrl, {
    eventName: `${eventPrefix}_upload_completed`,
    anonymousSessionId: sessionId,
    pagePath: "/",
    attribution,
    properties: {
      mimeType,
      sizeBucket: sizeBucket(bytes.length),
    },
  });

  return payload.asset.id;
}

async function recordEvent(baseUrl, input) {
  const response = await fetch(`${baseUrl}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idempotencyKey: crypto.randomUUID(),
      occurredAt: new Date().toISOString(),
      locale: "en-US",
      deviceClass: "desktop",
      ...input,
    }),
  });

  if (!response.ok) {
    const payload = await response.json();
    throw new Error(
      `Event ${input.eventName} failed with ${response.status}: ${payload.message ?? payload.error ?? "unknown"}`,
    );
  }
}

function parseArgs(argv) {
  const values = new Map();

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
  if (!reference || !candidate) {
    throw new Error("Usage: --reference <path> --candidate <path> [--base-url http://127.0.0.1:3002]");
  }

  return {
    reference,
    candidate,
    baseUrl: values.get("base-url") ?? "http://127.0.0.1:3002",
  };
}

function mimeTypeFor(path) {
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

function sizeBucket(bytes) {
  if (bytes < 1_000_000) return "under_1mb";
  if (bytes < 5_000_000) return "1mb_to_5mb";
  return "5mb_to_10mb";
}
