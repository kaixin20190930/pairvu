import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { FidelityResult, M0AnalysisInput, VisionProvider } from "@/lib/qa/types";

const ObservationEvidenceSchema = z
  .object({
    referenceObservation: z.string().nullable(),
    candidateObservation: z.string().nullable(),
    differenceKind: z
      .enum([
        "none",
        "brand_changed",
        "text_changed",
        "value_changed",
        "count_changed",
        "color_changed",
        "component_missing",
        "component_extra",
        "shape_changed",
        "unreadable",
        "not_visible",
        "uncertain",
        "unknown",
      ])
      .nullable(),
    comparisonSummary: z.string().nullable(),
    visibleEvidence: z.array(z.string()).nullable(),
    uncertainReason: z.string().nullable(),
    referenceVisible: z.boolean().nullable(),
    candidateVisible: z.boolean().nullable(),
    rawJson: z.string().nullable(),
  })
  .strict();

const ObservationSchema = z.object({
  checkType: z.enum([
    "logo",
    "visible_text",
    "quantity",
    "dominant_color",
    "major_components",
    "major_shape_packaging",
  ]),
  status: z.enum(["match", "mismatch", "uncertain", "not_observable", "not_applicable"]),
  differenceKind: z
    .enum([
      "none",
      "brand_changed",
      "text_changed",
      "value_changed",
      "count_changed",
      "color_changed",
      "component_missing",
      "component_extra",
      "shape_changed",
      "unreadable",
      "not_visible",
      "uncertain",
      "unknown",
    ])
    .nullable(),
  referenceObservability: z.enum(["observable", "partially_observable", "not_observable"]),
  candidateObservability: z.enum(["observable", "partially_observable", "not_observable"]),
  coverage: z.enum(["sufficient", "partial", "insufficient"]),
  confidence: z.enum(["high", "medium", "low"]),
  referenceObservation: z.string().nullable(),
  candidateObservation: z.string().nullable(),
  comparisonSummary: z.string().nullable(),
  visibleEvidence: z.array(z.string()).nullable(),
  uncertainReason: z.string().nullable(),
  evidence: ObservationEvidenceSchema,
}).strict();

const LimitationEvidenceSchema = z
  .object({
    rawJson: z.string().nullable(),
  })
  .strict();

const LimitationSchema = z.object({
  type: z.enum([
    "reference_insufficient",
    "candidate_insufficient",
    "reference_conflict",
    "attribute_not_observable",
    "coverage_insufficient",
    "uncertain_observation",
    "provider_output_invalid",
    "missing_requested_check",
    "unknown",
  ]),
  confidence: z.enum(["high", "medium", "low"]),
  message: z.string(),
  evidence: LimitationEvidenceSchema,
}).strict();

const FidelityResponseSchema = z
  .object({
    observations: z.array(ObservationSchema),
    limitations: z.array(LimitationSchema),
  })
  .strict();

type FidelityResponse = z.infer<typeof FidelityResponseSchema>;

export interface OpenAIVisionProviderOptions {
  apiKey?: string;
  model: string;
  promptVersion: string;
}

export class OpenAIVisionProvider implements VisionProvider {
  readonly name = "openai";
  private readonly client: OpenAI;

  constructor(private readonly options: OpenAIVisionProviderOptions) {
    this.client = new OpenAI({
      apiKey: options.apiKey ?? process.env.OPENAI_API_KEY,
    });
  }

