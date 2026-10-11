import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),wr=createRequire(require.resolve('wrangler/package.json'));
const stubs={
 '@/lib/analytics/client':'export const getAnonymousSessionId=()=>"00000000-0000-4000-8000-000000000001";export const captureAcquisitionContext=()=>({pageViewId:"synthetic",attribution:{}});export const trackProductEvent=async()=>{};export const sizeBucket=()=>"small";',
 '@/lib/billing/client-context':'export const useBillingContext=()=>({authenticated:true,available:10});',
 '@/components/ActivationAnalytics':'import React from "react";export const ActivationView=()=>null;export const ActivationLink=({children,href})=>React.createElement("a",{href},children);',
 '@/components/TurnstileWidget':'export const TurnstileWidget=()=>null;',
 'next/link':'import React from "react";export default ({children,href})=>React.createElement("a",{href},children);',
};
const bundled=await wr('esbuild').build({entryPoints:[resolve('fixtures/review-decisions/ui-entry.tsx')],bundle:true,platform:'browser',format:'iife',write:false,jsx:'automatic',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'synthetic-boundaries',setup(b){b.onResolve({filter:/^(@\/|next\/link$)/},a=>stubs[a.path]?{path:a.path,namespace:'synthetic'}:undefined);b.onLoad({filter:/.*/,namespace:'synthetic'},a=>({contents:stubs[a.path],loader:'js',resolveDir:resolve('.')}));}}]});
const sources={};for(const p of ['components/ReviewDecision.tsx','components/ProductChecker.tsx','app/globals.css','fixtures/review-decisions/ui-entry.tsx','fixtures/review-decisions/ui-server.mjs'])sources[p]=createHash('sha256').update(await readFile(p)).digest('hex');
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/app.js'){res.setHeader('Content-Type','text/javascript');res.end(bundled.outputFiles[0].text);return;}
 if(url.pathname==='/style.css'){res.setHeader('Content-Type','text/css');res.end(await readFile('app/globals.css'));return;}
 if(url.pathname==='/result.json'){res.setHeader('Content-Type','application/json');res.end(await readFile('fixtures/structured-evidence/protocol-identity-repair/persisted-result.json'));return;}
 if(url.pathname==='/__results'&&req.method==='POST'){let body='';for await(const chunk of req)body+=chunk;const report={...JSON.parse(body),sources};await writeFile(resolve(`fixtures/review-decisions/browser-${report.mode}-results.json`),JSON.stringify(report,null,2)+'\n');res.end('recorded');console.log(`${report.status}: ${report.cases.length} ${report.mode} cases`);return;}
 res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html><head><meta charset="utf-8"><title>Pairvu synthetic human review QA</title><link rel="stylesheet" href="/style.css"><style>body{padding:16px;margin:0}#checker{max-width:1080px;margin:auto}#narrow iframe{width:375px;max-width:100%;height:1200px;border:1px solid #aaa}</style></head><body><h1>Pairvu human review · synthetic QA</h1><p id="summary">Running actual component checks…</p><div id="checker"></div><div id="anonymous"></div>${url.searchParams.get('mode')==='narrow'?'':'<div id="narrow"><h2>375px iframe</h2><iframe src="/?mode=narrow"></iframe></div>'}<script src="/app.js"></script></body></html>`);
});
server.listen(0,'127.0.0.1',()=>console.log(`Review component fixture: http://127.0.0.1:${server.address().port}`));
process.on('SIGTERM',()=>server.close());
