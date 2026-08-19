import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const database = process.env.PAIRVU_D1_DATABASE || "pairvu-production";
const sql = readFileSync(new URL("./m1-billing-audit.sql", import.meta.url), "utf8");
const reports = sql
  .split(";")
  .map((statement) => statement.trim())
  .filter((statement) => statement && !statement.split("\n").every((line) => line.trim().startsWith("--")));

const titles = [
  "Credit ledger reconciliation",
  "Check-pack ledger reconciliation",
  "Expired credit reservations",
  "Subscription and credit-period alignment",
  "Stripe webhook processing",
  "Plan and usage summary",
];

let unhealthy = false;

for (const [index, statement] of reports.entries()) {
  const query = statement
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .trim();
  if (!query) continue;

  const result = spawnSync(
    fileURLToPath(new URL("../node_modules/.bin/wrangler", import.meta.url)),
    ["d1", "execute", database, "--remote", "--command", query, "--json"],
    {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      encoding: "utf8",
      env: { ...process.env, WRANGLER_LOG_PATH: "/tmp/pairvu-wrangler.log" },
    },
  );

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || "Wrangler audit command failed without output.\n");
    process.exit(result.status ?? 1);
  }

  const payload = JSON.parse(result.stdout);
  const rows = payload.flatMap((entry) => entry.results ?? []);
  const isSummary = index === reports.length - 1;
  console.log(`\n${index + 1}. ${titles[index] ?? `Report ${index + 1}`}`);
  if (rows.length === 0) {
    console.log("PASS - no exceptions found.");
  } else {
    console.table(rows);
    if (!isSummary) unhealthy = true;
  }
}

if (unhealthy) {
  console.error("\nM1 billing audit found exceptions that require operator review.");
  process.exitCode = 1;
} else {
  console.log("\nM1 billing audit passed. No reconciliation or processing exceptions found.");
}