  async analyzeProductFidelity(input: M0AnalysisInput): Promise<FidelityResult> {
    if (!input.reference.dataUrl || !input.candidate.dataUrl) {
      return {
        observations: [],
        limitations: [
          {
            kind: "limitation",
            type: input.reference.dataUrl ? "candidate_insufficient" : "reference_insufficient",
            sourceCheckType: undefined,
            confidence: "high",
            message: "OpenAIVisionProvider requires data URLs for both reference and candidate assets.",
            evidence: {
              raw: {
                referenceHasDataUrl: Boolean(input.reference.dataUrl),
                candidateHasDataUrl: Boolean(input.candidate.dataUrl),
              },
            },
          },
        ],
        modelCall: {
          provider: this.name,
          model: this.options.model,
          promptVersion: this.options.promptVersion,
          latencyMs: 0,
        },
      };
    }

    const startedAt = Date.now();
    const response = await this.client.responses.parse({
      model: this.options.model,
      instructions: buildInstructions(input),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Compare the explicitly labeled REFERENCE and CANDIDATE images for M0 product fidelity. Inspect each image independently before comparing them. Return observations only; do not decide PASS, REVIEW, or FAIL.",
            },
            {
              type: "input_text",
              text: "REFERENCE IMAGE: approved original product. Record only components directly visible in this image.",
            },
            {
              type: "input_image",
              image_url: input.reference.dataUrl,
              detail: "high",
            },
            {
              type: "input_text",
              text: "CANDIDATE IMAGE: product image being checked. Re-inspect its components independently; do not copy or infer components from the reference.",
            },
            {
              type: "input_image",
              image_url: input.candidate.dataUrl,
              detail: "high",
            },
          ],
        },
      ],
      text: {
        format: zodTextFormat(FidelityResponseSchema, "m0_fidelity_observations"),
      },
    });

    const parsed = response.output_parsed as FidelityResponse | null;

    if (!parsed) {
      throw new Error("OpenAI response did not include parsed fidelity observations.");
    }

    const inputTokens = response.usage?.input_tokens;
    const cachedInputTokens = response.usage?.input_tokens_details?.cached_tokens;
    const outputTokens = response.usage?.output_tokens;

    return {
      observations: parsed.observations.map((observation) => ({
        checkType: observation.checkType,
        status: observation.status,
        differenceKind: observation.differenceKind ?? undefined,
        observability: {
          reference: observation.referenceObservability,
          candidate: observation.candidateObservability,
          coverage: observation.coverage,
        },
        confidence: observation.confidence,
        explanation:
          observation.comparisonSummary ?? observation.referenceObservation ?? observation.candidateObservation ?? "Observation recorded.",
        evidence: {
          referenceObservation: observation.referenceObservation ?? undefined,
          candidateObservation: observation.candidateObservation ?? undefined,
          differenceKind: observation.differenceKind ?? undefined,
          comparisonSummary: observation.comparisonSummary ?? undefined,
          visibleEvidence: observation.visibleEvidence ?? undefined,
          uncertainReason: observation.uncertainReason ?? undefined,
          referenceVisible: observation.evidence.referenceVisible ?? undefined,
          candidateVisible: observation.evidence.candidateVisible ?? undefined,
          raw: observation.evidence.rawJson ?? undefined,
        },
      })),
      limitations: parsed.limitations.map((limitation) => ({
        kind: "limitation",
        type: limitation.type,
        confidence: limitation.confidence,
        message: limitation.message,
        evidence: {
          raw: limitation.evidence.rawJson ?? undefined,
        },
      })),
      modelCall: {
        provider: this.name,
        model: this.options.model,
        promptVersion: this.options.promptVersion,
        latencyMs: Date.now() - startedAt,
        estimatedCostUsd: estimateOpenAICostUsd(this.options.model, {
          inputTokens,
          cachedInputTokens,
          outputTokens,
        }),
        inputUsage: response.usage
          ? {
              inputTokens,
              cachedInputTokens: cachedInputTokens ?? 0,
            }
          : undefined,
        outputUsage: response.usage ? { outputTokens } : undefined,
      },
    };
  }
}

export function estimateOpenAICostUsd(
  model: string,
  usage: {
    inputTokens?: number;
    cachedInputTokens?: number;
    outputTokens?: number;
  },
): number | undefined {
  if (
    !isGpt41MiniModel(model) ||
    usage.inputTokens === undefined ||
    usage.outputTokens === undefined
  ) {
    return undefined;
  }

  const cachedInputTokens = Math.min(
    usage.inputTokens,
    Math.max(0, usage.cachedInputTokens ?? 0),
  );
  const uncachedInputTokens = usage.inputTokens - cachedInputTokens;

  // GPT-4.1 mini standard pricing verified against the OpenAI model page on 2026-07-28.
  return (
    (uncachedInputTokens * 0.4 +
      cachedInputTokens * 0.1 +
      usage.outputTokens * 1.6) /
    1_000_000
  );
}

