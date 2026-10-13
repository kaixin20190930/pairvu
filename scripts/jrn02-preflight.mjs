#!/usr/bin/env node
import {readFile, stat} from 'node:fs/promises';
import {isLiveStripeBillingConfigured} from '../lib/billing/access.ts';

// This file is the only entry point that opens the controller's private input.
const inputPath='/private/tmp/pairvu-stripe-sandbox-input.json';
const candidateKeys={
  stripeKey:['STRIPE_SECRET_KEY'],
  starterPrice:['STRIPE_PRICE_STARTER'],
  emailA:['PAIRVU_TEST_EMAIL_A'],
  emailB:['PAIRVU_TEST_EMAIL_B'],
};
function record(value){return value&&typeof value==='object'&&!Array.isArray(value)?value:null;}
function keyReport(value){return Object.keys(record(value)??{}).map(k=>/^[A-Za-z][A-Za-z0-9_]{0,80}$/.test(k)?k:'[invalid-key]').sort();}
function pick(source,names){for(const key of names){const value=source[key];if(typeof value==='string')return value;}return null;}
function value(source,names){return pick(source,names);}
function fail(code){const error=new Error(code);error.code=code;throw error;}
function safeOrigin(value){const url=new URL(value??'http://127.0.0.1:3107');if(url.protocol!=='http:'||!['127.0.0.1','localhost'].includes(url.hostname)||url.username||url.password||url.search||url.hash||url.pathname!=='/'||url.port!=='3107')fail('origin_must_be_isolated_loopback_3107');return url.origin;}
function safeTestKey(value){if(!value||!/^sk_test_[A-Za-z0-9]+$/.test(value))fail('test_stripe_key_required');return value;}
const command=process.argv[2]??'inspect';
try {
  if(!['inspect','check','selftest'].includes(command))fail('unsupported_command');
  if(command==='selftest'){
    for(const bad of ['sk_live_synthetic','rk_test_synthetic','',null]){let rejected=false;try{safeTestKey(bad);}catch{rejected=true;}if(!rejected)fail('live_key_rejection_broken');}
    for(const bad of ['https://pairvu.com','http://example.com:3107','http://127.0.0.1:3108','https://127.0.0.1:3107']){
      let rejected=false;try{safeOrigin(bad);}catch{rejected=true;}if(!rejected)fail('non_loopback_rejection_broken');
    }
    if(isLiveStripeBillingConfigured({STRIPE_SECRET_KEY:'sk_test_synthetic',STRIPE_WEBHOOK_SECRET:'whsec_synthetic',STRIPE_PRICE_STARTER:'price_synthetic',STRIPE_PRICE_GROWTH:'price_synthetic',STRIPE_PRICE_AGENCY:'price_synthetic'}))fail('test_checkout_gate_assumption_changed');
    console.log(JSON.stringify({status:'SELFTEST_PASS',nonTestKeysRejected:4,nonLoopbackRejected:4,existingCheckoutAcceptsTestKey:false,privateInputOpened:false,remoteRequests:0}));
    process.exit(0);
  }
  const metadata=await stat(inputPath);
  if(!metadata.isFile()||(metadata.mode&0o077)!==0)fail('input_requires_private_0600_file');
  if(metadata.size>65536)fail('input_too_large');
  const input=record(JSON.parse(await readFile(inputPath,'utf8')));
  if(!input)fail('input_must_be_object');
  if(command==='inspect'){
    const categories=Object.fromEntries(Object.entries(candidateKeys).map(([kind,names])=>[kind,value(input,names)!==null]));
    console.log(JSON.stringify({status:'INSPECTED',topLevelKeys:keyReport(input),nestedObjectKeys:Object.values(input).filter(record).map(keyReport),recognizedCategories:categories}));
  } else {
    const key=safeTestKey(value(input,candidateKeys.stripeKey));
    const price=value(input,candidateKeys.starterPrice);
    if(!price||!/^price_[A-Za-z0-9]+$/.test(price))fail('starter_price_id_required');
    const emailA=value(input,candidateKeys.emailA),emailB=value(input,candidateKeys.emailB);
    if(!emailA||!emailB||emailA===emailB||![emailA,emailB].every(v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)))fail('distinct_test_identity_emails_required');
    const origin=safeOrigin('http://127.0.0.1:3107');
    const response=await fetch(`https://api.stripe.com/v1/prices/${encodeURIComponent(price)}`,{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(10000)});
    if(!response.ok)fail('stripe_test_price_read_failed');
    const body=record(await response.json());
    if(!body||body.livemode!==false||body.active!==true||body.type!=='recurring')fail('active_recurring_test_price_required');
    console.log(JSON.stringify({status:'PREFLIGHT_PASS',origin,stripeKeyMode:'test',starterPrice:{livemode:false,active:true,recurring:true},distinctIdentityEmails:true,privateInput:true,remoteWrites:0}));
  }
}catch(error){console.error(JSON.stringify({status:'BLOCKED',code:error?.code??'preflight_failed'}));process.exitCode=1;}
