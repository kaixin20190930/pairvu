import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {join,resolve} from 'node:path';

const require=createRequire(import.meta.url),wr=createRequire(require.resolve('wrangler/package.json')),esbuild=wr('esbuild');
const reportPath=resolve(process.argv[2]??'');
assert(reportPath.startsWith('/private/tmp/pairvu-jrn03-'),'JRN-03 temporary report required');
const report=JSON.parse(await readFile(reportPath,'utf8'));
assert(report.unitId==='JRN-03'&&report.status==='PASS'&&report.uiPage===join(report.temporaryDirectory,'ui-page.json')&&report.temporaryDirectory.includes('/pairvu-jrn03-'),'completed local report required');
const root=report.temporaryDirectory,page=JSON.parse(await readFile(report.uiPage,'utf8'));
assert(page.rows.some(row=>row.analysisId===report.analyses.A&&row.eligibility==='eligible'),'actual route page must include eligible A');
const entry=join(root,'ui-entry.tsx');
await writeFile(entry,`import React from 'react';import {createRoot} from 'react-dom/client';import {ReleaseWorkbenchClient} from ${JSON.stringify(resolve('app/account/releases/ReleaseWorkbenchClient.tsx'))};createRoot(document.getElementById('root')!).render(<ReleaseWorkbenchClient/>);`);
await esbuild.build({entryPoints:[entry],bundle:true,platform:'browser',format:'iife',outfile:join(root,'ui-app.js'),nodePaths:[resolve('node_modules')],loader:{'.css':'local-css'},plugins:[{name:'local-next-link',setup(build){build.onResolve({filter:/^next\/link$/},()=>({path:'next-link',namespace:'jrn03-ui'}));build.onLoad({filter:/.*/,namespace:'jrn03-ui'},()=>({contents:'import React from "react";export default function Link({href,children}){return React.createElement("a",{href},children)}',loader:'js',resolveDir:resolve('.') }));}}]});
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><title>JRN-03 synthetic release UI</title><link rel="stylesheet" href="/ui-app.css"><style>body{font-family:system-ui;margin:2rem;background:#f7f7f5;color:#202020}button,input,select{font:inherit}</style></head><body><p><strong>JRN-03 local fixture transport</strong> — actual ReleaseWorkbenchClient, saved response from local authenticated route. Synthetic evidence; no model or production session.</p><div id="root"></div><script src="/ui-app.js"></script></body></html>';
const server=createServer(async(request,response)=>{try{const path=new URL(request.url??'/', 'http://127.0.0.1').pathname;if(path==='/'){response.setHeader('content-type','text/html; charset=utf-8');response.end(html);}else if(path==='/api/releases/status'){response.setHeader('content-type','application/json');response.end(JSON.stringify({csvExportEnabled:false}));}else if(path==='/api/releases'){response.setHeader('content-type','application/json');response.end(JSON.stringify(page));}else if(path==='/ui-app.js'||path==='/ui-app.css'){response.setHeader('content-type',path.endsWith('.js')?'text/javascript':'text/css');response.end(await readFile(join(root,path.slice(1))));}else{response.statusCode=404;response.end('Not found');}}catch{response.statusCode=500;response.end('Fixture error');}});
server.listen(0,'127.0.0.1',()=>{const address=server.address();assert(address&&typeof address==='object');console.log(JSON.stringify({status:'READY',url:`http://127.0.0.1:${address.port}/`,fixtureTransport:true,actualComponent:true,analysisId:report.analyses.A}));});
