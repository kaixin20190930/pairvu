import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { ProductProfileClient } from "../../app/account/products/[productId]/ProductProfileClient";
import type { SavedProductDetail, ProductProfile } from "../../lib/products/types";

(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
const nativeFetch=globalThis.fetch.bind(globalThis);
const container=document.getElementById("root")!;
const root=createRoot(container);
const profile:ProductProfile={profileSchemaVersion:1,name:"Pairvu QA lifecycle",skuLabel:null,brand:null,variant:null,capacity:null,packagingVersion:null,criticalAttributes:[],allowedChanges:[]};
function product(revision:number,status:"active"|"archived"="active",name=profile.name):SavedProductDetail {
  return {id:"11111111-1111-4111-8111-111111111111",workspaceId:"22222222-2222-4222-8222-222222222222",name,skuLabel:null,status,archivedAt:status==="archived"?"2026-10-10T00:00:00.000Z":null,revision,profileState:"versioned",currentProfile:{versionId:"33333333-3333-4333-8333-333333333333",versionNumber:revision,schemaVersion:1,source:"user_confirmed",createdAt:"2026-10-10T00:00:00.000Z",profile:{...profile,name}},currentReference:null,currentReferences:[],referenceVersions:[],referenceVersionCount:0,batchCount:0,lastBatchAt:null,batches:[],createdAt:"2026-10-10T00:00:00.000Z",updatedAt:"2026-10-10T00:00:00.000Z"};
}
let server=product(1),epoch=0;
const requests:Array<{body:string;status:number}>=[];
let outcomes:number[]=[],heldGet:(()=>Promise<SavedProductDetail>)|null=null;
const cases:Array<{name:string;status:string}>=[];
function check(ok:unknown,message:string):asserts ok {if(!ok)throw new Error(message);}
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json"}});
globalThis.fetch=async(input,init)=>{
  const url=String(input);
  if(url.endsWith("/profile")&&init?.method==="PUT") {
    const body=String(init.body),data=JSON.parse(body);
    const status=outcomes.shift()??(data.expectedVersion!==server.revision?409:200);
    requests.push({body,status});
    if(status!==200)return json({message:status===409?"Synthetic revision conflict":"Synthetic interrupted save"},status);
    server={...product(server.revision+1),currentProfile:{...server.currentProfile!,versionNumber:server.currentProfile!.versionNumber+1,profile:{...data.profile,name:data.profile.name.trim()}}};
    return json({mutationResult:{revision:server.revision,profileVersionNumber:server.currentProfile!.versionNumber}});
  }
  if(url.endsWith("/profiles"))return json({profiles:[],nextBeforeVersion:null});
  if(url.startsWith("/api/products/"))return json({product:heldGet?await heldGet():server});
  return nativeFetch(input,init);
};
async function props(next:SavedProductDetail){await act(async()=>{root.render(<ProductProfileClient key={epoch} product={next} enabled/>);});}
async function mount(next=product(1)){epoch++;server=next;outcomes=[];heldGet=null;await props(next);}
const nameInput=()=>container.querySelector<HTMLInputElement>('input[maxlength="120"]')!;
const fieldset=()=>container.querySelector('fieldset')!;
const button=(label:string)=>Array.from(container.querySelectorAll('button')).find(b=>b.textContent===label);
const saveButton=()=>Array.from(container.querySelectorAll('button')).find(b=>b.textContent?.includes("Save product standard")||b.textContent?.includes("Confirm and save"));
async function click(target:HTMLButtonElement|undefined){check(target&&!target.disabled,"Clickable button required");await act(async()=>{target.click();await new Promise(r=>setTimeout(r,0));});}
async function edit(value:string){await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")!.set!.call(nameInput(),value);nameInput().dispatchEvent(new Event('input',{bubbles:true}));});check(nameInput().value===value,"Actual controlled input edit failed");}
async function nextServer(next:SavedProductDetail){server=next;await props(next);}
async function test(name:string,run:()=>Promise<void>){await run();cases.push({name,status:"PASS"});}
function deferred(){let resolve!:(value:SavedProductDetail)=>void;const promise=new Promise<SavedProductDetail>(r=>resolve=r);return {promise,resolve};}
async function run() {
  let failure:string|undefined;
  try {
    await test("same mounted active editor archives immediately, restores and saves at new revision",async()=>{
      await mount();await nextServer(product(2,"archived"));check(fieldset().disabled&&!saveButton(),"Archive must disable editor");await nextServer(product(3));check(!fieldset().disabled,"Restore must enable editor");await edit("Restored draft");await click(saveButton());check(JSON.parse(requests.at(-1)!.body).expectedVersion===3&&requests.at(-1)!.status===200,"Pristine lifecycle revision must advance safely");
    });
    await test("editor initially mounted archived restores without page reload",async()=>{
      await mount(product(4,"archived"));check(fieldset().disabled,"Initially archived");await nextServer(product(5));check(!fieldset().disabled,"Restored without remount");await edit("After archived mount");await click(saveButton());check(JSON.parse(requests.at(-1)!.body).expectedVersion===5,"Restored base revision");
    });
    await test("dirty draft survives archive/restore and requires explicit fresh review",async()=>{
      await mount();await edit("Keep this unsaved draft");const start=requests.length;await nextServer(product(2,"archived"));check(fieldset().disabled&&nameInput().value==="Keep this unsaved draft","Archive keeps draft");await nextServer(product(3));check(!fieldset().disabled&&saveButton()?.disabled,"Restore must not silently rebase dirty draft");check(requests.length===start,"Refresh must not submit");await click(button("Load latest and keep draft"));check(nameInput().value==="Keep this unsaved draft","Manual review preserves draft");await click(saveButton());check(JSON.parse(requests.at(-1)!.body).expectedVersion===3&&requests.at(-1)!.status===200,"Reviewed restore can save");
    });
    await test("409 remains blocked across new props until manual GET and confirmation",async()=>{
      await mount();server=product(2);await edit("409 retained");await click(saveButton());const old=JSON.parse(requests.at(-1)!.body);check(requests.at(-1)!.status===409,"Need actual 409");await nextServer(product(3));check(saveButton()?.disabled&&nameInput().value==="409 retained","Props must not clear conflict");await click(button("Load latest and keep draft"));await click(saveButton());const fresh=JSON.parse(requests.at(-1)!.body);check(fresh.expectedVersion===3&&fresh.requestId!==old.requestId,"Manual intent receives new UUID");
    });
    await test("503 retry keeps exact UUID/body despite newer props, then 409 requires review",async()=>{
      await mount();await edit("503 retained");outcomes=[503];await click(saveButton());const old=requests.at(-1)!.body;await nextServer(product(2));check(nameInput().value==="503 retained"&&!saveButton()?.disabled,"Pending intent remains retryable");await click(saveButton());check(requests.at(-1)!.body===old&&requests.at(-1)!.status===409,"Must retry original body rather than silently rebase");await click(button("Load latest and keep draft"));await click(saveButton());check(JSON.parse(requests.at(-1)!.body).requestId!==JSON.parse(old).requestId,"Fresh reviewed request key");
    });
    await test("503 unchanged-revision retry is byte-identical and successful",async()=>{
      await mount();await edit("  Canonical saved name  ");outcomes=[503,200];await click(saveButton());const old=requests.at(-1)!.body;await click(saveButton());check(requests.at(-1)!.body===old&&nameInput().value==="Canonical saved name","Retry identity and saved canonical input");
    });
    await test("out-of-order props cannot regress lifecycle or submission revision",async()=>{
      await mount();await nextServer(product(5,"archived"));await props(product(4));check(fieldset().disabled,"Stale active props must not reopen archived editor");await nextServer(product(6));await props(product(5,"archived"));check(!fieldset().disabled,"Stale archived props must not disable restored editor");await edit("Monotonic revision");await click(saveButton());check(JSON.parse(requests.at(-1)!.body).expectedVersion===6,"Stale props cannot regress expected revision");
    });
    await test("late manual GET cannot roll back fresher archived props or permit confirmation",async()=>{
      await mount();server=product(2);await edit("Late GET draft");await click(saveButton());const delayed=deferred();heldGet=()=>delayed.promise;await click(button("Load latest and keep draft"));await nextServer(product(4,"archived"));await act(async()=>{delayed.resolve(product(2));await new Promise(r=>setTimeout(r,0));});heldGet=null;check(fieldset().disabled&&!button("Confirm and save retained draft")&&nameInput().value==="Late GET draft","Stale GET stays archived/conflicted");await nextServer(product(5));check(saveButton()?.disabled,"Restore still requires fresh manual read");await click(button("Load latest and keep draft"));await click(saveButton());check(JSON.parse(requests.at(-1)!.body).expectedVersion===5,"Fresh GET restores valid confirmation");
    });
    await test("late post-save GET cannot resurrect editor after newer archive",async()=>{
      await mount();await edit("Saved before archive");const delayed=deferred();heldGet=()=>delayed.promise;await click(saveButton());check(requests.at(-1)!.status===200,"Save accepted");const saved=server;await nextServer(product(3,"archived"));await act(async()=>{delayed.resolve(saved);await new Promise(r=>setTimeout(r,0));});heldGet=null;check(fieldset().disabled&&nameInput().value==="Saved before archive","Late successful-save read must not regress state");await nextServer(product(4));check(saveButton()?.disabled,"Later restore must not skip newest review");
    });
    await test("new profile props update pristine draft, but preserve dirty draft and invalidate reviewed confirmation",async()=>{
      await mount();await nextServer(product(2,"active","Server profile two"));check(nameInput().value==="Server profile two","Pristine draft follows new saved profile");await edit("Personal retained draft");await nextServer(product(3,"active","Server profile three"));check(nameInput().value==="Personal retained draft"&&saveButton()?.disabled,"Dirty draft retained");await click(button("Load latest and keep draft"));check(!saveButton()?.disabled,"Manual review permits confirmation");await nextServer(product(4,"active","Server profile four"));check(saveButton()?.disabled&&!button("Confirm and save retained draft"),"New props invalidate old manual review");await click(button("Load latest and keep draft"));await click(button("Use this saved standard as my draft"));check(nameInput().value==="Server profile four","Explicit adoption allowed");await click(saveButton());check(JSON.parse(requests.at(-1)!.body).expectedVersion===4,"Explicit adoption uses reviewed revision");
    });
  }catch(error){failure=error instanceof Error?error.stack:String(error);}
  const evidence={unitId:"UPG-03-LIFECYCLE-FIX",synthetic:true,kind:"Actual React component in browser; native DOM input/click events, act, controlled fetch/router boundary",status:failure?"FAIL":"PASS",cases,requests,failure,completedAt:new Date().toISOString()};
  await nativeFetch('/__results',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(evidence)});
  await act(async()=>root.unmount());
  container.textContent=JSON.stringify(evidence,null,2);
}
void run();
