import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import type { D1Database } from "../lib/cloudflare/bindings";
import { analysisBelongsToEventActor } from "../lib/analytics/repository";
import { CLIENT_PRODUCT_EVENT_NAMES } from "../lib/analytics/types";
import { captureAcquisitionContext, contentLandingProperties, getAnonymousSessionId, trackProductEvent } from "../lib/analytics/client";

type AnalysisOwner = {
  id: string;
  workspaceId: string | null;
  anonymousSessionId: string | null;
};

async function main(): Promise<void> {
  await verifyContentAcquisition();
  const workspaceAnalysis = "00000000-0000-4000-8000-000000000001";
  const anonymousAnalysis = "00000000-0000-4000-8000-000000000002";
  const anonymousSession = "00000000-0000-4000-8000-000000000003";
  const db = ownershipDb([
    { id: workspaceAnalysis, workspaceId: "workspace_primary", anonymousSessionId: null },
    { id: anonymousAnalysis, workspaceId: null, anonymousSessionId: anonymousSession },
  ]);

  assert.equal(
    await analysisBelongsToEventActor(db, workspaceAnalysis, {
      workspaceId: "workspace_primary",
      anonymousSessionId: anonymousSession,
    }),
    true,
  );
  assert.equal(
    await analysisBelongsToEventActor(db, workspaceAnalysis, {
      workspaceId: "workspace_other",
      anonymousSessionId: anonymousSession,
    }),
    false,
  );
  assert.equal(
    await analysisBelongsToEventActor(db, anonymousAnalysis, {
      workspaceId: null,
      anonymousSessionId: anonymousSession,
    }),
    true,
  );
  assert.equal(
    await analysisBelongsToEventActor(db, anonymousAnalysis, {
      workspaceId: null,
      anonymousSessionId: "00000000-0000-4000-8000-000000000004",
    }),
    false,
  );

  assert.ok(CLIENT_PRODUCT_EVENT_NAMES.includes("analysis_submit_attempted"));
  assert.ok(CLIENT_PRODUCT_EVENT_NAMES.includes("analysis_submit_blocked"));
  assert.ok(CLIENT_PRODUCT_EVENT_NAMES.includes("example_cta_clicked"));
  assert.ok(CLIENT_PRODUCT_EVENT_NAMES.includes("zero_allowance_viewed"));
  assert.ok(CLIENT_PRODUCT_EVENT_NAMES.includes("zero_allowance_cta_clicked"));
  assert.ok(CLIENT_PRODUCT_EVENT_NAMES.includes("pricing_viewed"));
  assert.ok(CLIENT_PRODUCT_EVENT_NAMES.includes("checkout_started"));
  assert.ok(CLIENT_PRODUCT_EVENT_NAMES.includes("checkout_redirected"));
  assert.ok(CLIENT_PRODUCT_EVENT_NAMES.includes("product_created"));
  assert.ok(CLIENT_PRODUCT_EVENT_NAMES.includes("saved_product_selected"));
  assert.ok(CLIENT_PRODUCT_EVENT_NAMES.includes("reference_reused"));
  assert.ok(CLIENT_PRODUCT_EVENT_NAMES.includes("reference_version_promoted"));
  assert.ok(CLIENT_PRODUCT_EVENT_NAMES.includes("product_history_viewed"));

  const eventRoute = await readFile("app/api/events/route.ts", "utf8");
  assert.match(eventRoute, /resolveRequestAccess/);
  assert.match(eventRoute, /analysisBelongsToEventActor/);

  const checker = await readFile("components/ProductChecker.tsx", "utf8");
  assert.match(checker, /eventName: "analysis_submit_attempted"/);
  assert.match(checker, /eventName: "analysis_submit_blocked"/);
  assert.match(checker, /errorCode: payload\.error/);

  const batchCreation = await readFile("app/account/batches/new/BatchCreationClient.tsx", "utf8");
  assert.match(batchCreation, /trackedPrefillProductId/);
  assert.match(batchCreation, /eventName: "saved_product_selected"/);
  assert.match(batchCreation, /selection_source: "product_detail_cta"/);
  assert.match(batchCreation, /selection_source: "dropdown"/);
  assert.match(batchCreation, /reference_role/);

  const migration = await readFile("migrations/0015_product_event_submission_observability.sql", "utf8");
  assert.match(migration, /'analysis_submit_attempted'/);
  assert.match(migration, /'analysis_submit_blocked'/);
  assert.match(migration, /insert into product_events_next[\s\S]+from product_events/);

  const activationMigration = await readFile("migrations/0016_activation_conversion_events.sql", "utf8");
  assert.match(activationMigration, /'example_cta_clicked'/);
  assert.match(activationMigration, /'zero_allowance_viewed'/);
  assert.match(activationMigration, /'zero_allowance_cta_clicked'/);
  assert.match(activationMigration, /'pricing_viewed'/);
  assert.match(activationMigration, /'checkout_started'/);
  assert.match(activationMigration, /'checkout_redirected'/);
  assert.match(activationMigration, /insert into product_events_next[\s\S]+from product_events/);

  const savedProductMigration = await readFile("migrations/0018_saved_product_events.sql", "utf8");
  assert.match(savedProductMigration, /'product_created'/);
  assert.match(savedProductMigration, /'saved_product_selected'/);
  assert.match(savedProductMigration, /'reference_reused'/);
  assert.match(savedProductMigration, /'reference_version_promoted'/);
  assert.match(savedProductMigration, /'product_history_viewed'/);
  assert.match(savedProductMigration, /insert into product_events_next[\s\S]+from product_events/);

  console.log("Product analytics verification passed.");
  console.log("Verified ownership plus analysis, activation, and purchase-intent observability wiring.");
}

