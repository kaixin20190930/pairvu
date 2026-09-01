import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import {
  analysisBelongsToEventActor,
  clientEventRateLimitExceeded,
  recordProductEvent,
} from "@/lib/analytics/repository";
import { CLIENT_PRODUCT_EVENT_NAMES } from "@/lib/analytics/types";
import { RequestAccessError, resolveRequestAccess } from "@/lib/auth/request-access";

export const dynamic = "force-dynamic";

const OptionalText = z.string().trim().min(1).max(255).optional();
const EventSchema = z
  .object({
    idempotencyKey: z.string().trim().min(8).max(128),
    eventName: z.enum(CLIENT_PRODUCT_EVENT_NAMES),
    anonymousSessionId: z.string().trim().min(8).max(128),
    analysisId: z.string().uuid().optional(),
    occurredAt: z.string().datetime().optional(),
    pagePath: z.string().trim().min(1).max(512).optional(),
    attribution: z
      .object({
        referrerDomain: OptionalText,
        utmSource: OptionalText,
        utmMedium: OptionalText,
        utmCampaign: OptionalText,
        utmContent: OptionalText,
        utmTerm: OptionalText,
      })
      .strict()
      .optional(),
    locale: z.string().trim().min(1).max(64).optional(),
    deviceClass: z.enum(["mobile", "tablet", "desktop"]).optional(),
    properties: z
      .record(z.string().trim().min(1).max(64), z.union([z.string().max(255), z.number(), z.boolean(), z.null()]))
      .optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.properties && Object.keys(value.properties).length > 20) {
      context.addIssue({
        code: "custom",
        path: ["properties"],
        message: "properties cannot contain more than 20 fields",
      });
    }

    if (JSON.stringify(value.properties ?? {}).length > 4096) {
      context.addIssue({
        code: "custom",
        path: ["properties"],
        message: "properties payload is too large",
      });
    }
  });

export async function POST(request: NextRequest) {
  try {
    const parsed = EventSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "invalid_event",
          message: "The product event payload is invalid.",
        },
        { status: 400 },
      );
    }

    const env = getVisualQAEnv();
    if (await clientEventRateLimitExceeded(env.VISUALQA_DB, parsed.data.anonymousSessionId)) {
      return NextResponse.json(
        {
          error: "event_rate_limited",
          message: "Too many product events.",
        },
        { status: 429 },
      );
    }

    if (parsed.data.analysisId) {
      const access = await resolveRequestAccess(env, request.headers, parsed.data.anonymousSessionId);
      if (
        !(await analysisBelongsToEventActor(env.VISUALQA_DB, parsed.data.analysisId, {
          workspaceId: access.workspaceId,
          anonymousSessionId: access.anonymousSessionId,
        }))
      ) {
        return NextResponse.json(
          {
            error: "analysis_not_found",
            message: "The analysis does not belong to this account or anonymous session.",
          },
          { status: 404 },
        );
      }
    }

    await recordProductEvent(env.VISUALQA_DB, {
      ...parsed.data,
      eventSource: "client",
      occurredAt: parsed.data.occurredAt ?? new Date().toISOString(),
    });

    return NextResponse.json({ accepted: true }, { status: 202 });
  } catch (error) {
    if (error instanceof RequestAccessError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: 400 });
    }

    console.error("product_event_failed", error);
    return NextResponse.json(
      {
        error: "product_event_failed",
        message: "The product event could not be recorded.",
      },
      { status: 500 },
    );
  }
}
