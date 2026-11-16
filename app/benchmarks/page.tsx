import type { Metadata } from "next";
import Link from "next/link";
import { SourceList } from "@/components/SourceList";
import { browseComp, cursorBench } from "@/lib/models/catalog";

export const metadata: Metadata = {
  title: "LLM Benchmarks Explained: What Each Test Measures",
  description: "Every LLM benchmark on Pairvu explained — what it measures, which exact model versions were tested, and when each result was published.",
  alternates: { canonical: "/benchmarks" },
};

export default function Page() {
  return <main className="model-shell">
    <p className="eyebrow">Benchmark index · updated 2026-11-16</p>
    <h1>LLM benchmarks</h1>
    <p className="lede">A benchmark score is meaningful only with its version, harness, model configuration, and source. Pairvu does not combine unrelated harnesses into a composite score.</p>
    <p>Pairvu currently explains two benchmarks. The owner publication date, model-owner report date, and Pairvu collection date describe different events; a recent source check does not make an older result new.</p>
    <h2>What each test measures</h2>
    <h3><Link href="/benchmarks/cursorbench">CursorBench 4.0: coding agents in a real editor</Link></h3>
    <p>{cursorBench.method} Version 4.0 introduced long-horizon tasks on {cursorBench.versionReleaseDate}, including editing, refactoring, investigation, and design adherence. Pairvu preserves Gemini 4 Carbon High, Fable 5.2 Max, Opus 5.5 Max, and Haiku 5.5 Max, with each configuration and owner-reported cost per task.</p>
    <p>{cursorBench.resultPublished} Pairvu checked this snapshot on {cursorBench.snapshotDate}; that is a collection date. {cursorBench.limitation}</p>
    <h3><Link href="/benchmarks/browsecomp">BrowseComp: persistent information search</Link></h3>
    <p>{browseComp.method} The original {browseComp.releaseDate} release contains 1,266 questions. Pairvu shows its Deep research, o1, GPT-4o with browsing, and GPT-4.5 baselines separately from Z.ai&apos;s {browseComp.latestReportDate} GLM-5 report.</p>
    <p>The GLM-5 thinking and context-management configurations are distinct. Neither source supplies per-task run cost for the displayed results. {browseComp.limitation} BrowseComp-Plus, named in some model launch reports, is a different evaluation and is not substituted here.</p>
    <h2>Coverage matrix</h2>
    <table className="model-table"><thead><tr><th>Benchmark</th><th>Version / date</th><th>Pairvu coverage</th><th>Configuration and cost</th><th>Main limitation</th></tr></thead><tbody>
      <tr><th><Link href="/benchmarks/cursorbench">CursorBench</Link></th><td>v{cursorBench.version} · version introduced {cursorBench.versionReleaseDate}<br/>Snapshot checked <time dateTime={cursorBench.snapshotDate}>{cursorBench.snapshotDate}</time><br/>Individual result publication dates unknown</td><td>{cursorBench.coverage}</td><td>Named effort configurations; owner-reported run cost per task.</td><td>Cursor agent harness and task budget are part of the result.</td></tr>
      <tr><th><Link href="/benchmarks/browsecomp">BrowseComp</Link></th><td>{browseComp.version}<br/>Owner release <time dateTime={browseComp.releaseDate}>{browseComp.releaseDate}</time><br/>Z.ai report {browseComp.latestReportDate}</td><td>{browseComp.coverage}</td><td>Baseline and vendor configurations are separate; cited sources do not report run cost.</td><td>Short-answer browsing tasks are not a universal measure of open-ended research.</td></tr>
    </tbody></table>
    <SourceList sources={[cursorBench.source, browseComp.source, browseComp.latestSource]} />
  </main>;
}
