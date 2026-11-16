import type { Metadata } from "next";
import Link from "next/link";
import { ModelTable } from "@/components/ModelTable";
import { browseComp, cursorBench, type Source } from "@/lib/models/catalog";

export const metadata: Metadata = {
  title: "LLM Benchmark Leaderboards: Scores and Model Specs",
  description: "Explore source-linked CursorBench 4.0 and BrowseComp scores grouped by benchmark and configuration, with official sources, check dates, and model specifications.",
  alternates: { canonical: "/leaderboard" },
};

function ScoreRow({ row, source, published }: {
  row: { model: string; slug?: string; score: number; configuration: string };
  source: Source;
  published: string;
}) {
  return <tr>
    <th scope="row">{row.slug ? <Link href={`/models/${row.slug}`}>{row.model}</Link> : row.model}</th>
    <td>{row.configuration}</td>
    <td>{row.score}%</td>
    <td><a href={source.url}>{source.label}</a></td>
    <td>{published}</td>
    <td>{source.accessed}</td>
  </tr>;
}

function ScoreColumns() {
  return <thead><tr><th>Model / named configuration</th><th>Configuration</th><th>Score</th><th>Official source</th><th>Result publication</th><th>Source checked</th></tr></thead>;
}

export default function Page() {
  return <main className="model-shell">
    <p className="eyebrow">Source-linked benchmark results · updated 2026-11-16</p>
    <h1>LLM benchmark leaderboards</h1>
    <p className="lede">Ten configuration results across two benchmarks, not ten independent models. Each test retains its own methodology and evidence groups; there is no universal ranking or composite score.</p>
    <section>
      <h2>CursorBench {cursorBench.version}</h2>
      <p>{cursorBench.method} {cursorBench.coverage}</p>
      <p>Benchmark version released {cursorBench.versionReleaseDate}. {cursorBench.resultPublished} The snapshot and source-check dates are not result publication dates.</p>
      <div className="table-wrap"><table className="model-table">
        <caption>CursorBench 4.0 · four owner-reported configurations</caption>
        <ScoreColumns />
        <tbody>{cursorBench.rows.map((row) => <ScoreRow key={row.model} row={row} source={cursorBench.source} published="Unknown — not stated by source" />)}</tbody>
      </table></div>
      <p>{cursorBench.limitation}</p>
      <Link href="/benchmarks/cursorbench">CursorBench methodology and results</Link>
    </section>
    <section>
      <h2>BrowseComp</h2>
      <p>{browseComp.method} {browseComp.coverage}</p>
      <p>{browseComp.version}. The 2025 benchmark-owner baselines and the 2026 Z.ai vendor report use separate configurations and are not a combined ranking.</p>
      <div className="table-wrap"><table className="model-table">
        <caption>BrowseComp · separate owner baseline and vendor-report evidence groups</caption>
        <ScoreColumns />
        <tbody>
          <tr><th colSpan={6} scope="rowgroup">2025 benchmark-owner baselines · OpenAI release</th></tr>
          {browseComp.rows.map((row) => <ScoreRow key={row.model} row={row} source={browseComp.source} published={browseComp.releaseDate} />)}
        </tbody>
        <tbody>
          <tr><th colSpan={6} scope="rowgroup">2026 vendor report · Z.ai GLM-5</th></tr>
          {browseComp.latest.map((row) => <ScoreRow key={row.model} row={row} source={browseComp.latestSource} published={browseComp.latestReportDate} />)}
        </tbody>
      </table></div>
      <p>{browseComp.limitation}</p>
      <Link href="/benchmarks/browsecomp">BrowseComp methodology and results</Link>
    </section>
    <section>
      <h2>Model specification matrix</h2>
      <p>This matrix compares auditable specifications; benchmark results above describe only the named test configurations.</p>
      <ModelTable />
    </section>
    <div className="pill-links"><Link href="/benchmarks/cursorbench">CursorBench</Link><Link href="/benchmarks/browsecomp">BrowseComp</Link><Link href="/llm-pricing">Pricing</Link></div>
  </main>;
}
