import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function main() {
  const [
    home,
    examples,
    checker,
    account,
    pricing,
    pricingPanel,
    planAction,
    packAction,
    billingContext,
    eventTypes,
    report,
  ] = await Promise.all([
    readFile("app/page.tsx", "utf8"),
    readFile("components/HomeExampleStrip.tsx", "utf8"),
    readFile("components/ProductChecker.tsx", "utf8"),
    readFile("app/account/page.tsx", "utf8"),
    readFile("app/pricing/page.tsx", "utf8"),
    readFile("app/pricing/PricingActivationPanel.tsx", "utf8"),
    readFile("app/pricing/PricingPlanAction.tsx", "utf8"),
    readFile("app/pricing/PricingPackAction.tsx", "utf8"),
    readFile("app/api/billing/context/route.ts", "utf8"),
    readFile("lib/analytics/types.ts", "utf8"),
    readFile("scripts/public-beta-daily-report.ts", "utf8"),
  ]);

  assert.match(home, /<HomeExampleStrip \/>/);
  for (const href of [
    "/examples/laundry-sheets-scent-count-change",
    "/examples/laundry-sheets-background-change",
    "/examples/laundry-sheets-back-view-review",
    "/examples/controlled-visual-qa-benchmark",
    "/examples",
  ]) {
    assert.match(examples, new RegExp(escapeRegExp(href)));
  }
  assert.match(examples, /controlled examples, not customer case studies/i);

  assert.match(checker, /Use two views that make the same product details observable/);
  assert.match(checker, /billingContext\.available === 0/);
  assert.match(checker, /disabled=\{uploadingReference \|\| analyzing \|\| noChecksAvailable\}/);
  assert.match(checker, /\/pricing\?reason=no-checks#check-packs/);
  assert.match(account, /snapshot\.available === 0/);
  assert.match(account, /zero_allowance_cta_clicked/);
  assert.match(billingContext, /periodEndsAt: account\.periodEndsAt/);

  assert.match(pricing, /<PricingActivationPanel \/>/);
  assert.match(pricingPanel, /pricing_viewed/);
  assert.match(pricingPanel, /zero_allowance_viewed/);
  assert.match(planAction, /trackCheckoutEvent\("checkout_started", planCode\)/);
  assert.match(planAction, /trackCheckoutEvent\("checkout_redirected", planCode\)/);
  assert.match(packAction, /trackCheckoutEvent\("checkout_started", packCode\)/);
  assert.match(packAction, /trackCheckoutEvent\("checkout_redirected", packCode\)/);

  for (const eventName of [
    "example_cta_clicked",
    "zero_allowance_viewed",
    "zero_allowance_cta_clicked",
    "pricing_viewed",
    "checkout_started",
    "checkout_redirected",
  ]) {
    assert.match(eventTypes, new RegExp(`"${eventName}"`));
    assert.match(report, new RegExp(`'${eventName}'|"${eventName}"`));
  }

  console.log("Activation experience verification passed.");
  console.log("Verified first-use guidance, controlled example links, zero-allowance recovery, and conversion telemetry wiring.");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
