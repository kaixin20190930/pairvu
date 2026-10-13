#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,stat,writeFile} from 'node:fs/promises';

const mode=process.argv[2]??'inspect';
let stage='input';
try{
  assert(['inspect','cancel'].includes(mode),'mode_guard');
  const inputPath='/private/tmp/pairvu-stripe-sandbox-input.json';
  const metadata=await stat(inputPath);
  assert(metadata.isFile()&&(metadata.mode&0o077)===0,'private_input_guard');
  const input=JSON.parse(await readFile(inputPath,'utf8'));
  assert(/^sk_test_[A-Za-z0-9]+$/.test(input.STRIPE_SECRET_KEY),'test_key_guard');
  const handoff=JSON.parse(await readFile('/private/tmp/pairvu-jrn02-handoff.json','utf8'));
  assert(handoff.unitId==='JRN-02'&&handoff.livemode===false&&/^JRN-02-[0-9a-f-]{36}$/.test(handoff.runId)&&/^cs_test_[A-Za-z0-9]+$/.test(handoff.checkoutSessionId),'handoff_guard');
  const request=async(path,method='GET')=>{
    const response=await fetch(`https://api.stripe.com/v1${path}`,{method,headers:{authorization:`Bearer ${input.STRIPE_SECRET_KEY}`},signal:AbortSignal.timeout(15000)});
    assert.equal(response.status,200,'stripe_response_guard');
    const value=await response.json();
    assert(value.livemode===false,'live_object_rejected');
    return value;
  };
  stage='ownership';
  const checkout=await request(`/checkout/sessions/${handoff.checkoutSessionId}`);
  assert(checkout.id===handoff.checkoutSessionId&&checkout.metadata?.jrn02_run_id===handoff.runId&&checkout.status==='complete'&&checkout.payment_status==='paid'&&typeof checkout.subscription==='string','checkout_ownership_guard');
  const subscription=await request(`/subscriptions/${checkout.subscription}`);
  assert(subscription.id===checkout.subscription&&subscription.customer===checkout.customer&&subscription.metadata?.workspace_id===checkout.client_reference_id&&subscription.metadata?.jrn02_run_id===handoff.runId,'subscription_ownership_guard');
  if(mode==='cancel'&&subscription.status!=='canceled'){
    stage='cancel_current_test_subscription';
    const canceled=await request(`/subscriptions/${subscription.id}`,'DELETE');
    assert(canceled.id===subscription.id&&canceled.status==='canceled'&&canceled.metadata?.jrn02_run_id===handoff.runId,'cancellation_guard');
  }
  const checked=await request(`/subscriptions/${subscription.id}`);
  const result={unitId:'JRN-02',runId:handoff.runId,status:mode==='cancel'?'TEST_SUBSCRIPTION_CLEANED':'TEST_SUBSCRIPTION_INSPECTED',livemode:false,verifiedCurrentRun:true,subscriptionStatus:checked.status,canceled:checked.status==='canceled',onlyThisTestSubscriptionTouched:true};
  if(mode==='cancel')await writeFile('/private/tmp/pairvu-jrn02-cleanup-results.json',JSON.stringify(result,null,2)+'\n',{mode:0o600});
  console.log(JSON.stringify(result));
}catch(error){console.error(JSON.stringify({status:'TEST_SUBSCRIPTION_CLEANUP_FAIL',stage,errorClass:error instanceof Error?error.name:'unknown'}));process.exitCode=1;}
