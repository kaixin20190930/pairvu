// Synthetic browser fixture only. Never exposes the real application or authentication.
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {build}=wranglerRequire('esbuild');
const bundled=await build({entryPoints:[resolve('fixtures/product-profiles/ui-entry.tsx')],bundle:true,platform:'browser',format:'iife',write:false,jsx:'automatic',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'synthetic-router',setup(b){b.onResolve({filter:/^next\/navigation$/},()=>({path:'router',namespace:'synthetic'}));b.onLoad({filter:/.*/,namespace:'synthetic'},()=>({contents:'export const useRouter=()=>({refresh(){}});'}));}}]});
const script=bundled.outputFiles[0].text;
const initial={profileSchemaVersion:1,name:'Latest server product',skuLabel:null,brand:null,variant:null,capacity:null,packagingVersion:null,criticalAttributes:[],allowedChanges:[]};
let profile=initial,revision=2,versionNumber=2,profileRequests=0;
const evidence={synthetic:true,unitId:'UPG-03',kind:'browser UI request log',sources:{},requests:[]};
for(const path of ['app/account/products/[productId]/ProductProfileClient.tsx','app/account/products/[productId]/PromoteReferenceClient.tsx','app/account/products/[productId]/SavedProductSettingsClient.tsx','fixtures/product-profiles/ui-entry.tsx','fixtures/product-profiles/ui-server.mjs'])evidence.sources[path]=createHash('sha256').update(await readFile(path)).digest('hex');
const path=resolve('fixtures/product-profiles/browser-request-log.json');
const server=createServer(async(request,response)=>{
  const url=new URL(request.url,'http://localhost');
  const json=(value,status=200)=>{response.writeHead(status,{'Content-Type':'application/json'});response.end(JSON.stringify(value));};
  if(url.pathname==='/app.js'){response.writeHead(200,{'Content-Type':'text/javascript'});response.end(script);return;}
  if(url.pathname==='/'){response.writeHead(200,{'Content-Type':'text/html'});response.end('<!doctype html><html><head><meta charset="utf-8"><title>Pairvu synthetic UI QA</title><style>body{font:16px system-ui;margin:24px;max-width:1000px}section{border:1px solid #ddd;padding:24px;margin:24px 0}label{display:flex;flex-direction:column;gap:6px;margin:10px 0}input,select,button{font:inherit;padding:8px}button{margin:8px 10px 8px 0}.product-settings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}fieldset{border:0}p{line-height:1.5}</style></head><body><div id="root"></div><script src="/app.js"></script></body></html>');return;}
  if(url.pathname.endsWith('/profile')&&request.method==='PUT'){
    let body='';for await(const chunk of request)body+=chunk;const data=JSON.parse(body);profileRequests++;
    const status=profileRequests===1?409:profileRequests===2?503:200;
    evidence.requests.push({method:'PUT',body:data,status});await writeFile(path,JSON.stringify(evidence,null,2)+'\n');
    if(status===409){json({error:'product_version_conflict',message:'Product information or reference changed. Your draft was kept.'},409);return;}
    if(status===503){json({error:'profile_storage_unavailable',message:'Synthetic interrupted save. Retry with the same request.'},503);return;}
    profile=data.profile;revision=3;versionNumber=3;json({mutationResult:{requestId:data.requestId,productId:'11111111-1111-4111-8111-111111111111',revision,profileVersionId:'44444444-4444-4444-8444-444444444444',profileVersionNumber:versionNumber,status:'active'},resumed:false});return;
  }
  if(url.pathname.endsWith('/profiles')){json({profiles:[],nextBeforeVersion:null});return;}
  if(url.pathname.startsWith('/api/products/')){json({product:{id:'11111111-1111-4111-8111-111111111111',name:profile.name,skuLabel:null,status:'active',revision,currentProfile:{versionId:'44444444-4444-4444-8444-444444444444',versionNumber,schemaVersion:1,source:'user_confirmed',createdAt:'2026-10-10T00:00:00.000Z',profile}}});return;}
  json({synthetic:true});
});
server.listen(0,'127.0.0.1',()=>console.log(`Synthetic UI: http://127.0.0.1:${server.address().port}`));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
