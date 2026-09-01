import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import type { D1Database } from "../lib/cloudflare/bindings";
import { analysisBelongsToEventActor } from "../lib/analytics/repository";
import { CLIENT_PRODUCT_EVENT_NAMES } from "../lib/analytics/types";

type AnalysisOwner = {
  id: string;
  workspaceId: string | null;
  anonymousSessionId: string | null;
};

async function main(): Promise<void> {
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
