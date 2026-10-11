"use client";
import {useEffect, useRef, useState} from "react";
import {REVIEW_CATEGORIES, type ReviewInput, type ReviewState} from "@/lib/reviews/types";

export function ReviewDecision({analysisId,authenticated,machineVerdict}:{analysisId:string;authenticated:boolean;machineVerdict:string|null}) {
  const [state,setState]=useState<ReviewState|null>(null),[action,setAction]=useState<ReviewInput["action"]>("approve"),[category,setCategory]=useState<ReviewInput["category"]>("other"),[reason,setReason]=useState(""),[note,setNote]=useState("");
  const [phase,setPhase]=useState<"loading"|"ready"|"sending"|"uncertain"|"conflict"|"confirm"|"unavailable">("loading"),[message,setMessage]=useState("");
  const [pendingRequestId,setPendingRequestId]=useState<string|null>(null);
  const pending=useRef<ReviewInput|null>(null),url=`/api/analyses/${encodeURIComponent(analysisId)}/reviews`;
  useEffect(()=>{
    if(!authenticated) return;
    let active=true; const abort=new AbortController();
    void fetch(url,{cache:"no-store",signal:abort.signal}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.message??"Review history is unavailable.");if(active){setState(data.state);setPhase("ready");}}).catch(error=>{if(active){setPhase("unavailable");setMessage(error instanceof Error?error.message:"Review history is unavailable.");}});
    return()=>{active=false;abort.abort();};
  },[authenticated,url]);
  const locked=phase==="sending"||phase==="uncertain";
  async function loadLatest() {
    const conflicted=phase==="conflict"||phase==="confirm"; setPhase("loading");
    try {
      const response=await fetch(url,{cache:"no-store"}),data=await response.json();
      if(!response.ok)throw new Error(data.message??"Review history is unavailable.");
      setState(data.state);setPhase(conflicted?"confirm":"ready");
      setMessage(conflicted?"Latest history loaded. Your draft was kept. Review the current decision, then explicitly confirm this draft.":"Latest review history loaded.");
    } catch(error) {setPhase(conflicted?"conflict":"unavailable");setMessage(error instanceof Error?error.message:"Could not load history.");}
  }
  async function send(retry=false) {
    if(phase==="sending"||(!retry&&(pending.current||(phase!=="ready"&&phase!=="confirm"))))return;
    const payload=retry?pending.current:{requestId:crypto.randomUUID(),expectedRevision:state?.revision??0,action,category,reason,note:note.trim()||null};
    if(!payload)return; pending.current=payload;setPendingRequestId(payload.requestId);setPhase("sending");setMessage("Saving decision…");
    try {
      const response=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}),data=await response.json();
      if(response.status===503 || response.status>=500) {setPhase("uncertain");setMessage("Decision status is uncertain. Retry the same request before making any other decision.");return;}
      if(response.status===409) {pending.current=null;setPhase("conflict");setMessage(data.message??"A newer decision exists. Your draft was kept. Load the latest history before confirming again.");return;}
      if(!response.ok) {pending.current=null;setPhase("ready");setMessage(data.message??"The decision was rejected. Your draft was kept.");return;}
      pending.current=null;setState(data.state);setPhase("ready");setReason("");setNote("");setAction("approve");setMessage("Human decision recorded. The machine result is unchanged.");
    } catch {setPhase("uncertain");setMessage("Decision status is uncertain. Retry the same request before making any other decision.");}
  }
  return <section className="state-panel human-review" aria-labelledby={`human-review-${analysisId}`}>
    <p className="section-label">Human review</p><h2 id={`human-review-${analysisId}`}>Independent human decision</h2>
    <p>Machine verdict: <strong>{machineVerdict??"Not recorded"}</strong>. Human approval does not establish release eligibility.</p>
    {!authenticated?<p>Sign in with the account that owns this analysis to view or record human decisions.</p>:<>
      <p>Current human decision: <strong>{state?.currentDecision?.action??"None"}</strong> · Revision {state?.revision??0}</p>
      {state?.latest?.action==="revoke"?<p>The previous decision was revoked. Its audit history is retained.</p>:null}
      {message?<p role="status">{message}</p>:null}
      <fieldset disabled={locked||phase==="loading"||phase==="unavailable"}>
        <legend>Decision draft</legend><div className="review-form-grid">
          <label>Decision<select aria-label="Human decision" value={action} onChange={e=>setAction(e.target.value as ReviewInput["action"])}><option value="approve">Approve</option><option value="reject">Reject</option><option value="revoke" disabled={!state?.currentDecision}>Revoke current decision</option></select></label>
          <label>Reason category<select aria-label="Review category" value={category} onChange={e=>setCategory(e.target.value as ReviewInput["category"])}>{REVIEW_CATEGORIES.map(c=><option key={c} value={c}>{c.replaceAll("_"," ")}</option>)}</select></label>
          <label>Reason (required, up to 1000 characters)<textarea aria-label="Review reason" value={reason} maxLength={1000} onChange={e=>setReason(e.target.value)}/></label>
          <label>Optional note (up to 2000 characters)<textarea aria-label="Review note" value={note} maxLength={2000} onChange={e=>setNote(e.target.value)}/></label>
        </div>
      </fieldset>
      <div className="feedback-row">
        {phase==="uncertain"?<button type="button" onClick={()=>void send(true)}>Retry same decision request</button>:<button type="button" disabled={!state||!reason.trim()||!["ready","confirm"].includes(phase)||(action==="revoke"&&!state.currentDecision)} onClick={()=>void send()}>{phase==="confirm"?"Confirm draft against latest revision":"Record human decision"}</button>}
        <button type="button" className="secondary-button" disabled={locked||phase==="loading"} onClick={()=>void loadLatest()}>{phase==="conflict"?"Load latest decision and keep draft":"Refresh review history"}</button>
      </div>
      {phase==="uncertain"?<p>Draft locked until the request outcome is resolved. Request ID: {pendingRequestId}</p>:null}
      <details><summary>Audit history · latest {state?.history.length??0} of up to 100 events</summary><ol className="review-history">{state?.history.map(event=><li key={event.id}><strong>Revision {event.revision} · {event.action}</strong><p>{event.category.replaceAll("_"," ")} · {event.reason}</p>{event.note?<p>{event.note}</p>:null}<p className="muted">Actor {event.actorId} · {event.createdAt}</p><p className="muted">Machine source: {String(event.machineSnapshot.verdict??"Not recorded")} · {String(event.machineSnapshot.qaEngineVersion??"Not recorded")}</p></li>)}</ol></details>
    </>}
  </section>;
}
