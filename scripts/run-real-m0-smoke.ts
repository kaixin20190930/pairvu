import { mkdir, readFile, writeFile } from "node:fs/promises";
import { M0QAEngine } from "@/lib/qa/engine";
import { OpenAIVisionProvider } from "@/lib/ai/providers/openai-vision-provider";
import { M0RiskPolicy } from "@/lib/qa/m0-policy";
import type { M0AnalysisInput, VisionObservation } from "@/lib/qa/types";

type SmokeCase = {
  id: string;
  label: string;
  expectedBehavior: "PASS" | "REVIEW" | "FAIL";
  referenceFileName: string;
  candidateFileName: string;
  referenceTransforms?: TransformSpec[];
  candidateTransforms?: TransformSpec[];
  notes?: string;
};

type TransformSpec =
  | { type: "crop"; x: number; y: number; w: number; h: number }
  | { type: "resize"; w: number; h?: number }
  | { type: "rotate"; degrees: number }
  | { type: "brightness"; value: number }
  | { type: "contrast"; value: number }
  | { type: "mask"; x: number; y: number; w: number; h: number; color: string }
  | { type: "shadow-band"; x: number; y: number; w: number; h: number; opacity: number }
  | { type: "reflection-strip"; x: number; y: number; w: number; h: number; opacity: number }
  | { type: "composite-duplicate"; scale: number; x: number; y: number; opacity: number };

interface JimpImage {
  bitmap: { width: number; height: number };
  clone(): JimpImage;
  crop(options: { x: number; y: number; w: number; h: number }): JimpImage;
  resize(options: { w: number; h?: number }): JimpImage;
  rotate(degrees: number): JimpImage;
  brightness(value: number): JimpImage;
  contrast(value: number): JimpImage;
  composite(
    src: JimpImage,
    x?: number,
    y?: number,
    options?: {
      opacitySource?: number;
      opacityDest?: number;
    },
  ): JimpImage;
  scan(x: number, y: number, w: number, h: number, fn: (x: number, y: number, idx: number) => void): JimpImage;
  getBuffer(mime: string): Promise<Buffer>;
}

interface JimpApiCtor {
  read(input: string): Promise<JimpImage>;
  new (options: { width: number; height: number; color: number }): JimpImage;
}

type CaseResult = {
  id: string;
  label: string;
  expectedBehavior: SmokeCase["expectedBehavior"];
  finalVerdict: "pass" | "review" | "fail" | "error";
  observations: Array<{
    checkType: string;
    status: string;
    differenceKind?: string;
    confidence: string;
    explanation: string;
    evidence: VisionObservation["evidence"];
  }>;
  issues: Array<{
    type: string;
    severity: string;
    confidence: string;
    message: string;
  }>;
  limitations: Array<{
    type: string;
    confidence: string;
    message: string;
  }>;
  provider?: string;
  model?: string;
  promptVersion?: string;
  openaiLatencyMs?: number;
  totalAnalysisLatencyMs?: number;
  estimatedCostUsd?: number | null;
  error?: string;
};

