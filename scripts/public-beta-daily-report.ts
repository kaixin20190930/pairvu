import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const DATABASE = "pairvu-production";
const TIME_ZONE = "Asia/Shanghai";

type D1Envelope = { results?: Array<Record<string, unknown>> };

async function main() {
  const date = readDateArgument(process.argv.slice(2)) ?? todayInShanghai();
  const { start, end } = utcDayWindow(date);

  const [funnel, acquisition, quality, feedback, feedbackQuality, failures, activation] = await Promise.all([
    query(`
      select event_name as eventName, count(distinct anonymous_session_id) as sessions
      from product_events
      where occurred_at >= '${start}' and occurred_at < '${end}'
      group by event_name
    `),
    query(`
      select
        coalesce(utm_source, '(direct)') as source,
        coalesce(utm_medium, '(none)') as medium,
        coalesce(utm_campaign, '(not set)') as campaign,
        coalesce(referrer_domain, '(direct)') as referrer,
        count(distinct anonymous_session_id) as sessions,
        count(distinct case when event_name = 'analysis_completed' then anonymous_session_id end) as completedSessions,
        count(distinct case when event_name = 'feedback_submitted' then anonymous_session_id end) as feedbackSessions
      from product_events
      where occurred_at >= '${start}' and occurred_at < '${end}'
      group by source, medium, campaign, referrer
      order by completedSessions desc, sessions desc
      limit 20
    `),
    query(`
      select
        status,
        coalesce(verdict, '(none)') as verdict,
        count(*) as analyses,
        round(avg(analysis_latency_ms)) as averageLatencyMs,
        round(avg(estimated_cost_usd), 6) as averageCostUsd,
        round(sum(estimated_cost_usd), 6) as totalCostUsd
      from analyses
      where created_at >= '${start}' and created_at < '${end}'
      group by status, verdict
      order by analyses desc
    `),
    query(`
      select
        feedback_kind as feedbackKind,
        coalesce(reason_code, '(none)') as reasonCode,
        coalesce(check_family, '(none)') as checkFamily,
        count(*) as feedbackCount
      from analysis_feedback
      where created_at >= '${start}' and created_at < '${end}'
      group by feedbackKind, reasonCode, checkFamily
      order by feedbackCount desc
    `),
    query(`
      select
        feedback.feedback_kind as feedbackKind,
        coalesce(feedback.reason_code, '(none)') as reasonCode,
        coalesce(feedback.check_family, issues.source_check_type, '(none)') as checkFamily,
        coalesce(analyses.verdict, '(none)') as verdict,
        coalesce(modelCalls.provider, '(none)') as provider,
        coalesce(modelCalls.model, '(none)') as model,
        coalesce(modelCalls.prompt_version, '(none)') as promptVersion,
        coalesce(sessions.first_touch_utm_source, '(direct)') as source,
        count(*) as feedbackCount
      from analysis_feedback feedback
      join analyses on analyses.id = feedback.analysis_id
      left join analysis_issues issues on issues.id = feedback.issue_id
      left join analysis_model_calls modelCalls on modelCalls.analysis_id = feedback.analysis_id
        and modelCalls.purpose = 'analysis'
      left join anonymous_sessions sessions on sessions.anonymous_session_id = analyses.anonymous_session_id
      where feedback.created_at >= '${start}' and feedback.created_at < '${end}'
      group by feedbackKind, reasonCode, checkFamily, verdict, provider, model, promptVersion, source
      order by feedbackCount desc
      limit 50
    `),
    query(`
      select
        event_name as eventName,
        coalesce(json_extract(properties_json, '$.errorCode'), '(unknown)') as errorCode,
        count(*) as failures
      from product_events
      where occurred_at >= '${start}' and occurred_at < '${end}'
        and event_name in (
          'reference_upload_failed',
          'candidate_upload_failed',
          'analysis_submit_blocked',
          'analysis_failed'
        )
      group by eventName, errorCode
      order by failures desc
    `),
    query(`
      select
        event_name as eventName,
        coalesce(json_extract(properties_json, '$.surface'), '(not set)') as surface,
        coalesce(json_extract(properties_json, '$.purchaseType'), '(not set)') as purchaseType,
        coalesce(json_extract(properties_json, '$.planCode'), json_extract(properties_json, '$.packCode'), '(not set)') as offerCode,
        count(*) as events,
        count(distinct anonymous_session_id) as sessions
      from product_events
      where occurred_at >= '${start}' and occurred_at < '${end}'
        and event_name in (
          'example_cta_clicked',
          'zero_allowance_viewed',
          'zero_allowance_cta_clicked',
          'pricing_viewed',
          'checkout_started',
          'checkout_redirected'
        )
      group by eventName, surface, purchaseType, offerCode
      order by events desc
    `),
  ]);

  const funnelCounts = new Map(funnel.map((row) => [String(row.eventName), number(row.sessions)]));
  const count = (name: string) => funnelCounts.get(name) ?? 0;
  const report = [
    `# Pairvu Public Beta Daily Report`,
    ``,
    `Date: ${date} (${TIME_ZONE})`,
    `Window: ${start} to ${end}`,
    ``,
    `## Funnel`,
    funnelTable([
      ["Landing sessions", count("landing_view"), null],
      ["Checker started", count("checker_started"), count("landing_view")],
      ["Reference upload completed", count("reference_upload_completed"), count("checker_started")],
      ["Candidate upload completed", count("candidate_upload_completed"), count("reference_upload_completed")],
      ["Analysis submit attempted", count("analysis_submit_attempted"), count("candidate_upload_completed")],
      ["Analysis submit blocked", count("analysis_submit_blocked"), count("analysis_submit_attempted")],
      ["Analysis started", count("analysis_started"), count("analysis_submit_attempted")],
      ["Analysis completed", count("analysis_completed"), count("analysis_started")],
      ["Result viewed", count("result_viewed"), count("analysis_completed")],
      ["Feedback submitted", count("feedback_submitted"), count("result_viewed")],
      ["Second check started", count("second_check_started"), count("analysis_completed")],
    ]),
    ``,
    `## Activation And Purchase Intent`,
    funnelTable([
      ["Example CTA clicked", count("example_cta_clicked"), count("landing_view")],
      ["Zero allowance shown", count("zero_allowance_viewed"), null],
      ["Zero allowance CTA clicked", count("zero_allowance_cta_clicked"), count("zero_allowance_viewed")],
      ["Pricing viewed", count("pricing_viewed"), null],
      ["Checkout started", count("checkout_started"), count("pricing_viewed")],
      ["Checkout redirected", count("checkout_redirected"), count("checkout_started")],
    ]),
    ``,
    markdownRows(activation, ["eventName", "surface", "purchaseType", "offerCode", "events", "sessions"]),
    ``,
    `## Acquisition`,
    markdownRows(acquisition, ["source", "medium", "campaign", "referrer", "sessions", "completedSessions", "feedbackSessions"]),
    ``,
    `## Quality And Cost`,
    markdownRows(quality, ["status", "verdict", "analyses", "averageLatencyMs", "averageCostUsd", "totalCostUsd"]),
    ``,
    `## Feedback`,
    markdownRows(feedback, ["feedbackKind", "reasonCode", "checkFamily", "feedbackCount"]),
    ``,
    `## Feedback Quality Breakdown`,
    markdownRows(feedbackQuality, [
      "feedbackKind",
      "reasonCode",
      "checkFamily",
      "verdict",
      "provider",
      "model",
      "promptVersion",
      "source",
      "feedbackCount",
    ]),
    ``,
    `## Failed Attempts`,
    markdownRows(failures, ["eventName", "errorCode", "failures"]),
    ``,
    `## Interpretation`,
    `- This report contains aggregates only. It intentionally excludes images, filenames, OCR text, evidence, notes, and anonymous session IDs.`,
    `- Treat any rate based on fewer than 20 completed analyses as directional only.`,
  ].join("\n");

  process.stdout.write(`${report}\n`);
}

