"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PersistedBatchWithItems, RetainedBatchReference } from "@/lib/batches/types";
import { AccountBreadcrumbs } from "@/components/AccountBreadcrumbs";
import { AccountWorkspaceNav } from "@/components/AccountWorkspaceNav";

interface BatchCreationClientProps {
  availableCredits: number;
  batchItemLimit: number;
  csvExportEnabled: boolean;
  planName: string;
  retainedReferences: RetainedBatchReference[];
  retentionDays: number;
}

type CreationMode = "one_reference_many_candidates" | "explicit_pairs";
type ResultFilter = "exceptions" | "all" | "fail" | "review" | "pass" | "errors";
interface FilePair { id: string; reference: File | null; candidate: File | null }

interface ApiErrorPayload {
  error?: string;
  message?: string;
}

interface AssetResponse {
  asset?: { id?: string };
}

const TERMINAL_STATUSES = new Set(["completed", "completed_with_errors", "failed", "canceled"]);
const POLL_INTERVAL_MS = 2_000;

export function BatchCreationClient({
  availableCredits,
  batchItemLimit,
  csvExportEnabled,
  planName,
  retainedReferences,
  retentionDays,
}: BatchCreationClientProps) {
  const [creationMode, setCreationMode] = useState<CreationMode>("one_reference_many_candidates");
  const [reference, setReference] = useState<File | null>(null);
  const [retainedReferenceId, setRetainedReferenceId] = useState("");
  const [candidates, setCandidates] = useState<File[]>([]);
  const [pairs, setPairs] = useState<FilePair[]>([{ id: "pair-1", reference: null, candidate: null }]);
  const [batch, setBatch] = useState<PersistedBatchWithItems | null>(null);
  const [working, setWorking] = useState(false);
  const [batchAction, setBatchAction] = useState<"cancel" | string | null>(null);
  const [workMessage, setWorkMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resultFilter, setResultFilter] = useState<ResultFilter>("exceptions");
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const usableLimit = Math.min(batchItemLimit, availableCredits);
  const plannedItemCount = creationMode === "one_reference_many_candidates" ? candidates.length : pairs.length;
  const preflightError = useMemo(() => {
    if (creationMode === "one_reference_many_candidates" && !reference && !retainedReferenceId) return "Add or reuse one approved reference image.";
    if (creationMode === "one_reference_many_candidates" && candidates.length === 0) return "Add at least one candidate image.";
    if (creationMode === "explicit_pairs" && pairs.some((pair) => !pair.reference || !pair.candidate)) return "Every row needs one reference and one candidate image.";
    if (plannedItemCount > batchItemLimit) return `Your ${planName} plan supports up to ${batchItemLimit} product checks per batch.`;
    if (plannedItemCount > availableCredits) return `This batch needs ${plannedItemCount} checks, but ${availableCredits} are available.`;
    return null;
  }, [availableCredits, batchItemLimit, candidates.length, creationMode, pairs, planName, plannedItemCount, reference, retainedReferenceId]);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    pollTimer.current = null;
  }, []);

  const loadBatch = useCallback(async (batchId: string, keepPolling = true) => {
    try {
      const response = await fetch(`/api/batches?batchId=${encodeURIComponent(batchId)}`, { cache: "no-store" });
      const payload = await response.json() as { batch?: PersistedBatchWithItems } & ApiErrorPayload;
      if (!response.ok || !payload.batch) throw new Error(payload.message ?? "The batch could not be restored.");
      setBatch(payload.batch);
      setError(null);
      if (keepPolling && !TERMINAL_STATUSES.has(payload.batch.status)) {
        pollTimer.current = setTimeout(() => void loadBatch(batchId), POLL_INTERVAL_MS);
      } else {
        setWorking(false);
        setWorkMessage("");
      }
    } catch (loadError) {
      setWorking(false);
      setWorkMessage("");
      setError(loadError instanceof Error ? loadError.message : "The batch could not be restored.");
    }
  }, []);

  useEffect(() => {
    const batchId = new URLSearchParams(window.location.search).get("batchId");
    if (batchId) {
      setWorking(true);
      setWorkMessage("Restoring batch status...");
      void loadBatch(batchId);
    }
    return stopPolling;
  }, [loadBatch, stopPolling]);

  function selectCandidates(files: FileList | null) {
    const selected = Array.from(files ?? []);
    setError(null);
    setCandidates((current) => {
      const next = [...current];
      for (const file of selected) {
        if (!next.some((existing) => fileIdentity(existing) === fileIdentity(file))) next.push(file);
      }
      if (next.length > batchItemLimit) {
        setError(`Only the first ${batchItemLimit} candidates were kept for this batch.`);
      }
      return next.slice(0, batchItemLimit);
    });
  }

  function removeCandidate(index: number) {
    setCandidates((current) => current.filter((_, candidateIndex) => candidateIndex !== index));
    setError(null);
  }

  function updatePair(id: string, field: "reference" | "candidate", file: File | null) {
    setError(null);
    setPairs((current) => current.map((pair) => pair.id === id ? { ...pair, [field]: file } : pair));
  }

  async function startBatch() {
    if (preflightError) {
      setError(preflightError ?? "The batch is not ready.");
      return;
    }

    stopPolling();
    setWorking(true);
    setBatch(null);
    setError(null);

    try {
      const mappedItems: Array<{ referenceAssetId: string; candidateAssetId: string; clientLabel: string }> = [];
      if (creationMode === "one_reference_many_candidates") {
        setWorkMessage(reference ? "Uploading the approved reference..." : "Reusing the saved reference...");
        const referenceAssetId = retainedReferenceId || await uploadAsset(reference!, "reference");
        let uploadedCandidates = 0;
        const candidateItems = await mapWithConcurrency(candidates, 3, async (file) => {
          const candidateAssetId = await uploadAsset(file, "candidate");
          uploadedCandidates += 1;
          setWorkMessage(`Uploaded ${uploadedCandidates} of ${candidates.length} candidates...`);
          return {
            referenceAssetId,
            candidateAssetId,
            clientLabel: file.name,
          };
        });
        mappedItems.push(...candidateItems);
      } else {
        const uploadJobs = pairs.flatMap((pair, pairIndex) => [
          { pairIndex, kind: "reference" as const, file: pair.reference! },
          { pairIndex, kind: "candidate" as const, file: pair.candidate! },
        ]);
        let uploadedAssets = 0;
        const uploaded = await mapWithConcurrency(uploadJobs, 3, async (job) => {
          const assetId = await uploadAsset(job.file, job.kind);
          uploadedAssets += 1;
          setWorkMessage(`Uploaded ${uploadedAssets} of ${uploadJobs.length} batch images...`);
          return { ...job, assetId };
        });
        for (const [index, pair] of pairs.entries()) {
          mappedItems.push({
            referenceAssetId: uploaded.find((item) => item.pairIndex === index && item.kind === "reference")!.assetId,
            candidateAssetId: uploaded.find((item) => item.pairIndex === index && item.kind === "candidate")!.assetId,
            clientLabel: pair.candidate!.name,
          });
        }
      }

      setWorkMessage("Reserving checks and starting the batch...");
      const batchId = crypto.randomUUID();
      const response = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          idempotencyKey: crypto.randomUUID(),
          mappingMode: creationMode,
          items: mappedItems,
        }),
      });
      const payload = await response.json() as { batch?: PersistedBatchWithItems } & ApiErrorPayload;
      if (!response.ok || !payload.batch) throw new Error(payload.message ?? "The batch could not be started.");

      setBatch(payload.batch);
      window.history.replaceState(null, "", `/account/batches/new?batchId=${payload.batch.id}`);
      setWorkMessage("Checking candidate images...");
      pollTimer.current = setTimeout(() => void loadBatch(payload.batch!.id), POLL_INTERVAL_MS);
    } catch (startError) {
      setWorking(false);
      setWorkMessage("");
      setError(startError instanceof Error ? startError.message : "The batch could not be started.");
    }
  }

  async function updateBatch(action: "cancel" | "retry", batchItemId?: string) {
    if (!batch) return;
    stopPolling();
    setBatchAction(action === "cancel" ? "cancel" : batchItemId ?? "retry");
    setError(null);
    setWorkMessage(action === "cancel" ? "Canceling checks that have not started..." : "Retrying the failed check...");
    try {
      const response = await fetch(`/api/batches/${batch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, batchItemId }),
      });
      const payload = await response.json() as { batch?: PersistedBatchWithItems } & ApiErrorPayload;
      if (!response.ok || !payload.batch) throw new Error(payload.message ?? "The batch could not be updated.");
      setBatch(payload.batch);
      if (!TERMINAL_STATUSES.has(payload.batch.status)) {
        setWorking(true);
        setWorkMessage("Checking candidate images...");
        pollTimer.current = setTimeout(() => void loadBatch(payload.batch!.id), POLL_INTERVAL_MS);
      } else {
        setWorking(false);
        setWorkMessage("");
      }
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "The batch could not be updated.");
      setWorking(true);
      setWorkMessage("Checking candidate images...");
      pollTimer.current = setTimeout(() => void loadBatch(batch.id), POLL_INTERVAL_MS);
    } finally {
      setBatchAction(null);
    }
  }

  function resetBatch() {
    stopPolling();
    setReference(null);
    setRetainedReferenceId("");
    setCandidates([]);
    setPairs([{ id: crypto.randomUUID(), reference: null, candidate: null }]);
    setBatch(null);
    setWorking(false);
    setBatchAction(null);
    setWorkMessage("");
    setError(null);
    setResultFilter("exceptions");
    window.history.replaceState(null, "", "/account/batches/new");
  }

  const completedCount = batch ? batch.completedItemCount + batch.failedItemCount : 0;
  const visibleItems = useMemo(() => {
    if (!batch) return [];
    if (!TERMINAL_STATUSES.has(batch.status)) return batch.items;
    const hasExceptions = batch.items.some((item) => item.status === "failed" || item.verdict === "fail" || item.verdict === "review");
    const effectiveFilter = resultFilter === "exceptions" && !hasExceptions ? "all" : resultFilter;
    const rank = (item: PersistedBatchWithItems["items"][number]) => {
      if (item.status === "failed") return 0;
      if (item.verdict === "fail") return 1;
      if (item.verdict === "review") return 2;
      if (item.verdict === "pass") return 3;
      return 4;
    };
    return [...batch.items].filter((item) => {
      if (effectiveFilter === "all") return true;
      if (effectiveFilter === "errors") return item.status === "failed";
      if (effectiveFilter === "exceptions") return item.status === "failed" || item.verdict === "fail" || item.verdict === "review";
      return item.verdict === effectiveFilter;
    }).sort((a, b) => rank(a) - rank(b) || a.position - b.position);
  }, [batch, resultFilter]);

  return (
    <div className="account-shell batch-shell">
      <AccountWorkspaceNav />
      {batch ? <AccountBreadcrumbs items={[
        { href: "/account/batches", label: "Batches" },
        { label: "Batch status" },
      ]} /> : null}
      <header className="batch-heading">
        <div>
          <p className="eyebrow">Batch product check</p>
          <h1>Check one product against many images</h1>
          <p>Compare one product with many images, or map up to {batchItemLimit} explicit reference and candidate pairs.</p>
        </div>
        <Link className="secondary-link-button" href="/account/batches">View batch history</Link>
      </header>

      {!batch ? (
        <>
          <section className="account-section batch-upload-section" aria-labelledby="batch-upload-title">
            <p className="eyebrow">1. Choose workflow</p>
            <h2 id="batch-upload-title">How are these images mapped?</h2>
            <div className="batch-mode-control" role="group" aria-label="Batch mapping mode">
              <button aria-pressed={creationMode === "one_reference_many_candidates"} className={creationMode === "one_reference_many_candidates" ? "is-active" : ""} disabled={working} onClick={() => setCreationMode("one_reference_many_candidates")} type="button">
                <strong>One product, many images</strong><span>Recommended for one approved product and many candidates.</span>
              </button>
              <button aria-pressed={creationMode === "explicit_pairs"} className={creationMode === "explicit_pairs" ? "is-active" : ""} disabled={working} onClick={() => setCreationMode("explicit_pairs")} type="button">
                <strong>Many product pairs</strong><span>Map every reference directly to its candidate.</span>
              </button>
            </div>

            {creationMode === "one_reference_many_candidates" ? <div className="batch-upload-grid">
              <label className="batch-file-field">
                <strong>Approved reference</strong>
                <span>One image that represents the product you intend to show.</span>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  disabled={working}
                  onChange={(event) => { setReference(event.target.files?.[0] ?? null); setRetainedReferenceId(""); }}
                  type="file"
                />
                <small>{reference?.name ?? "No reference selected"}</small>
                {retainedReferences.length > 0 ? <select aria-label="Reuse a retained reference" disabled={working} onChange={(event) => { setRetainedReferenceId(event.target.value); if (event.target.value) setReference(null); }} value={retainedReferenceId}>
                  <option value="">Or reuse a recent reference</option>
                  {retainedReferences.map((saved) => <option key={saved.assetId} value={saved.assetId}>{saved.label} · last used {formatShortDate(saved.lastUsedAt)}</option>)}
                </select> : null}
                {retainedReferenceId ? <SavedReferencePreview reference={retainedReferences.find((saved) => saved.assetId === retainedReferenceId)} /> : null}
              </label>
              <label className="batch-file-field">
                <strong>Candidate images</strong>
                <span>Select 1-{batchItemLimit} generated, edited, or final images.</span>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  disabled={working}
                  multiple
                  onChange={(event) => {
                    selectCandidates(event.currentTarget.files);
                    event.currentTarget.value = "";
                  }}
                  type="file"
                />
                <small aria-live="polite">{candidates.length === 0 ? "No candidates selected" : `${candidates.length} candidate${candidates.length === 1 ? "" : "s"} selected. Choose more files to append.`}</small>
              </label>
              {candidates.length > 0 ? <div className="batch-candidate-list" aria-label="Selected candidate images">
                <div className="batch-candidate-actions">
                  <button disabled={working} onClick={() => setCandidates([])} type="button">Clear all</button>
                </div>
                {candidates.map((file, index) => <article className="batch-candidate-item" key={fileIdentity(file)}>
                  <CandidatePreview file={file} />
                  <div><strong>{file.name}</strong><small>{formatFileSize(file.size)}</small></div>
                  <button aria-label={`Remove ${file.name}`} disabled={working} onClick={() => removeCandidate(index)} type="button">Remove</button>
                </article>)}
              </div> : null}
            </div> : <div className="batch-pair-list">
              {pairs.map((pair, index) => <article className="batch-pair-row" key={pair.id}>
                <strong>Pair {index + 1}</strong>
                <label>Approved reference<input accept="image/jpeg,image/png,image/webp" disabled={working} onChange={(event) => updatePair(pair.id, "reference", event.target.files?.[0] ?? null)} type="file" /><small>{pair.reference?.name ?? "No reference selected"}</small></label>
                <label>Image to check<input accept="image/jpeg,image/png,image/webp" disabled={working} onChange={(event) => updatePair(pair.id, "candidate", event.target.files?.[0] ?? null)} type="file" /><small>{pair.candidate?.name ?? "No candidate selected"}</small></label>
                {pairs.length > 1 ? <button aria-label={`Remove pair ${index + 1}`} disabled={working} onClick={() => setPairs((current) => current.filter((entry) => entry.id !== pair.id))} type="button">Remove</button> : null}
              </article>)}
              <button className="secondary-link-button" disabled={working || pairs.length >= batchItemLimit} onClick={() => setPairs((current) => [...current, { id: crypto.randomUUID(), reference: null, candidate: null }])} type="button">Add another pair</button>
            </div>}
          </section>

          <section className="account-section batch-preflight" aria-labelledby="batch-preflight-title">
            <div>
              <p className="eyebrow">2. Review capacity</p>
              <h2 id="batch-preflight-title">Preflight</h2>
            </div>
            <dl className="batch-preflight-grid">
              <div><dt>Mapped checks</dt><dd>{plannedItemCount} / {batchItemLimit}</dd></div>
              <div><dt>Checks required</dt><dd>{plannedItemCount}</dd></div>
              <div><dt>Checks available</dt><dd>{availableCredits}</dd></div>
              <div><dt>Image retention</dt><dd>{retentionDays} days</dd></div>
            </dl>
            <p className="batch-retention-copy">Uploaded originals and analysis derivatives are deleted after your {retentionDays}-day retention period.</p>
            {error ? <p className="batch-error" role="alert">{error}</p> : null}
            <button className="batch-primary-button" disabled={Boolean(preflightError) || working || usableLimit < 1} onClick={() => void startBatch()} type="button">
              {working ? workMessage : `Start ${plannedItemCount || ""} batch check${plannedItemCount === 1 ? "" : "s"}`}
            </button>
          </section>
        </>
      ) : (
        <section aria-busy={working} className="account-section batch-status-section" aria-live="polite">
          <div className="batch-status-heading">
            <div>
              <p className="eyebrow">Batch status</p>
              <h2>{formatBatchStatus(batch.status)}</h2>
            </div>
            <strong>{completedCount} of {batch.itemCount} finished</strong>
          </div>
          {!TERMINAL_STATUSES.has(batch.status) ? (
            <button className="secondary-link-button batch-cancel-button" disabled={batchAction !== null} onClick={() => void updateBatch("cancel")} type="button">
              {batchAction === "cancel" ? "Canceling..." : "Cancel checks not yet started"}
            </button>
          ) : null}
          <div
            aria-label={`${completedCount} of ${batch.itemCount} checks finished`}
            aria-valuemax={batch.itemCount}
            aria-valuemin={0}
            aria-valuenow={completedCount}
            className="batch-progress"
            role="progressbar"
          >
            <span style={{ width: `${batch.itemCount === 0 ? 0 : (completedCount / batch.itemCount) * 100}%` }} />
          </div>
          {working ? <p className="batch-working-copy" role="status">{workMessage || "Checking candidate images..."} You can refresh or leave this page; the saved batch will continue.</p> : null}
          {error ? <p className="batch-error" role="alert">{error}</p> : null}

          {TERMINAL_STATUSES.has(batch.status) ? <div className="batch-result-tools">
            <div className="batch-filter-control" role="group" aria-label="Filter batch results">
              {(["exceptions", "all", "fail", "review", "pass", "errors"] as ResultFilter[]).map((filter) => (
                <button aria-pressed={resultFilter === filter} className={resultFilter === filter ? "is-active" : ""} key={filter} onClick={() => setResultFilter(filter)} type="button">{formatBatchStatus(filter)}</button>
              ))}
            </div>
            {csvExportEnabled ? <a className="secondary-link-button" download href={`/api/batches/${batch.id}/export`}>Export CSV</a> : <Link href="/account#billing-title">Upgrade for CSV export</Link>}
          </div> : null}

          <div className="batch-item-list">
            {visibleItems.length === 0 ? <p className="batch-empty-filter">No results match this filter.</p> : visibleItems.map((item) => (
              <article className={`batch-item-row batch-verdict-${item.verdict ?? item.status}`} key={item.id}>
                <div>
                  <strong>{item.clientLabel || `Candidate ${item.position + 1}`}</strong>
                  <span>{item.verdict ? item.verdict.toUpperCase() : formatBatchStatus(item.status)}{item.issueCount > 0 ? ` · ${item.issueCount} product difference${item.issueCount === 1 ? "" : "s"}` : ""}{item.limitationCount > 0 ? ` · ${item.limitationCount} review item${item.limitationCount === 1 ? "" : "s"}` : ""}</span>
                </div>
                {item.analysisId && item.status === "completed" ? <Link href={`/?analysis=${item.analysisId}`}>View result</Link> : null}
                {item.status === "failed" ? <button className="batch-item-retry" disabled={batchAction !== null} onClick={() => void updateBatch("retry", item.id)} type="button">{batchAction === item.id ? "Retrying..." : "Retry"}</button> : null}
                {item.terminalErrorMessage ? <small>{item.terminalErrorMessage}</small> : null}
              </article>
            ))}
          </div>

          {TERMINAL_STATUSES.has(batch.status) ? (
            <div className="batch-complete-actions">
              <button className="batch-primary-button" onClick={resetBatch} type="button">Start another batch</button>
              <Link className="secondary-link-button" href="/account">View account</Link>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}

async function uploadAsset(file: File, kind: "reference" | "candidate"): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("kind", kind);
  const response = await fetch("/api/assets/upload", { method: "POST", body: formData });
  const payload = await response.json() as AssetResponse & ApiErrorPayload;
  if (!response.ok || !payload.asset?.id) throw new Error(payload.message ?? `Could not upload ${file.name}.`);
  return payload.asset.id;
}

async function mapWithConcurrency<T, R>(
  values: readonly T[],
  concurrency: number,
  mapper: (value: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()));
  return results;
}

function formatBatchStatus(status: string): string {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

function fileIdentity(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function formatFileSize(bytes: number): string {
  return bytes < 1_000_000 ? `${Math.max(1, Math.round(bytes / 1_000))} KB` : `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function SavedReferencePreview({ reference }: { reference?: RetainedBatchReference }) {
  if (!reference) return null;
  return <div className="batch-saved-reference">
    <img alt={`Saved reference ${reference.label}`} src={reference.previewUrl} />
    <div><strong>{reference.label}</strong><small>Available until {formatShortDate(reference.retentionExpiresAt)}</small></div>
  </div>;
}

function CandidatePreview({ file }: { file: File }) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);
    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [file]);

  return previewUrl ? <img alt="" src={previewUrl} /> : <span aria-hidden="true" />;
}