const CASES_PATH = "eval/real-m0/cases.json";
const REPORT_DIR = "eval/real-m0/reports";
const REPORT_PATH = `${REPORT_DIR}/real-latest.json`;

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const config = {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    promptVersion: process.env.OPENAI_PROMPT_VERSION ?? "m0-real-mvp-001",
  };

  if (!config.apiKey) {
    throw new Error("OPENAI_API_KEY is not configured. Real smoke testing requires a live OpenAI key.");
  }

  const { Jimp, rgbaToInt } = await import("jimp");
  const rgbaToIntFn = rgbaToInt as unknown as (red: number, green: number, blue: number, alpha?: number) => number;
  const JimpRuntime = Jimp as unknown as JimpApiCtor;
  const smokeCases = JSON.parse(await readFile(CASES_PATH, "utf8")) as SmokeCase[];
  const results: CaseResult[] = [];

  for (const smokeCase of smokeCases) {
    const startedAt = Date.now();
    try {
      const referenceImage = await loadAndTransformImage(JimpRuntime, rgbaToIntFn, smokeCase.referenceFileName, smokeCase.referenceTransforms);
      const candidateImage = await loadAndTransformImage(JimpRuntime, rgbaToIntFn, smokeCase.candidateFileName, smokeCase.candidateTransforms);

      const analysisInput: M0AnalysisInput = {
        analysisId: crypto.randomUUID(),
        reference: {
          assetId: `${smokeCase.id}_reference`,
          mimeType: "image/png",
          r2Key: `real-smoke/${smokeCase.id}/reference.png`,
          dataUrl: await toDataUrl(referenceImage),
        },
        candidate: {
          assetId: `${smokeCase.id}_candidate`,
          mimeType: "image/png",
          r2Key: `real-smoke/${smokeCase.id}/candidate.png`,
          dataUrl: await toDataUrl(candidateImage),
        },
        selectedChecks: ["logo", "visible_text", "quantity", "dominant_color", "major_components", "major_shape_packaging"],
      };

      const engine = new M0QAEngine(
        new OpenAIVisionProvider({
          apiKey: config.apiKey,
          model: config.model,
          promptVersion: config.promptVersion,
        }),
        new M0RiskPolicy(),
      );

      const result = await engine.analyze(analysisInput);
      results.push({
        id: smokeCase.id,
        label: smokeCase.label,
        expectedBehavior: smokeCase.expectedBehavior,
        finalVerdict: result.verdict,
        observations: result.observations.map((observation) => ({
          checkType: observation.checkType,
          status: observation.status,
          differenceKind: observation.differenceKind,
          confidence: observation.confidence,
          explanation: observation.explanation,
          evidence: observation.evidence,
        })),
        issues: result.productIssues.map((issue) => ({
          type: issue.type,
          severity: issue.severity,
          confidence: issue.confidence,
          message: issue.message,
        })),
        limitations: result.limitations.map((limitation) => ({
          type: limitation.type,
          confidence: limitation.confidence,
          message: limitation.message,
        })),
        provider: result.modelCalls[0]?.provider,
        model: result.modelCalls[0]?.model,
        promptVersion: result.modelCalls[0]?.promptVersion,
        openaiLatencyMs: result.modelCalls[0]?.latencyMs,
        totalAnalysisLatencyMs: Date.now() - startedAt,
        estimatedCostUsd: result.estimatedCostUsd ?? null,
      });
    } catch (error) {
      results.push({
        id: smokeCase.id,
        label: smokeCase.label,
        expectedBehavior: smokeCase.expectedBehavior,
        finalVerdict: "error",
        observations: [],
        issues: [],
        limitations: [],
        totalAnalysisLatencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "Smoke test failed.",
      });
    }
  }

  await mkdir(REPORT_DIR, { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify({ generatedAt: new Date().toISOString(), cases: results }, null, 2)}\n`);
  console.log(`Wrote real smoke test report to ${REPORT_PATH}`);
}

async function loadAndTransformImage(
  Jimp: JimpApiCtor,
  rgbaToInt: (red: number, green: number, blue: number, alpha?: number) => number,
  fileName: string,
  transforms: TransformSpec[] = [],
) {
  const image = await Jimp.read(commonsFileUrl(fileName));

  for (const transform of transforms) {
    applyTransform(image, transform, Jimp, rgbaToInt);
  }

  return image;
}

function applyTransform(
  image: JimpImage,
  transform: TransformSpec,
  Jimp: JimpApiCtor,
  rgbaToInt: (red: number, green: number, blue: number, alpha?: number) => number,
) {
  switch (transform.type) {
    case "crop":
      image.crop({ x: transform.x, y: transform.y, w: transform.w, h: transform.h });
      return;
    case "resize":
      image.resize({ w: transform.w, h: transform.h });
      return;
    case "rotate":
      image.rotate(transform.degrees);
      return;
    case "brightness":
      image.brightness(transform.value);
      return;
    case "contrast":
      image.contrast(transform.value);
      return;
    case "mask":
      paintRectangle(image, Jimp, transform.x, transform.y, transform.w, transform.h, transform.color, 1, rgbaToInt);
      return;
    case "shadow-band":
      paintRectangle(image, Jimp, transform.x, transform.y, transform.w, transform.h, "#000000", transform.opacity, rgbaToInt);
      return;
    case "reflection-strip":
      paintRectangle(image, Jimp, transform.x, transform.y, transform.w, transform.h, "#ffffff", transform.opacity, rgbaToInt);
      return;
    case "composite-duplicate": {
      const clone = image.clone();
      clone.resize({ w: Math.round(image.bitmap.width * transform.scale) });
      image.composite(clone, transform.x, transform.y, {
        opacitySource: transform.opacity,
      });
      return;
    }
    default:
      return;
  }
}

function paintRectangle(
  image: JimpImage,
  Jimp: JimpApiCtor,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  opacity: number,
  rgbaToInt: (red: number, green: number, blue: number, alpha?: number) => number,
) {
  const { r, g, b } = parseHexColor(color);
  const rgba = rgbaToInt(r, g, b, Math.round(255 * opacity));
  const overlay = new Jimp({
    width: w,
    height: h,
    color: rgba,
  });
  image.composite(overlay, x, y, { opacitySource: 1, opacityDest: 1 });
}

async function toDataUrl(image: JimpImage) {
  const buffer = await image.getBuffer("image/png");
  return `data:image/png;base64,${Buffer.from(buffer).toString("base64")}`;
}

function commonsFileUrl(fileName: string) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
}

function parseHexColor(color: string) {
  const normalized = color.replace("#", "");
  const hex = normalized.length === 3 ? normalized.split("").map((part) => part + part).join("") : normalized;
  const value = Number.parseInt(hex, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}
