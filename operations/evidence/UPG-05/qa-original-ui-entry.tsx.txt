import React,{act} from "react";
import {createRoot} from "react-dom/client";
import {ProductChecker} from "../../components/ProductChecker";
import {ReviewDecision} from "../../components/ReviewDecision";
import type {ReviewEvent,ReviewInput,ReviewState} from "../../lib/reviews/types";
import type {PersistedAnalysisResult} from "../../lib/analysis/types";

(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
const nativeFetch=globalThis.fetch.bind(globalThis),mode=new URLSearchParams(location.search).get("mode")??"desktop";
const root=document.getElementById("checker")!,cases:Array<Record<string,unknown>>=[],requests:Array<Record<string,unknown>>=[],errors:string[]=[];
window.addEventListener("error",e=>errors.push(e.message));
const tick=()=>new Promise(r=>setTimeout(r,30));
function check(value:unknown,message:string):asserts value {if(!value)throw new Error(message);}
async function main() {
  const machine:PersistedAnalysisResult=await (await nativeFetch("/result.json")).json();
  history.replaceState(null,"",`?mode=${mode}&analysis=${machine.id}`);
  const historyEvents:ReviewEvent[]=[];let failNext=false;const recorded=new Map<string,{payload:ReviewInput;event:ReviewEvent}>();
  const state=():ReviewState=>{const latest=historyEvents.at(-1)??null;return {revision:latest?.revision??0,latest,currentDecision:latest?.action==="revoke"?null:latest,history:structuredClone(historyEvents),historyLimit:100};};
  function append(payload:ReviewInput):ReviewEvent {const current=state();const event:ReviewEvent={...payload,id:crypto.randomUUID(),analysisId:machine.id,workspaceId:"synthetic-workspace",actorId:"synthetic-user",revision:current.revision+1,previousDecisionId:current.latest?.id??null,createdAt:new Date().toISOString(),machineSnapshot:{verdict:machine.verdict,qaEngineVersion:machine.qaEngineVersion},machineSha256:"synthetic"};historyEvents.push(event);recorded.set(payload.requestId,{payload:structuredClone(payload),event});return event;}
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#aaccee"/></svg>';
  globalThis.fetch=async(input,init)=>{
    const url=String(input),json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}});
    if(url.endsWith("/reviews")) {
      if(init?.method!=="POST"){requests.push({method:"GET"});return json({state:state()});}
      const payload:ReviewInput=JSON.parse(String(init.body)),old=recorded.get(payload.requestId);let status=200;
      let event:ReviewEvent|undefined;
      if(old)event=old.event;
      else if(payload.expectedRevision!==state().revision)status=409;
      else {event=append(payload);if(failNext){status=503;failNext=false;}}
      requests.push({method:"POST",payload:structuredClone(payload),status});
      if(status===409)return json({error:"review_revision_conflict",message:"A newer decision exists. Your draft was kept. Load latest and confirm."},409);
      if(status===503)return json({error:"review_storage_unavailable"},503);
      return json({event,state:state(),resumed:Boolean(old)});
    }
    if(url.startsWith("/api/analyses/"))return json({analysis:machine});
    if(url.startsWith("/api/assets/"))return new Response(svg,{headers:{"Content-Type":"image/svg+xml"}});
    if(url==="/api/runtime-config")return json({turnstileEnabled:false,analysisAcceptingNewRequests:true});
    throw new Error(`Unexpected synthetic request ${url}`);
  };
  const renderRoot=createRoot(root);await act(async()=>{renderRoot.render(<ProductChecker/>);await tick();});
  for(let i=0;i<30&&!root.querySelector('.human-review textarea');i++)await act(tick);
  const panel=()=>root.querySelector<HTMLElement>(".human-review")!;
  const reason=()=>panel().querySelector<HTMLTextAreaElement>('[aria-label="Review reason"]')!;
  const note=()=>panel().querySelector<HTMLTextAreaElement>('[aria-label="Review note"]')!;
  const action=()=>panel().querySelector<HTMLSelectElement>('[aria-label="Human decision"]')!;
  const button=(text:string)=>Array.from(panel().querySelectorAll<HTMLButtonElement>("button")).find(b=>b.textContent?.includes(text))!;
  async function enter(element:HTMLTextAreaElement|HTMLSelectElement,value:string) {await act(async()=>{Object.getOwnPropertyDescriptor(element instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLTextAreaElement.prototype,"value")!.set!.call(element,value);element.dispatchEvent(new Event(element instanceof HTMLSelectElement?"change":"input",{bubbles:true}));});}
  async function click(element:HTMLElement){await act(async()=>{element.click();await tick();});await act(tick);}
  async function test(name:string,fn:()=>unknown|Promise<unknown>){const detail=await fn();cases.push({name,status:"PASS",...(detail?{detail}:{})});}
  let failure:string|undefined;
  try {
    check(panel(),"Actual ProductChecker integrates human review for restored completed result");await act(tick);
    const originalMachine=Array.from(root.querySelectorAll('[aria-labelledby="verdict-title"],[aria-labelledby="differences-title"],[aria-labelledby="review-title"],[aria-labelledby="verified-title"],.analysis-provenance')).map(e=>e.textContent).join("\n");
    await test("restored actual ProductChecker displays separate machine verdict and human release disclaimer",()=>check(panel().textContent?.includes(`Machine verdict: ${machine.verdict}`)&&panel().textContent?.includes("does not establish release eligibility"),"Independent verdict disclaimer"));
    await test("reason required; old completed result has no invented human approval",()=>check(button("Record").disabled&&panel().textContent?.includes("None")&&panel().textContent?.includes("Revision 0"),"Empty history / required reason"));
    await test("approve with category/reason and HTML note appends visible escaped audit",async()=>{await enter(reason(),"Synthetic approval");await enter(note(),"<img src=x onerror=alert(1)>");await click(button("Record"));panel().querySelector("details")!.open=true;check(panel().textContent?.includes("Revision 1 · approve"),"Approval audit");check(panel().textContent?.includes("<img src=x onerror=alert(1)>")&&!panel().querySelector("img"),"Note plain text / no HTML node");});
    await test("reject is separate from the machine verdict",async()=>{await enter(action(),"reject");await enter(reason(),"Synthetic rejection");await click(button("Record"));check(panel().textContent?.includes("Revision 2 · reject"),"Reject audit");});
    await test("revoke appends history and clears only current human decision",async()=>{await enter(action(),"revoke");await enter(reason(),"Synthetic revoke");await click(button("Record"));check(panel().textContent?.includes("None")&&panel().textContent?.includes("Revision 3 · revoke")&&panel().textContent?.includes("Revision 1 · approve"),"Append-only revoke");});
    await test("explicit re-decision after revoke succeeds",async()=>{await enter(reason(),"Synthetic new approval");await click(button("Record"));check(panel().textContent?.includes("Revision 4 · approve"),"Reapprove after revoke");});
    append({requestId:crypto.randomUUID(),expectedRevision:4,action:"reject",category:"other",reason:"Synthetic concurrent owner decision",note:null});
    await test("409 preserves reason/note and blocks automatic new submission",async()=>{await enter(reason(),"Conflict draft remains");await enter(note(),"Conflict note remains");await click(button("Record"));check(reason().value==="Conflict draft remains"&&note().value==="Conflict note remains","Draft preserved");check(button("Record").disabled&&button("Load latest"),"Explicit refresh required");});
    await test("loading latest retains draft and requires explicit renewed confirmation",async()=>{const count=requests.filter(r=>r.method==="POST").length;await click(button("Load latest"));check(reason().value==="Conflict draft remains"&&panel().textContent?.includes("Revision 5"),"Latest revision / retained draft");check(button("Confirm draft")&&!button("Confirm draft").disabled,"Confirm control");check(requests.filter(r=>r.method==="POST").length===count,"No automatic POST on refresh");});
    await test("renewed confirmation uses latest revision and new request ID",async()=>{const previous=requests.filter(r=>r.method==="POST").at(-1)!.payload as ReviewInput;await click(button("Confirm draft"));const confirmed=requests.filter(r=>r.method==="POST").at(-1)!.payload as ReviewInput;check(confirmed.expectedRevision===5&&confirmed.requestId!==previous.requestId,"New explicit request at latest revision");});
    failNext=true;
    await test("503 uncertain outcome locks draft/new submission",async()=>{await enter(reason(),"Ambiguous response decision");await click(button("Record"));check(button("Retry same")&&reason().matches(":disabled")&&action().matches(":disabled"),"Only retry allowed");check(panel().textContent?.includes("Request ID:"),"Stable identity disclosed");});
    await test("retry after lost committed response reuses exact payload/key and adds no duplicate",async()=>{const first=requests.filter(r=>r.method==="POST").at(-1)!.payload,events=historyEvents.length;await click(button("Retry same"));const retry=requests.filter(r=>r.method==="POST").at(-1)!.payload;check(JSON.stringify(first)===JSON.stringify(retry),"Exact stable retry");check(historyEvents.length===events,"No duplicate event");});
    await test("all human actions leave actual machine evidence/provenance DOM unchanged",()=>check(Array.from(root.querySelectorAll('[aria-labelledby="verdict-title"],[aria-labelledby="differences-title"],[aria-labelledby="review-title"],[aria-labelledby="verified-title"],.analysis-provenance')).map(e=>e.textContent).join("\n")===originalMachine,"Machine evidence unchanged"));
    await test("anonymous component exposes no history or mutation controls and sends no review fetch",async()=>{const before=requests.length,container=document.getElementById("anonymous")!;await act(async()=>{createRoot(container).render(<ReviewDecision analysisId="anonymous-old" authenticated={false} machineVerdict="review"/>);await tick();});check(container.textContent?.includes("Sign in")&&!container.querySelector("button")&&requests.length===before,"Anonymous safe degradation");});
    await test("viewport layout has no human-panel horizontal overflow",()=>{const element=panel(),grid=getComputedStyle(element.querySelector(".review-form-grid")!).gridTemplateColumns;check(element.scrollWidth<=element.clientWidth+1,"Human panel overflow");if(mode==="narrow")check(grid.split(" ").length===1,"Narrow one-column form");return {viewport:innerWidth,panelWidth:element.clientWidth,scrollWidth:element.scrollWidth,columns:grid};});
    await test("no browser runtime errors",()=>check(errors.length===0,errors.join("\n")));
  } catch(error){failure=String(error);}
  const report={unitId:"UPG-05",synthetic:true,mode,status:failure?"FAIL":"PASS",cases,requests,errors,failure,limitations:["Actual ProductChecker/ReviewDecision React DOM; synthetic session/API only. Real D1 proof recorded separately."]};
  await nativeFetch("/__results",{method:"POST",body:JSON.stringify(report)});
  document.getElementById("summary")!.textContent=`${report.status}: ${cases.length} ${mode} human review cases${failure?` · ${failure}`:""}`;
}
void main();
