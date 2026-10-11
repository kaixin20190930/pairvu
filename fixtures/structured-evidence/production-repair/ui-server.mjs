import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {build}=wranglerRequire('esbuild');
const stubs={
 '@/lib/analytics/client':'export const getAnonymousSessionId=()=>"00000000-0000-4000-8000-000000000001";export const captureAcquisitionContext=()=>({pageViewId:"synthetic",attribution:{}});export const trackProductEvent=async()=>{};export const sizeBucket=()=>"small";',
 '@/lib/billing/client-context':'export const useBillingContext=()=>({authenticated:false});',
 '@/components/ActivationAnalytics':'import React from "react";export const ActivationView=()=>null;export const ActivationLink=({children,href})=>React.createElement("a",{href},children);',
 '@/components/TurnstileWidget':'export const TurnstileWidget=()=>null;',
 'next/link':'import React from "react";export default ({children,href})=>React.createElement("a",{href},children);',
};
const bundled=await build({entryPoints:[resolve('fixtures/structured-evidence/production-repair/ui-entry.tsx')],bundle:true,platform:'browser',format:'iife',write:false,jsx:'automatic',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'synthetic-boundaries',setup(b){b.onResolve({filter:/^(@\/|next\/link$)/},a=>stubs[a.path]?{path:a.path,namespace:'synthetic'}:undefined);b.onLoad({filter:/.*/,namespace:'synthetic'},a=>({contents:stubs[a.path],loader:'js',resolveDir:resolve('.')}));}}]});
const sources={};for(const path of ['components/StructuredEvidence.tsx','components/ProductChecker.tsx','lib/qa/evidence-regions.ts','lib/qa/identity-evidence.ts','app/globals.css','fixtures/structured-evidence/production-repair/ui-entry.tsx','fixtures/structured-evidence/production-repair/ui-server.mjs','fixtures/structured-evidence/production-repair/persisted-result.json'])sources[path]=createHash('sha256').update(await readFile(path)).digest('hex');
const modes=new Set();
const server=createServer(async(req,res)=>{
 if(req.url==='/app.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(bundled.outputFiles[0].text);return;}
 if(req.url==='/style.css'){res.writeHead(200,{'Content-Type':'text/css'});res.end(await readFile('app/globals.css'));return;}
 if(req.url==='/counterexample.json'){res.writeHead(200,{'Content-Type':'application/json'});res.end(await readFile('fixtures/structured-evidence/production-repair/persisted-counterexample.json'));return;}
 if(req.url==='/result.json'){res.writeHead(200,{'Content-Type':'application/json'});res.end(await readFile('fixtures/structured-evidence/production-repair/persisted-result.json'));return;}
 if(req.url==='/__results'&&req.method==='POST'){let body='';for await(const c of req)body+=c;const report={...JSON.parse(body),sources};await writeFile(resolve(`fixtures/structured-evidence/production-repair/browser-${report.mode}-results.json`),JSON.stringify(report,null,2)+'\n');modes.add(report.mode);res.end('recorded');console.log(`${report.status}: ${report.cases.length} ${report.mode} cases`);if(modes.size===2){clearTimeout(lifetime);server.close(()=>console.log('Both viewport reports saved; fixture server closed.'));}return;}
 res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><html><head><meta charset="utf-8"><title>Pairvu structured evidence local QA</title><link rel="stylesheet" href="/style.css"><style>body{padding:24px}#gallery,#summary{max-width:1000px;margin:auto}#gallery{margin:24px auto}#narrow iframe{max-width:100%;border:1px solid #ccd}#summary{font-weight:bold}</style></head><body><h1>Pairvu QA · unverified regions withheld</h1><p>Conservative production repair: raw proposals retained, no location accuracy claim.</p><p id="summary">Running component checks…</p><div id="gallery"></div><div id="checker"></div><div id="narrow"></div><script src="/app.js"></script></body></html>');
});
const lifetime=setTimeout(()=>server.close(),3600000);
server.listen(0,'127.0.0.1',()=>console.log(`Structured evidence fixture: http://127.0.0.1:${server.address().port}`));
process.on('SIGTERM',()=>{clearTimeout(lifetime);server.close();});
