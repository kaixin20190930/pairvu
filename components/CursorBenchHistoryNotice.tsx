import { cursorBench } from "@/lib/models/catalog";

export function CursorBenchHistoryNotice() {
  const history = cursorBench.provenance;
  return <aside className="note" aria-label="CursorBench historical snapshot">
    <p><strong>Historical CursorBench 4.0 snapshot.</strong> These results retain the configurations collected on <time dateTime={cursorBench.snapshotDate}>{cursorBench.snapshotDate}</time>. The official current version, checked <time dateTime={history.packagedDate}>{history.packagedDate}</time>, is {history.currentVersion}, released <time dateTime={history.currentVersionDate}>{history.currentVersionDate}</time>; it changes instruction-following tasks and increases agent time. The versions are not a shared-harness ranking; no 4.1 scores are included here.</p>
    <p><a href={history.snapshotUrl} download>Download Pairvu’s retained transcription (JSON)</a>, reconstructed from the <a href={history.catalogUrl}>immutable Git catalog</a> and <a href={history.reviewUrl}>original independent review</a>, packaged {history.packagedDate}. Original temporary owner-page captures are unavailable; this is not an official raw archive or the complete leaderboard. The <a href={cursorBench.source.url}>official current methodology and changelog</a> is a separate source and does not verify these historical numbers.</p>
  </aside>;
}
