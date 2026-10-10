// New synthetic interaction evidence; never overwrites the original UPG-03 browser reports.
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {build}=wranglerRequire('esbuild');
const bundled=await build({entryPoints:[resolve('fixtures/product-profiles/lifecycle-entry.tsx')],bundle:true,platform:'browser',format:'iife',write:false,jsx:'automatic',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'synthetic-router',setup(b){b.onResolve({filter:/^next\/navigation$/},()=>({path:'router',namespace:'synthetic'}));b.onLoad({filter:/.*/,namespace:'synthetic'},()=>({contents:'export const useRouter=()=>({refresh(){}});'}));}}]});
const sources={};
for(const path of ['app/account/products/[productId]/ProductProfileClient.tsx','fixtures/product-profiles/lifecycle-entry.tsx','fixtures/product-profiles/lifecycle-server.mjs'])sources[path]=createHash('sha256').update(await readFile(path)).digest('hex');
const reportPath=resolve(process.argv[2]??'fixtures/product-profiles/lifecycle-results.json');
let report;
const server=createServer(async(request,response)=>{
  if(request.url==='/__results'&&request.method==='POST'){
    let body='';for await(const chunk of request)body+=chunk;report={...JSON.parse(body),sources};await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');console.log(`${report.status}: ${report.cases.length} component interaction cases; ${reportPath}`);response.end('recorded');return;
  }
  if(request.url==='/__results'){response.writeHead(report?200:202,{'Content-Type':'application/json'});response.end(JSON.stringify(report??{status:'RUNNING'}));return;}
  if(request.url==='/app.js'){response.writeHead(200,{'Content-Type':'text/javascript'});response.end(bundled.outputFiles[0].text);return;}
  response.writeHead(200,{'Content-Type':'text/html'});response.end('<!doctype html><html><head><meta charset="utf-8"><title>Pairvu lifecycle component regression</title></head><body><h1>Synthetic lifecycle regression</h1><pre id="root"></pre><script src="/app.js"></script></body></html>');
});
server.listen(0,'127.0.0.1',()=>console.log(`Lifecycle fixture: http://127.0.0.1:${server.address().port}; PID ${process.pid}`));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
