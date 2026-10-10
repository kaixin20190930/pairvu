import React,{act} from "react";
import {createRoot} from "react-dom/client";
import {StructuredEvidence} from "../../components/StructuredEvidence";
import {ProductChecker} from "../../components/ProductChecker";
import type {PersistedAnalysisResult} from "../../lib/analysis/types";
import type {ObservationEvidence} from "../../lib/domain/semantics";
import {unavailableRegion} from "../../lib/qa/evidence-regions";

(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
const nativeFetch=globalThis.fetch.bind(globalThis),mode=new URLSearchParams(location.search).get("mode")??"desktop";
const gallery=document.getElementById("gallery")!,checker=document.getElementById("checker")!;
const galleryRoot=createRoot(gallery),checkerRoot=createRoot(checker);
const cases:Array<{name:string;status:string;detail?:unknown}>=[],errors:string[]=[];
window.addEventListener("error",e=>errors.push(e.message));
const wait=()=>new Promise(r=>setTimeout(r,20));
function check(ok:unknown,message:string):asserts ok{if(!ok)throw new Error(message);}
function svg(width:number,height:number,label:string){return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#f3eadb"/><rect x="${width*.1}" y="${height*.2}" width="${width*.4}" height="${height*.3}" fill="#98b9dd"/><text x="8" y="24" fill="#17253d">Pairvu QA ${label}</text></svg>`;}
const referenceSvg=svg(320,160,"REFERENCE ALPHA"),candidateSvg=svg(120,240,"CANDIDATE BETA");
async function main(){
 const result:PersistedAnalysisResult=await (await nativeFetch('/result.json')).json();
 const evidence=result.observations[0].evidence,assets={referenceAssetId:result.referenceAssetId,candidateAssetId:result.candidateAssetId};
 const reference={assetId:assets.referenceAssetId,previewUrl:`data:image/svg+xml,${encodeURIComponent(referenceSvg)}`},candidate={assetId:assets.candidateAssetId,previewUrl:`data:image/svg+xml,${encodeURIComponent(candidateSvg)}`};
 globalThis.fetch=async(input)=>{
  const url=String(input);
  if(url.startsWith('/api/analyses/'))return new Response(JSON.stringify({analysis:result}));
  if(url.startsWith('/api/assets/'))return new Response(url.includes(assets.referenceAssetId)?referenceSvg:candidateSvg,{headers:{'Content-Type':'image/svg+xml'}});
  if(url==='/api/runtime-config')return new Response(JSON.stringify({turnstileEnabled:false,analysisAcceptingNewRequests:true}));
  throw new Error(`Unplanned synthetic request: ${url}`);
 };
 let epoch=0;
 async function render(next:ObservationEvidence=evidence,previews={reference,candidate}){await act(async()=>{galleryRoot.render(<StructuredEvidence key={++epoch} evidence={next} {...assets} {...previews}/>);await wait();});await act(async()=>{await wait();});}
 const boxes=()=>Array.from(gallery.querySelectorAll<HTMLElement>('.structured-evidence-box'));
 function geometry(){return Array.from(gallery.querySelectorAll('figure')).map((figure,i)=>{const image=figure.querySelector('img')!,box=figure.querySelector<HTMLElement>('.structured-evidence-box')!,ir=image.getBoundingClientRect(),br=box.getBoundingClientRect(),expected=i===0?{x:.1,y:.2,width:.4,height:.3}:{x:.25,y:.4,width:.5,height:.2};const actual={x:(br.left-ir.left)/ir.width,y:(br.top-ir.top)/ir.height,width:br.width/ir.width,height:br.height/ir.height};for(const key of ['x','y','width','height'] as const)check(Math.abs(actual[key]-expected[key])<.003,`${mode} ${i} ${key} mapping wrong`);check(image.naturalWidth===(i===0?320:120)&&image.naturalHeight===(i===0?160:240),'Distinct image dimensions');return {side:i===0?'reference':'candidate',natural:[image.naturalWidth,image.naturalHeight],display:[ir.width,ir.height],boxFractions:actual};});}
 async function test(name:string,fn:()=>unknown|Promise<unknown>){const detail=await fn();cases.push({name,status:'PASS',...(detail?{detail}:{})});}
 let failure:string|undefined;
 try{
  await render();
  await test('both corresponding images show legal regions using their own aspect ratios',()=>{check(boxes().length===2,'Two boxes');return geometry();});
  await test('medium location is visibly approximate; confidence is not a calibrated probability',()=>{check(boxes()[1].classList.contains('approximate'),'Medium must be dashed');check(gallery.textContent?.includes('not a calibrated probability'),'Confidence disclaimer');});
  await test('150 percent image zoom preserves normalized box mapping',async()=>{await act(async()=>{for(const slider of gallery.querySelectorAll<HTMLInputElement>('input[type="range"]')){Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(slider,'150');slider.dispatchEvent(new Event('input',{bubbles:true}));}});check(gallery.textContent?.includes('150%'),'Real zoom input event');return geometry();});
  await test('explicit null/non-visible evidence draws no default full-image boxes',async()=>{await render({...evidence,regions:{schemaVersion:1,reference:unavailableRegion(assets.referenceAssetId,'not_visible'),candidate:unavailableRegion(assets.candidateAssetId,'cannot_locate')}});check(boxes().length===0&&gallery.textContent?.includes('not visible')&&gallery.textContent?.includes('could not be located reliably'),'Null reasons visible');});
  await test('legacy boundingRegions are not silently interpreted as normalized coordinates',async()=>{await render({referenceObservation:'Old expected',candidateObservation:'Old observed',boundingRegions:[{assetId:assets.referenceAssetId,x:20,y:10,width:50,height:50}]});check(boxes().length===0&&gallery.textContent?.includes('Region not recorded'),'Legacy not recorded');});
  await test('malformed coordinates/extra fields/wrong asset safely show explicit invalid region',async()=>{await render({...evidence,regions:{schemaVersion:1,reference:{...evidence.regions!.reference,assetId:'foreign'},candidate:{...evidence.regions!.candidate,region:{x:-1,y:0,width:1,height:1}}}});check(boxes().length===0&&gallery.textContent?.includes('Region data is invalid'),'Invalid fallback');});
  await test('unavailable and mismatched preview never displays an overlay on a different image',async()=>{await render(evidence,{reference:{...reference,assetId:'different'},candidate:{...candidate,previewUrl:''}});check(boxes().length===0&&gallery.querySelectorAll('img').length===0,'No incorrect preview');check(gallery.textContent?.includes('Recorded evidence remains readable'),'Readable unavailable state');});
  await render();
  await test('responsive layout is two columns on desktop and one at a real narrow frame viewport',()=>{const columns=getComputedStyle(gallery.querySelector('.structured-evidence-grid')!).gridTemplateColumns.trim().split(/\s+/).length;check(columns===(mode==='narrow'?1:2),`Unexpected ${mode} columns ${columns}`);if(mode==='narrow')check(innerWidth<=400,'Narrow frame width');return {mode,viewport:[innerWidth,innerHeight],columns};});
  history.replaceState(null,'',`?mode=${mode}&analysis=${result.id}`);
  await act(async()=>{checkerRoot.render(<ProductChecker/>);await wait();});
  for(let n=0;n<30&&!checker.querySelector('.result-stack');n++)await act(async()=>{await wait();});
  await test('actual ProductChecker restores serialized result and displays both evidence sides/severity/versions',()=>{check(checker.querySelector('.result-stack'),'Real result page restored');check(checker.textContent?.includes('Critical')&&checker.textContent?.includes('High confidence'),'Severity/confidence kept');check(checker.textContent?.includes('Reference: observable')&&checker.textContent?.includes('Coverage: sufficient'),'Observability/coverage retained');check(checker.textContent?.includes('baseline-prompt+regions-001')&&checker.textContent?.includes('m0-qa-engine-007'),'Provenance kept');check(checker.querySelectorAll('.structured-evidence-box').length===2,'Result page boxes');});
  await test('malformed/missing regions never crash the actual React browser components',()=>check(errors.length===0,errors.join(';')));
 }catch(error){failure=error instanceof Error?error.stack:String(error);}
 const report={unitId:'UPG-04',synthetic:true,mode,status:failure?'FAIL':'PASS',cases,failure,limitations:['Actual React components and native DOM inputs in browser; controlled auth/analytics/fetch boundary. Synthetic SVGs intentionally have different dimensions; not a model accuracy or real API journey.'],completedAt:new Date().toISOString()};
 document.getElementById('summary')!.textContent=`${report.status}: ${cases.length} ${mode} component cases`;
 await nativeFetch('/__results',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report)});
 if(mode==='desktop'){const frame=document.createElement('iframe');frame.title='Narrow viewport component verification';frame.width='375';frame.height='1500';frame.src='/?mode=narrow';document.getElementById('narrow')!.append(frame);}
}
void main();