async function verifyContentAcquisition() {
  const storage = () => {
    const values = new Map<string, string>();
    return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
  };
  const localStorage = storage();
  const sessionStorage = storage();
  // A legacy local value must not seed a new browser session's attribution.
  localStorage.setItem("visualqa.sessionAttribution", JSON.stringify({ utmSource: "stale" }));
  const browser = { localStorage, sessionStorage, location: { pathname: "/guides/compare-original-and-ai-product-images", search: "?utm_source=content-test", hostname: "pairvu.com" }, navigator: { language: "en" }, innerWidth: 1200 };
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const originalFetch = globalThis.fetch;
  const events: Array<{ anonymousSessionId: string; attribution: { utmSource?: string }; properties?: Record<string, string> }> = [];
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  Object.defineProperty(globalThis, "document", { configurable: true, value: { referrer: "" } });
  globalThis.fetch = async (_input, init) => { events.push(JSON.parse(String(init?.body))); return new Response(null, { status: 204 }); };
  try {
    const route = browser.location.pathname;
    const publishedRoutes = [route, "/", "/account", "/sign-in", "/privacy"];
    const properties = contentLandingProperties(route, publishedRoutes);
    assert.deepEqual(properties, { surface: "content", route, content_id: route, page_family: "guide" });
    for (const excluded of ["/", "/account", "/sign-in", "/privacy", "/guides/unknown", "/unknown"]) {
      assert.equal(contentLandingProperties(excluded, publishedRoutes), null);
    }
    const landing = captureAcquisitionContext();
    await trackProductEvent({ eventName: "landing_view", anonymousSessionId: getAnonymousSessionId(), attribution: landing.attribution, properties: properties! });
    browser.location.pathname = "/";
    browser.location.search = "";
    const checker = captureAcquisitionContext();
    await trackProductEvent({ eventName: "checker_started", anonymousSessionId: getAnonymousSessionId(), attribution: checker.attribution });
    assert.equal(events[0].anonymousSessionId, events[1].anonymousSessionId);
    assert.equal(events[1].attribution.utmSource, "content-test");
    const firstTouch = localStorage.getItem("visualqa.firstTouch");
    browser.sessionStorage = storage(); // Fresh tab/session, same durable first touch and anonymous ID.
    assert.deepEqual(captureAcquisitionContext().attribution, {});
    assert.equal(localStorage.getItem("visualqa.firstTouch"), firstTouch);
    assert.equal(getAnonymousSessionId(), events[0].anonymousSessionId);
    assert.equal(localStorage.getItem("visualqa.sessionAttribution"), JSON.stringify({ utmSource: "stale" }));

    const content = await readFile("components/ContentLandingAnalytics.tsx", "utf8");
    assert.match(content, /<ActivationView eventName="landing_view" idempotencyPrefix=\{`content-landing:\$\{pathname\}`\}/);
    assert.match(content, /if \(!properties\) return null/);
    const layout = await readFile("app/layout.tsx", "utf8");
    assert.match(layout, /page\.status === "published" && page\.indexable/);
    console.log("Content acquisition passed: route exclusions, shared anonymous actor, session isolation, durable first touch, and per-route landing idempotency wiring.");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow); else Reflect.deleteProperty(globalThis, "window");
    if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument); else Reflect.deleteProperty(globalThis, "document");
  }
}

function ownershipDb(owners: AnalysisOwner[]): D1Database {
  return {
    prepare(sql: string) {
      assert.match(sql, /workspace_id/);
      assert.match(sql, /anonymous_session_id/);
      return {
        bind(analysisId: string, workspaceId: string | null, anonymousSessionId: string | null) {
          return {
            async first<T>(): Promise<T | null> {
              const owner = owners.find(
                (candidate) =>
                  candidate.id === analysisId &&
                  ((candidate.workspaceId !== null && candidate.workspaceId === workspaceId) ||
                    (candidate.anonymousSessionId !== null && candidate.anonymousSessionId === anonymousSessionId)),
              );
              return (owner ? { id: owner.id } : null) as T | null;
            },
          };
        },
      };
    },
  } as unknown as D1Database;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
