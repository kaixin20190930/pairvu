#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { mutation, profile, statement as sql, hash, NOW } from '../fixtures/product-profile-d1/transactions.mjs';
const args = process.argv.slice(2);
assert(args.length === 0 || (args.length === 2 && args[0] === '--report'), 'Usage: node scripts/verify-product-profile-d1.mjs [--report FILE]');
const require = createRequire(import.meta.url), wranglerRequire = createRequire(require.resolve('wrangler/package.json'));
const { Miniflare } = wranglerRequire('miniflare');
const fixtures = fileURLToPath(new URL('../fixtures/product-profile-d1/', import.meta.url));
const temp = await mkdtemp(join(tmpdir(), 'pairvu-profile-d1-'));
const reportPath = args.length ? resolve(args[1]) : join(tmpdir(), `pairvu-profile-d1-${randomUUID()}.json`);
const report = { synthetic: true, unitId: 'UPG-03B0', status: 'RUNNING', runtime: { node: process.version, wrangler: wranglerRequire('wrangler/package.json').version, miniflare: wranglerRequire('miniflare/package.json').version, workerd: wranglerRequire('workerd/package.json').version, compatibilityDate: '2026-07-26', binding: 'real local D1 in workerd', sqliteVersion: 'not exposed by D1', transport: 'two Worker services, HTTP requests to loopback only' }, cases: [], sources: {}, limitations: ['Synthetic schema fixture, not production migrations.', 'No API/UI/credits/model/R2 integration or production behavior verified.', 'Concurrency covers bounded two-request interleavings, not remote replica/production load semantics.'] };
let mf, baseURL, requests = 0;
const tables = ['workspaces','assets','products','product_reference_versions','product_profile_versions','product_mutation_requests','product_write_guards','batches','batch_items','analyses','batch_product_snapshots','analysis_product_snapshots'];
async function request(statements, worker = 'a') {
  requests++;
  const r = await fetch(new URL(`/${worker}`, baseURL), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ statements }), signal: AbortSignal.timeout(10000) });
  const body = await r.json(); assert.equal(body.worker, worker === 'a' ? 'request-a' : 'request-b'); return body;
}
async function must(statements, worker) { const r = await request(statements, worker); assert(r.success, r.error); return r.results; }
async function rows(query, ...params) { return (await must([sql(query, ...params)]))[0].results; }
async function snapshot() {
  const order = { product_mutation_requests: 'workspace_id,product_id,request_id', product_write_guards: 'token', batch_product_snapshots: 'batch_id', analysis_product_snapshots: 'analysis_id' };
  const results = await must(tables.map(t => sql(`SELECT * FROM ${t} ORDER BY ${order[t] ?? 'id'}`)));
  return hash(JSON.stringify(results.map(r => r.results)));
}
async function guardEmpty() { assert.equal((await rows('SELECT count(*) n FROM product_write_guards'))[0].n, 0); }
async function seed() {
  await must(['batch_product_snapshots','analysis_product_snapshots','batch_items','batches','analyses','product_mutation_requests','product_profile_versions','product_reference_versions','products','assets','workspaces','product_write_guards'].map(t => sql(`DELETE FROM ${t}`)));
  await must([
    sql("INSERT INTO workspaces VALUES('w1'),('w2')"),
    sql("INSERT INTO products(id,workspace_id,name,sku_label,sku_key,created_at,updated_at) VALUES('p1','w1','Legacy one','SYN-1','syn-1',?,?),('p2','w2','Legacy two','SYN-1','syn-1',?,?),('p3','w1','Other product','OTHER','other',?,?)", NOW,NOW,NOW,NOW,NOW,NOW),
    sql("INSERT INTO assets VALUES('a1','w1','reference','image','ready','2027-01-01T00:00:00.000Z'),('a2','w1','reference','image','ready','2027-01-01T00:00:00.000Z'),('a3','w1','reference','image','ready','2027-01-01T00:00:00.000Z'),('ax','w1','reference','image','ready','2025-01-01T00:00:00.000Z'),('aw2','w2','reference','image','ready','2027-01-01T00:00:00.000Z')"),
    sql("INSERT INTO product_reference_versions VALUES('r1','w1','p1','a1',1,'current','front',?,?),('r2','w2','p2','aw2',1,'current','front',?,?)", NOW,NOW,NOW,NOW),
    sql("INSERT INTO batches VALUES('legacy-batch','w1','p1')"), sql("INSERT INTO analyses VALUES('legacy-analysis',NULL,'a1','a2')"),
  ]);
}
async function oldSeed() {
  await must([sql("INSERT INTO workspaces VALUES('w1')"),sql("INSERT INTO products(id,workspace_id,name,sku_label,sku_key,created_at,updated_at) VALUES('legacy','w1','Old name','OLD','old',?,?)",NOW,NOW),sql("INSERT INTO assets VALUES('old-asset','w1','reference','image','ready','2027-01-01T00:00:00.000Z')"),sql("INSERT INTO product_reference_versions VALUES('old-ref','w1','legacy','old-asset',1,'current','front',?,?)",NOW,NOW),sql("INSERT INTO batches VALUES('old-batch','w1','legacy')"),sql("INSERT INTO analyses VALUES('old-analysis',NULL,'old-asset','old-asset')")]);
}
async function ledger(m, worker = 'a') { return (await must([sql('SELECT * FROM product_mutation_requests WHERE workspace_id=? AND product_id=? AND request_id=?', m.workspaceId,m.productId,m.requestId)],worker))[0].results[0]; }
async function execute(m, worker = 'a', barrier = null) {
  const old = await ledger(m,worker); if (old) return old.fingerprint === m.fingerprint ? { ok:true,resumed:true,result:old } : { ok:false,code:'idempotency_conflict' };
  if (barrier) await barrier();
  const response = await request(m.statements,worker);
  if (response.success) return {ok:true,resumed:false,result:await ledger(m,worker)};
  const completed = await ledger(m,worker);
  if (completed) return completed.fingerprint === m.fingerprint ? {ok:true,resumed:true,result:completed} : {ok:false,code:'idempotency_conflict'};
  return {ok:false,code:'sql_rejected',error:response.error};
}
async function initialized() { await seed(); const m=mutation({requestId:'initial',name:'Initial profile'}); const r=await execute(m); assert(r.ok); return m; }
async function unchangedFailure(statements, pattern) { const before=await snapshot(), response=await request(statements); assert.equal(response.success,false); if(pattern) assert.match(response.error,pattern); assert.equal(await snapshot(),before); await guardEmpty(); return response.error; }
async function test(name, fn) { const detail=await fn(); await guardEmpty(); report.cases.push({name,status:'PASS',...(detail?{detail}: {})}); console.log(`PASS ${name}`); }
function pairBarrier() { let release, count=0; const gate=new Promise(r=>release=r); return async()=>{if(++count===2)release();await gate;}; }
async function race(left,right) { const barrier=pairBarrier();const results=await Promise.all([execute(left,'a',barrier),execute(right,'b',barrier)]); assert.equal(results.filter(r=>r.ok).length,1); assert.equal((await rows("SELECT revision FROM products WHERE id='p1'"))[0].revision,2); const loser=results[0].ok?right:left;assert.equal(await ledger(loser),undefined);return results.map(r=>({ok:r.ok,resumed:r.resumed,error:r.error})); }
try {
  for(const path of ['base.sql','profile-schema.sql','worker.mjs','transactions.mjs']) report.sources[path]=hash(await readFile(join(fixtures,path)));
  report.sources['verify-product-profile-d1.mjs']=hash(await readFile(fileURLToPath(import.meta.url)));
  const workerOptions = name => ({name,modules:true,scriptPath:join(fixtures,'worker.mjs'),compatibilityDate:report.runtime.compatibilityDate,d1Databases:{DB:'synthetic-product-profile-d1'},bindings:{FIXTURE_WORKER:name},outboundService:async()=>new Response('Outbound fetch disabled in synthetic fixture',{status:403})});
  mf=new Miniflare({host:'127.0.0.1',port:0,cf:false,d1Persist:join(temp,'d1'),workers:[{...workerOptions('request-a'),serviceBindings:{PEER:'request-b'}},workerOptions('request-b')]});
  baseURL=await Promise.race([mf.ready,new Promise((_,reject)=>{const t=setTimeout(()=>reject(new Error('Local runtime startup timeout')),20000);t.unref();})]);
  const apply=async file=>must((await readFile(join(fixtures,file),'utf8')).split('\n-- statement\n').map(s=>sql(s.trim())));
  await apply('base.sql'); await oldSeed();
  const oldQueries=["SELECT id,workspace_id,name,sku_label,sku_key,status,archived_at,created_at,updated_at FROM products ORDER BY id","SELECT * FROM product_reference_versions ORDER BY id","SELECT * FROM batches ORDER BY id","SELECT * FROM analyses ORDER BY id"];
  const before=(await must(oldQueries.map(q=>sql(q)))).map(r=>r.results);await apply('profile-schema.sql');
  await test('old data: additive schema preserves exact legacy rows, no invented profile/snapshot',async()=>{assert.deepEqual((await must(oldQueries.map(q=>sql(q)))).map(r=>r.results),before);assert.deepEqual(await rows('SELECT revision,current_profile_version_id FROM products'),[{revision:0,current_profile_version_id:null}]);for(const t of ['product_profile_versions','batch_product_snapshots','analysis_product_snapshots'])assert.equal((await rows(`SELECT count(*) n FROM ${t}`))[0].n,0);assert.deepEqual(await rows('PRAGMA foreign_key_check'),[]);});
  await test('two independent Worker services share the same real local D1',async()=>{const a=await request([sql('SELECT count(*) n FROM products')],'a'),b=await request([sql('SELECT count(*) n FROM products')],'b');assert(a.success&&b.success);assert.deepEqual(a.results[0].results,b.results[0].results);return {workers:[a.worker,b.worker],meta:a.results[0].meta};});
  await test('profile write performs guarded CAS, immutable v1 and compatible columns',async()=>{await seed();const m=mutation({name:'Confirmed product'}),r=await execute(m);assert(r.ok);assert.equal((await rows("SELECT revision,current_profile_version_id,name FROM products WHERE id='p1'"))[0].revision,1);assert.equal((await rows("SELECT * FROM product_profile_versions WHERE id=?",m.versionId))[0].source,'user_confirmed');return {statementCount:m.statements.length};});
  for(const action of ['profile','reference','lifecycle']) {
    const length=mutation({action,expectedVersion:1}).statements.length;
    for(let index=0;index<length;index++)await test(`${action}: injected CHECK failure after write position ${index+1}/${length} rolls back every table`,async()=>{await initialized();const m=mutation({action,expectedVersion:1});const injected=[...m.statements];injected.splice(index+1,0,sql("INSERT INTO product_write_guards(token,workspace_id,product_id,ok) VALUES(?,'w1','p1',0)",randomUUID()));return {error:await unchangedFailure(injected,/CHECK constraint failed/),afterStatement:index+1};});
  }
  await test('zero-row UPDATE is caught by final guard and rolls back prior inserts',async()=>{await initialized();const m=mutation({expectedVersion:1});m.statements[3].params[m.statements[3].params.length-1]=999;await unchangedFailure(m.statements,/CHECK constraint failed/);});
  await test('stale expectedVersion fails initial guard with unchanged state',async()=>{await initialized();await unchangedFailure(mutation({expectedVersion:0}).statements,/CHECK constraint failed/);});
  await test('SKU unique failure rolls back profile, ledger, pointer and revision',async()=>{await initialized();await unchangedFailure(mutation({expectedVersion:1,skuLabel:'OTHER'}).statements,/UNIQUE constraint failed/);});
  await test('CAS: two profile requests, same revision, exactly one commit',async()=>{await initialized();return race(mutation({expectedVersion:1,name:'A'}),mutation({expectedVersion:1,name:'B'}));});
  await test('CAS: profile vs reference promotion, no split-table lost update',async()=>{await initialized();return race(mutation({expectedVersion:1}),mutation({action:'reference',expectedVersion:1}));});
  await test('CAS: two reference roles still use one product revision',async()=>{await initialized();return race(mutation({action:'reference',expectedVersion:1,assetId:'a2',role:'front'}),mutation({action:'reference',expectedVersion:1,assetId:'a3',role:'back'}));});
  for(const rival of ['profile','reference'])await test(`CAS: archive vs ${rival}, exactly one commit`,async()=>{await initialized();return race(mutation({action:'lifecycle',expectedVersion:1}),mutation({action:rival,expectedVersion:1}));});
  await test('same-key concurrent retries commit once and return identical stable result',async()=>{await initialized();const barrier=pairBarrier(),a=mutation({expectedVersion:1,requestId:'same-key',name:'Retry'}),b=mutation({expectedVersion:1,requestId:'same-key',name:'Retry'});const result=await Promise.all([execute(a,'a',barrier),execute(b,'b',barrier)]);assert(result.every(r=>r.ok));assert.deepEqual(result[0].result,result[1].result);assert.equal(result.filter(r=>!r.resumed).length,1);assert.equal((await rows("SELECT count(*) n FROM product_profile_versions WHERE product_id='p1'"))[0].n,2);const oldResult=result[0].result;assert((await execute(mutation({expectedVersion:2,name:'Later'}))).ok);assert.deepEqual((await execute(a)).result,oldResult);return {resumed:result.map(r=>r.resumed)};});
  await test('same request key with different content is rejected with no writes',async()=>{await initialized();assert((await execute(mutation({requestId:'reuse',expectedVersion:1,name:'One'}))).ok);const before=await snapshot(),r=await execute(mutation({requestId:'reuse',expectedVersion:1,name:'Different'}));assert.equal(r.code,'idempotency_conflict');assert.equal(await snapshot(),before);});
  await test('no-op profile stores idempotency result without version/revision increment',async()=>{const init=await initialized(),m=mutation({expectedVersion:1,name:'Initial profile',noopProfile:{id:init.versionId}});assert((await execute(m)).ok);assert.equal((await rows("SELECT revision FROM products WHERE id='p1'"))[0].revision,1);assert.equal((await rows("SELECT count(*) n FROM product_profile_versions WHERE product_id='p1'"))[0].n,1);});
  await test('wrong workspace product/asset and expired asset are rejected atomically',async()=>{await initialized();for(const m of [mutation({workspaceId:'w2',productId:'p1',expectedVersion:1}),mutation({action:'reference',assetId:'aw2',expectedVersion:1}),mutation({action:'reference',assetId:'ax',expectedVersion:1})])await unchangedFailure(m.statements,/CHECK constraint failed/);});
  await test('reference UNIQUE and scoped pointer constraints reject partial writes',async()=>{await initialized();await unchangedFailure(mutation({action:'reference',assetId:'a1',expectedVersion:1}).statements,/UNIQUE constraint failed/);const foreign=mutation({workspaceId:'w2',productId:'p2',name:'W2',expectedVersion:0});assert((await execute(foreign)).ok);await unchangedFailure([sql("INSERT INTO product_write_guards VALUES('pointer-test','w1','p1',1)"),sql("UPDATE products SET current_profile_version_id=? WHERE id='p1'",foreign.versionId)],/profile_pointer_scope/);});
  await test('legacy writes blocked on initialized products; immutable profile/reference core',async()=>{await initialized();for(const [s,p] of [[sql("UPDATE products SET name='unsafe' WHERE id='p1'"),/legacy_write_blocked/],[sql("UPDATE product_reference_versions SET status='superseded' WHERE id='r1'"),/legacy_write_blocked/],[sql("INSERT INTO product_reference_versions VALUES('rogue','w1','p1','a2',2,'current','back',?,?)",NOW,NOW),/legacy_write_blocked/],[sql("UPDATE product_profile_versions SET profile_json='{}' WHERE product_id='p1'"),/profile_immutable/],[sql("UPDATE product_reference_versions SET asset_id='a2' WHERE id='r1'"),/reference_immutable/]])await unchangedFailure([s],p);await must([sql("UPDATE products SET name='Legacy updated' WHERE id='p3'")]);assert.equal((await rows("SELECT revision,current_profile_version_id FROM products WHERE id='p3'"))[0].current_profile_version_id,null);});
  await test('archive/restore preserve profile; archived edit is rejected',async()=>{const init=await initialized();assert((await execute(mutation({action:'lifecycle',expectedVersion:1}))).ok);await unchangedFailure(mutation({expectedVersion:2}).statements,/CHECK constraint failed/);assert((await execute(mutation({action:'lifecycle',status:'active',expectedVersion:2}))).ok);assert.equal((await rows("SELECT revision,current_profile_version_id FROM products WHERE id='p1'"))[0].current_profile_version_id,init.versionId);});
  await test('legal workspace cascade is compatible with immutable UPDATE triggers',async()=>{await initialized();await must([sql("DELETE FROM workspaces WHERE id='w1'")]);for(const table of ['products','product_profile_versions','product_mutation_requests','product_reference_versions'])assert.equal((await rows(`SELECT count(*) n FROM ${table} WHERE workspace_id='w1'`))[0].n,0);assert.deepEqual(await rows('PRAGMA foreign_key_check'),[]);});
  report.status='PASS';report.requestCount=requests;report.completedAt=new Date().toISOString();
} catch(error) {report.status='FAIL';report.failure={message:error.message,stack:error.stack};process.exitCode=1;}
finally {
  try { if(mf)await mf.dispose(); } catch(error) { report.cleanupError=error.message; report.status='FAIL'; process.exitCode=1; }
  await rm(temp,{recursive:true,force:true});
  await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
}
console.log(`${report.status}: ${report.cases.length} real local D1 cases, ${requests} HTTP requests; report ${reportPath}`);
if(report.failure)console.error(report.failure.message);
