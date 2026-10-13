#!/usr/bin/env node
import assert from 'node:assert/strict';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {NextRequest} from 'next/server.js';

// This reproduces only the test-mode checkout gate. Identity is a synthetic
// dependency fixture, so the result is not an authenticated purchase test.
const require=createRequire(resolve('package.json'));
const wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const esbuild=wranglerRequire('esbuild');
const temporaryDirectory=await mkdtemp(join(tmpdir(),'pairvu-jrn02-gate-'));
const generated=join(temporaryDirectory,'checkout.cjs');
const fixture=globalThis.__jrn02CheckoutFixture={events:[]};
const stubs={
  '@/lib/cloudflare/bindings':"export function getVisualQAEnv(){globalThis.__jrn02CheckoutFixture.events.push('env');return {STRIPE_SECRET_KEY:'sk_test_synthetic',STRIPE_WEBHOOK_SECRET:'whsec_synthetic',STRIPE_PRICE_STARTER:'price_synthetic',STRIPE_PRICE_GROWTH:'price_synthetic',STRIPE_PRICE_AGENCY:'price_synthetic',VISUALQA_DB:{},BETTER_AUTH_URL:'http://127.0.0.1:3107'};}",
  '@/lib/auth/server':"export function createPairvuAuth(){return {api:{getSession:async()=>{globalThis.__jrn02CheckoutFixture.events.push('session');return {user:{id:'synthetic-a',name:'Synthetic A',email:'a@local.invalid'}};}}};}",
  '@/lib/accounts/repository':"export async function getWorkspaceAccountSnapshot(){throw Error('account_lookup_must_not_run_before_checkout_gate');}",
  '@/lib/billing/repository':"export async function getWorkspaceBillingRecord(){throw Error('billing_lookup_must_not_run_before_checkout_gate');}",
};
await esbuild.build({entryPoints:[resolve('app/api/billing/checkout/route.ts')],bundle:true,platform:'node',format:'cjs',outfile:generated,plugins:[{name:'synthetic-env-and-identity-only',setup(build){build.onResolve({filter:/^@\//},args=>stubs[args.path]?{path:args.path,namespace:'fixture'}:undefined);build.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:stubs[args.path],loader:'js',resolveDir:resolve('.')}));}}]});
const {POST}=require(generated);
const originalFetch=globalThis.fetch;
let outboundCalls=0;
globalThis.fetch=()=>{outboundCalls++;throw Error('outbound_call_not_allowed');};
let report;
try{
  const response=await POST(new NextRequest('http://127.0.0.1:3107/api/billing/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({planCode:'starter'})}));
  const body=await response.json();
  assert.equal(response.status,503);
  assert.equal(body.error,'billing_not_configured');
  assert.deepEqual(fixture.events,['env','session']);
  assert.equal(outboundCalls,0);
  report={status:'BLOCKED_BY_UNCHANGED_APPLICATION_GATE',routeStatus:503,routeError:'billing_not_configured',source:'app/api/billing/checkout/route.ts',gate:'lib/billing/access.ts:isLiveStripeBillingConfigured',syntheticIdentity:true,actualHandler:true,testModeKeyPrefix:true,accountLookupCalled:false,outboundCalls:0,stripeObjectsCreated:0,productionChanged:false};
  console.log(JSON.stringify(report));
}finally{globalThis.fetch=originalFetch;delete globalThis.__jrn02CheckoutFixture;}
if(process.argv[2])await writeFile(resolve(process.argv[2]),JSON.stringify(report,null,2)+'\n');