async function query(sql: string): Promise<Array<Record<string, unknown>>> {
  const { stdout } = await execFileAsync("pnpm", [
    "exec",
    "wrangler",
    "d1",
    "execute",
    DATABASE,
    "--remote",
    "--command",
    compactSql(sql),
    "--json",
  ], {
    env: {
      ...process.env,
      WRANGLER_LOG_PATH: process.env.WRANGLER_LOG_PATH ?? "/tmp/pairvu-wrangler.log",
    },
  });

  const parsed = JSON.parse(stdout) as D1Envelope[];
  return parsed.flatMap((envelope) => envelope.results ?? []);
}

function funnelTable(rows: Array<[string, number, number | null]>) {
  return [
    "| Step | Sessions | Step conversion |",
    "| --- | ---: | ---: |",
    ...rows.map(([label, value, denominator]) => `| ${label} | ${value} | ${rate(value, denominator)} |`),
  ].join("\n");
}

function markdownRows(rows: Array<Record<string, unknown>>, columns: string[]) {
  if (rows.length === 0) return "No data recorded.";

  return [
    `| ${columns.join(" | ")} |`,
    `| ${columns.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${columns.map((column) => String(row[column] ?? "").replaceAll("|", "\\|")).join(" | ")} |`),
  ].join("\n");
}

function rate(value: number, denominator: number | null) {
  if (!denominator) return "-";
  return `${((value / denominator) * 100).toFixed(1)}%`;
}

function number(value: unknown) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function compactSql(sql: string) {
  return sql.replace(/\s+/g, " ").trim();
}

function readDateArgument(args: string[]) {
  const index = args.indexOf("--date");
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Use --date YYYY-MM-DD.");
  }
  return value;
}

function todayInShanghai() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
}

function utcDayWindow(date: string) {
  const start = new Date(`${date}T00:00:00+08:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
