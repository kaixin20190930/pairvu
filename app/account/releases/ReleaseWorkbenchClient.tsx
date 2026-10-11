"use client";
import Link from "next/link";
import {useEffect,useRef,useState,type FormEvent} from "react";
import type {ReleasePage,ReleaseRow} from "@/lib/releases/types";
import styles from "./releases.module.css";
const initial={sku:"",productId:"",batchId:"",state:"all"};
const stateLabel=(value:string)=>value.replaceAll("_"," ");
export function ReleaseWorkbenchClient() {
  const [draft,setDraft]=useState(initial),[search,setSearch]=useState(initial),[cursor,setCursor]=useState(""),[page,setPage]=useState<ReleasePage|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[csvAllowed,setCsvAllowed]=useState(false),[exporting,setExporting]=useState(false),[exportError,setExportError]=useState(""),[exportNotice,setExportNotice]=useState(""),[retry,setRetry]=useState(0);
  const latest=useRef(0);
  useEffect(()=>{const controller=new AbortController();fetch("/api/releases/status",{cache:"no-store",signal:controller.signal}).then(async response=>{if(response.ok){const value=await response.json();if(!controller.signal.aborted)setCsvAllowed(value.csvExportEnabled===true);}}).catch(()=>{});return()=>controller.abort();},[]);
  useEffect(()=>{
    const controller=new AbortController(),sequence=++latest.current,params=query(search,cursor);
    fetch(`/api/releases?${params}`,{cache:"no-store",signal:controller.signal}).then(async response=>{const value=await response.json();if(!response.ok)throw new Error(value.message??"The release workbench could not be loaded.");if(!controller.signal.aborted&&sequence===latest.current)setPage(value);}).catch(cause=>{if(!controller.signal.aborted&&sequence===latest.current)setError(cause instanceof Error?cause.message:"The release workbench could not be loaded.");}).finally(()=>{if(!controller.signal.aborted&&sequence===latest.current)setLoading(false);});
    return()=>controller.abort();
  },[search,cursor,retry]);
  function beginSearch(){latest.current++;setLoading(true);setError("");setPage(null);setExportError("");setExportNotice("");}
  function submit(event:FormEvent){event.preventDefault();beginSearch();setCursor("");setSearch({...draft});setRetry(n=>n+1);}
  async function exportPage(){
    setExporting(true);setExportError("");setExportNotice("");const sequence=latest.current;
    try{const params=query(search,cursor);params.set("scope","page");const response=await fetch(`/api/releases/export?${params}`,{cache:"no-store"});if(!response.ok){const value=await response.json();throw new Error(value.message??"Export failed.");}const blob=await response.blob();if(sequence!==latest.current)return;const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="pairvu-release-page.csv";a.click();URL.revokeObjectURL(url);setExportNotice(response.headers.get("X-Release-Has-More")==="true"?"This bounded page was exported. More source records remain; continue the search to export later pages.":"This bounded page was exported; its cursor reached the end of the current search.");}
    catch(cause){if(sequence===latest.current)setExportError(cause instanceof Error?cause.message:"Export failed.");}finally{setExporting(false);}
  }
  return <div className={styles.workbench}>
    <header><p className="eyebrow">Release workbench</p><h1>Review release eligibility</h1><p>Compare the original machine result, current human decision and release rule. Eligibility does not publish your product.</p></header>
    <form onSubmit={submit} className={styles.filters} aria-label="Release search">
      <label>Frozen SKU<input name="sku" maxLength={80} value={draft.sku} onChange={e=>setDraft({...draft,sku:e.target.value})} placeholder="Exact SKU"/></label>
      <label>Product ID<input name="productId" maxLength={128} value={draft.productId} onChange={e=>setDraft({...draft,productId:e.target.value})}/></label>
      <label>Batch ID<input name="batchId" maxLength={128} value={draft.batchId} onChange={e=>setDraft({...draft,batchId:e.target.value})}/></label>
      <label>Review state<select name="state" value={draft.state} onChange={e=>setDraft({...draft,state:e.target.value})}><option value="all">All records</option><option value="pending_review">Needs review</option><option value="blocked">Blocked by rule</option><option value="decided">Current approve or reject</option></select></label>
      <button type="submit" disabled={loading}>Search</button>
    </form>
    {page?<section className={styles.policy} aria-label="Release rule"><strong>{page.policy.version}</strong><p>{page.policy.description}</p><details><summary>Rule and evaluation provenance</summary><p>Rule SHA-256: <code>{page.policy.hash}</code></p><p>Evaluated at {page.evaluatedAt}. Search pages use current decisions at request time.</p></details></section>:null}
    {loading?<p role="status">Loading release records…</p>:error?<div role="alert"><p>{error}</p><button onClick={()=>{beginSearch();setRetry(n=>n+1);}}>Retry</button></div>:page?<>
      <div className={styles.actions}><p>{page.rows.length} matching record{page.rows.length===1?"":"s"} in this page. Scanned {page.pagination.scanned} of at most {page.pagination.scanLimit} sources. Order: newest first, then analysis ID.</p><button onClick={exportPage} disabled={!csvAllowed||exporting}>{exporting?"Exporting…":"Export this search page (CSV)"}</button></div>
      {!csvAllowed?<p>CSV export requires an active paid plan.</p>:<p>Export is limited to this search window (up to 20 matches). It re-evaluates current decisions; later pages require another export.</p>}
      {exportError?<p role="alert">{exportError}</p>:null}{exportNotice?<p role="status">{exportNotice}</p>:null}
      <div className={styles.rows}>{page.rows.map(row=><ReleaseCard key={row.analysisId} row={row}/>)}</div>
      {!page.rows.length?<p role="status">{page.pagination.hasMore?"No matching records in this scan window. Continue searching remaining sources.":"No matching release records. Try another SKU, batch or review state."}</p>:null}
      <div className={styles.pagination}>{page.pagination.hasMore?<><p>More sources remain. This page is not a complete search result.{page.pagination.scanWindowExhausted?" The scan boundary was reached.":""}</p><button onClick={()=>{beginSearch();setCursor(page.pagination.nextCursor!);}}>Continue search</button></>:<p>End of the current search.</p>}{cursor?<button onClick={()=>{beginSearch();setCursor("");}}>Back to first page</button>:null}</div>
    </>:null}
  </div>;
}
function query(search:typeof initial,cursor:string){const p=new URLSearchParams({state:search.state,limit:"20"});for(const key of ["sku","productId","batchId"] as const)if(search[key])p.set(key,search[key]);if(cursor)p.set("cursor",cursor);return p;}
function ReleaseCard({row}:{row:ReleaseRow}) {
  return <article className={styles.card} aria-label={`Release record ${row.analysisId}`}>
    <div className={styles.source}><h2>{row.productSnapshot?.profile.name??"Analysis without a frozen product standard"}</h2><p>{row.productSnapshot?`Frozen SKU: ${row.productSnapshot.profile.skuLabel??"not recorded"} · standard v${row.productSnapshot.profileVersionNumber} · reference v${row.productSnapshot.referenceVersionNumber}`:"No frozen product identity is available."}</p><p>Analysis <code>{row.analysisId}</code>{row.batchId?<> · Batch <code>{row.batchId}</code></>:null}</p><Link href={`/?analysis=${encodeURIComponent(row.analysisId)}`}>View evidence and human review</Link></div>
    <div className={styles.columns}>
      <section><h3>Machine result</h3><strong>{row.machine.verdict?.toUpperCase()??"No verdict"}</strong><p>{stateLabel(row.machine.status)} · {row.machine.issueCount} product differences</p><p>Detection: {row.machine.qaEngineVersion??"unknown"}<br/>Risk: {row.machine.riskPolicyVersion??"unknown"}<br/>Model policy: {row.machine.modelPolicyVersion??"unknown"}</p>{row.machine.limitations.length?<ul>{row.machine.limitations.map((l,i)=><li key={i}>{l.type}: {l.message}</li>)}</ul>:null}<p>Reference image: {row.assets.referenceAvailable?"available":"unavailable"}<br/>Candidate image: {row.assets.candidateAvailable?"available":"unavailable"}</p></section>
      <section><h3>Human decision</h3><strong>{row.human.action?stateLabel(row.human.action):"No current decision"}</strong><p>Revision {row.human.revision}</p>{row.human.reason?<p>{row.human.reason}</p>:null}{row.human.action==="revoke"?<p>The previous decision was revoked.</p>:null}</section>
      <section><h3>Rule eligibility</h3><strong className={row.eligibility==="eligible"?styles.eligible:styles.blocked}>{stateLabel(row.eligibility)}</strong><ul>{row.reasons.map(reason=><li key={reason.code}>{reason.message}<small>{reason.code}</small></li>)}</ul><p>{row.policyVersion} · current evaluation</p></section>
    </div>
    <details><summary>Source and decision provenance</summary><p>Machine SHA-256: <code>{row.machine.sourceHash??"unavailable — bounded diagnostic source"}</code></p>{!row.machine.sourceComplete?<p>The full original source could not be read within supported limits and ownership boundaries. This record is blocked; its exported source is a bounded diagnostic snapshot.</p>:null}<p>Rule SHA-256: <code>{row.policyHash}</code></p><p>Reviewed machine snapshot: <code>{row.human.machineHash??"none"}</code></p><p>Evaluated at {row.evaluatedAt}; human revision {row.human.revision}.</p></details>
  </article>;
}
