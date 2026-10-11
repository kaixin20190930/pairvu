import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),wr=createRequire(require.resolve('wrangler/package.json'));
const stubs={
 'next/link':'import React from "react";export default ({children,...props})=>React.createElement("a",props,children);',
 'next/navigation':'export const usePathname=()=>"/account/releases";export const useSearchParams=()=>new URLSearchParams();',
};
const bundled=await wr('esbuild').build({entryPoints:[resolve('fixtures/release-workbench/ui-entry.tsx')],bundle:true,platform:'browser',format:'iife',write:false,outfile:'/tmp/release-ui.js',jsx:'automatic',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'next-boundaries-only',setup(b){b.onResolve({filter:/^next\//},a=>stubs[a.path]?{path:a.path,namespace:'synthetic'}:undefined);b.onLoad({filter:/.*/,namespace:'synthetic'},a=>({contents:stubs[a.path],loader:'js',resolveDir:resolve('.')}));}}]});
const sources={};for(const p of ['app/account/releases/ReleaseWorkbenchClient.tsx','app/account/releases/releases.module.css','components/AccountWorkspaceNav.tsx','fixtures/release-workbench/ui-entry.tsx','fixtures/release-workbench/ui-server.mjs'])sources[p]=createHash('sha256').update(await readFile(p)).digest('hex');
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/app.js'){res.setHeader('Content-Type','text/javascript');res.end(bundled.outputFiles.find(f=>f.path.endsWith('.js')).text);return;}
 if(url.pathname==='/local.css'){res.setHeader('Content-Type','text/css');res.end(bundled.outputFiles.find(f=>f.path.endsWith('.css')).text);return;}
 if(url.pathname==='/style.css'){res.setHeader('Content-Type','text/css');res.end(await readFile('app/globals.css'));return;}
 if(url.pathname==='/page.json'){res.setHeader('Content-Type','application/json');res.end(await readFile('fixtures/release-workbench/sample-page.json'));return;}
 if(url.pathname==='/__results'&&req.method==='POST'){let body='';for await(const chunk of req)body+=chunk;const report={...JSON.parse(body),sources};await writeFile(resolve(`fixtures/release-workbench/browser-${report.mode}-results.json`),JSON.stringify(report,null,2)+'\n');res.end('recorded');console.log(`${report.status}: ${report.cases.length} ${report.mode} cases`);return;}
 res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pairvu release workbench · synthetic QA</title><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/local.css"><style>body{padding:16px;margin:0}#app{max-width:1100px;margin:auto}#narrow iframe{width:375px;max-width:100%;height:1500px;border:1px solid #aaa}</style></head><body><p id="summary">Running actual React workbench checks…</p><div id="app"></div>${url.searchParams.get('mode')==='narrow'?'':'<div id="narrow"><h2>375px iframe</h2><iframe src="/?mode=narrow"></iframe></div>'}<script src="/app.js"></script></body></html>`);
});
server.listen(Number(process.argv[2]??0),'127.0.0.1',()=>console.log(`Release workbench fixture: http://127.0.0.1:${server.address().port}`));
process.on('SIGTERM',()=>server.close());
