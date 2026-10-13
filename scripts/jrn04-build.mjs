import assert from 'node:assert/strict';
import {execFileSync,spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {appendFile,readFile,mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

const sha=process.argv[2]; assert(/^[a-f0-9]{40}$/.test(sha??''),'full immutable candidate SHA required');
const repo=resolve('.'),root=await mkdtemp(join(tmpdir(),'pairvu-jrn04-build-'));
const env=Object.fromEntries(['PATH','HOME','TMPDIR','LANG','TZ'].flatMap(key=>process.env[key]===undefined?[]:[[key,process.env[key]]]));
const git=(args)=>execFileSync('git',args,{cwd:repo,env,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
assert.equal(git(['rev-parse',`${sha}^{commit}`]),sha);
const files=git(['ls-tree','-r','--name-only',sha]).split('\n');
const excludedPaths=files.filter(path=>/(^|\/)\.env($|\.)|(^|\/)\.dev\.vars($|\.)|stripe-sandbox-input/i.test(path));
const sourcePaths=files.filter(path=>!excludedPaths.includes(path));
const archive=join(root,'candidate.tar');
execFileSync('git',['archive','--format=tar',`--output=${archive}`,sha,'--',...sourcePaths],{cwd:repo,env,stdio:['ignore','pipe','pipe']});
execFileSync('tar',['-xf',archive,'-C',root],{env,stdio:['ignore','pipe','pipe']});
// Turbopack rejects dependency symlinks outside its source root. This macOS workspace uses APFS file clones.
execFileSync('cp',['-cR',join(repo,'node_modules'),join(root,'node_modules')],{env,stdio:['ignore','pipe','pipe']});
const guard=join(root,'network-guard.cjs'),blockedLog=join(root,'network-blocked.jsonl');
await writeFile(guard,`
const fs=require('node:fs'),net=require('node:net');
const allow=h=>!h||h==='localhost'||h==='::1'||h==='[::1]'||/^127\\./.test(h);
function check(host,layer){if(!allow(host)){fs.appendFileSync(${JSON.stringify(blockedLog)},JSON.stringify({host,layer})+'\\n');throw Error('JRN04 build outbound blocked');}}
function hostOf(value){if(typeof value==='string'||value instanceof URL)return new URL(value).hostname;return value?.hostname??value?.host;}
for(const module of ['node:http','node:https']){const api=require(module);for(const method of ['request','get']){const original=api[method];api[method]=function(input,...args){check(hostOf(input),module);return original.call(this,input,...args);};}}
const originalFetch=globalThis.fetch;globalThis.fetch=function(input,...args){check(new URL(typeof input==='string'||input instanceof URL?input:input.url).hostname,'fetch');return originalFetch.call(this,input,...args);};
const originalConnect=net.Socket.prototype.connect;net.Socket.prototype.connect=function(...args){const value=args[0];if(typeof value==='number')check(typeof args[1]==='string'?args[1]:undefined,'net');else if(value&&typeof value==='object'&&!value.path)check(value.host,'net');return originalConnect.apply(this,args);};
`,{flag:'wx'});
const logPath=join(root,'build-original.log');
const buildEnv={...env,NODE_OPTIONS:`--require=${guard}`,NEXT_TELEMETRY_DISABLED:'1'};
const startedAt=new Date().toISOString();
const exitCode=await new Promise((done,reject)=>{
  const child=spawn('pnpm',['exec','next','build'],{cwd:root,env:buildEnv,stdio:['ignore','pipe','pipe']});
  let writes=Promise.resolve();
  for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{process.stdout.write(chunk);writes=writes.then(()=>appendFile(logPath,chunk));});
  child.on('error',reject);child.on('close',code=>writes.then(()=>done(code??1),reject));
});
let blocked=[];try{blocked=(await readFile(blockedLog,'utf8')).trim().split('\n').filter(Boolean).map(line=>JSON.parse(line));}catch(error){if(error.code!=='ENOENT')throw error;}
const require=createRequire(join(repo,'package.json'));let embeddedBuildSha=null;
try{embeddedBuildSha=JSON.parse(await readFile(join(root,'.next/required-server-files.json'),'utf8')).config?.env?.PAIRVU_BUILD_SHA??null;}catch{}
const report={unitId:'JRN-04-FIX',candidateSha:sha,status:exitCode===0&&blocked.length===0?'PASS':'FAIL',exitCode,startedAt,finishedAt:new Date().toISOString(),sourceMethod:'git archive of exact candidate SHA with credential-named paths excluded by filename without reading',dependencyMethod:'APFS clone of locally installed node_modules, no install or network',excludedPaths,sourceArchiveSha256:createHash('sha256').update(await readFile(archive)).digest('hex'),temporaryDirectory:root,logPath,embeddedBuildSha,releaseArtifact:false,environmentKeys:Object.keys(buildEnv).sort(),blockedOutbound:blocked,nodeVersion:process.version,nextVersion:require('next/package.json').version,productionLifecycleCovered:false,qualityEvidence:false,modelCallsExecuted:0};
const reportPath=join(root,'build-report.json');await writeFile(reportPath,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:report.status,candidateSha:sha,reportPath}));if(report.status==='FAIL')process.exitCode=1;