function isGpt41MiniModel(model: string) {
  return model === "gpt-4.1-mini" || model.startsWith("gpt-4.1-mini-");
}

export function buildInstructions(input: M0AnalysisInput) {
  return [
    "You are an observation layer for a commerce product visual QA system.",
    "Do not decide the final verdict.",
    "Do not claim marketplace acceptance, legal compliance, or guaranteed correctness.",
    "Report only observable facts, comparison status, confidence, observability, and evidence.",
    "The user content explicitly labels REFERENCE IMAGE and CANDIDATE IMAGE. Preserve those roles and never swap them.",
    "Return exactly one observation for every selected check and do not return unselected checks.",
    "Use status = not_observable when the relevant attribute cannot be seen clearly enough.",
    "Never infer a component from product category, expected design, symmetry, or the other image. Every positive visibility claim must be directly supported by that specific image.",
    "Use differenceKind to describe the factual difference kind, not a canonical product issue.",
    "Do not describe attributes as identical or exactly matching; say that no meaningful visible difference was detected.",
    "Before comparing logo or visible_text, establish whether the same corresponding package face or identity-bearing region is visible in both images.",
    "Text visible on different package faces is not evidence that wording changed. For example, a reference front label and candidate back label are non-corresponding surfaces.",
    "When a large viewpoint difference hides the corresponding logo or text-bearing surface, use status = not_observable, coverage = insufficient or partial, and a non-mismatch differenceKind such as not_visible or unknown. Never report text_changed or value_changed solely because different package faces contain different text.",
    "Occlusion is not evidence of a product change. If a sticker, mask, crop, hand, glare, reflection, or another object partly or fully covers the corresponding logo or text, use status = not_observable, coverage = partial or insufficient, and differenceKind = not_visible or unreadable.",
    "Never report brand_changed, text_changed, or value_changed solely because original content is covered. A mismatch requires the changed or replacement identity content itself to be directly visible and comparable.",
    "Inspect and describe the CANDIDATE independently before using the reference for comparison. Candidate observations and evidence must include only text, parts, and silhouette directly visible inside the candidate frame.",
    "Never use readable reference content to autocomplete, reconstruct, or claim visibility of candidate text or parts that are cropped, blurred, too small, hidden, or outside the frame.",
    "If the image boundary cuts through the product, treat checks that depend on the missing region as partial or insufficient coverage. Do not describe the product as fully visible and do not infer the hidden outer silhouette.",
    "Treat a close-up, detail crop, or isolated label panel as partial product coverage even when that visible region is sharp and readable. Readable detail does not prove that the complete product, components, dominant package color, or outer packaging shape is visible.",
    "Do not compare different coverage scopes as a product mismatch. In particular, do not compare the reference's full package body color with a candidate close-up of a white label and report color_changed. If the candidate omits the color-bearing body or major package regions, dominant_color must be not_observable with partial or insufficient coverage.",
    "For every positive candidate visibility claim, verify that the named feature is inside the candidate frame. If the candidate shows only a label or interior package region, never claim that a zipper, seal, cap, pouch body, side boundary, bottom gusset, complete silhouette, or overall proportions are visible unless those exact features are directly present in the candidate pixels.",
    "A matching logo or readable text on a close-up label may be observable while dominant_color, major_components, and major_shape_packaging are not observable. Evaluate each family independently and do not use the reference to complete the cropped candidate.",
    "Check family boundaries:",
    "- logo: compare the identity-bearing brand mark or logo presence, identity, and approximate identity-relevant placement. A mismatch in this family must use differenceKind = brand_changed.",
    "- visible_text: independently transcribe only identity-bearing wording and printed values directly legible in each image, including brand, model, variant, size, net volume, net weight, flavor, and shade, then compare corresponding visible package faces or regions. Never copy a reference transcription into the candidate. Ignore casing, punctuation, microcopy, typography, font color, and layout-only changes. If any reference identity-bearing wording or value is outside the candidate frame, cropped, too small, blurred, or unreadable, return not_observable with partial/insufficient coverage rather than match or mismatch. A valid mismatch in this family must use differenceKind = text_changed or value_changed.",
    "- quantity: compare the number of directly visible complete primary products, represented units, or pack configuration. Never use quantity for printed net volume, net weight, dimensions, or size values. If both images show one complete product, quantity is a match even when printed capacity differs. A close-up label or partial package fragment does not establish that exactly one complete primary product is visible; return not_observable with partial/insufficient coverage and never infer candidate count from the reference.",
    "- dominant_color: compare corresponding semantic color families of the product body or major package regions, not raw RGB and not isolated text or logo ink. A visible label close-up is not sufficient color coverage when the reference's dominant color belongs to the omitted package body. Ignore lighting, white balance, shadow, glare, reflection, and minor accent changes. A mismatch requires directly visible corresponding color-bearing regions in both images and must use differenceKind = color_changed; otherwise use not_observable with partial/insufficient coverage.",
    "- major_components: first inventory directly visible components in the reference, then independently inventory directly visible components in the candidate. Compare whether discrete identity-relevant parts such as a cap, trigger sprayer, pump, handle, lid, nozzle, applicator, accessory, or label panel are present. Never copy the reference inventory into the candidate observation. If a crop shows only a label panel and omits the package closure or body, name only the label panel as visible and return not_observable with partial/insufficient coverage for the complete component comparison. If the same parts are present but their container shape changes, this family is a match. Do not mark a component missing when it is hidden by angle, crop, or occlusion. A mismatch in this family must use differenceKind = component_missing or component_extra.",
    "- major_shape_packaging: compare overall container type, silhouette, major proportions, and packaging identity. Ignore scale, repositioning, minor perspective, and lens distortion. If the product silhouette exits the image frame or a major outer boundary is cropped, return not_observable with partial/insufficient coverage; do not claim the complete shape matches and do not report shape_changed solely due to crop. A mismatch in this family must use differenceKind = shape_changed.",
    "A quantity mismatch must use differenceKind = count_changed.",
    "Each observation status must be based only on its own check family, even when another family has a clear mismatch.",
    "If wording and printed values are unchanged, visible_text must be match even when typography or text color changes.",
    "If logo identity and presence are unchanged, logo must be match even when only its palette changes; report a material package palette change only under dominant_color.",
    "If semantic product/package colors are unchanged and only shape differs, dominant_color must be match.",
    "If all discrete components remain present and only their shape or container silhouette differs, major_components must be match.",
    "A clearly exposed threaded neck, open bottle mouth, bare attachment ring, or uncapped opening is direct evidence that an attached cap, trigger sprayer, pump, or nozzle is absent.",
    "When the reference visibly has an attached component and the candidate's attachment area is clearly visible without it, major_components must be mismatch with differenceKind = component_missing and high confidence.",
    "Do not call a bare bottle neck, threaded opening, or attachment ring a nozzle, pump, cap, or trigger sprayer.",
    "For major_components evidence, referenceObservation and candidateObservation must separately name what is directly visible in each image.",
    "For status = match, use differenceKind = none. Never use a mismatch differenceKind from another check family.",
    "Do not report the same factual change under multiple check families. In particular, a printed capacity or weight change belongs only to visible_text.",
    "Return evidence as a strict object. If you need to include arbitrary notes, put them into rawJson as a stringified JSON object.",
    `Selected checks: ${input.selectedChecks.join(", ")}.`,
    input.category ? `Category: ${input.category}.` : "Category: M0 CPG packaged product.",
  ].join("\n");
}
