#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,stat,writeFile} from 'node:fs/promises';

const inputPath='/private/tmp/pairvu-stripe-sandbox-input.json';
const handoffPath='/private/tmp/pairvu-jrn02-handoff.json';
const metadataKey='metadata[jrn02_run_id]';
const mode=process.argv[2]??'inspect';
let stage='private_input';
try{
  assert(['inspect','tag'].includes(mode),'mode_guard');
  const file=await stat(inputPath);assert(file.isFile()&&(file.mode&0o077)===0,'private_input_guard');
  const input=JSON.parse(await readFile(inputPath,'utf8'));
  assert(typeof input.STRIPE_SECRET_KEY==='string'&&/^sk_test_[A-Za-z0-9]+$/.test(input.STRIPE_SECRET_KEY),'test_key_guard');
  const handoff=JSON.parse(await readFile(handoffPath,'utf8'));
  assert(handoff.unitId==='JRN-02'&&handoff.livemode===false&&/^JRN-02-[0-9a-f-]{36}$/.test(handoff.runId)&&/^cs_test_[A-Za-z0-9]+$/.test(handoff.checkoutSessionId),'handoff_guard');
  const request=async(path,body)=>{const response=await fetch(`https://api.stripe.com/v1${path}`,{method:body?'POST':'GET',headers:{authorization:`Bearer ${input.STRIPE_SECRET_KEY}`,...(body?{'content-type':'application/x-www-form-urlencoded'}:{})},body,signal:AbortSignal.timeout(15000)});assert.equal(response.status,200,'stripe_response_guard');const value=await response.json();assert(value.livemode===false,'live_object_rejected');return value;};
  stage='read_objects';const checkout=await request(`/checkout/sessions/${handoff.checkoutSessionId}`);assert(checkout.metadata?.jrn02_run_id===handoff.runId&&checkout.status==='complete'&&checkout.payment_status==='paid'&&typeof checkout.subscription==='string'&&typeof checkout.customer==='string','checkout_guard');
  const subscription=await request(`/subscriptions/${checkout.subscription}`);assert(subscription.customer===checkout.customer&&subscription.metadata?.workspace_id===checkout.client_reference_id&&subscription.metadata?.plan_code==='starter'&&typeof subscription.latest_invoice==='string','subscription_guard');
  const customer=await request(`/customers/${checkout.customer}`),invoice=await request(`/invoices/${subscription.latest_invoice}`);assert(customer.id===checkout.customer&&invoice.customer===customer.id&&(invoice.subscription===subscription.id||invoice.parent?.subscription_details?.subscription===subscription.id),'linked_objects_guard');
  const before={subscription:subscription.metadata?.jrn02_run_id===handoff.runId,customer:customer.metadata?.jrn02_run_id===handoff.runId,invoice:invoice.metadata?.jrn02_run_id===handoff.runId};
  if(mode==='tag'){
    stage='test_metadata_writes';
    for(const [kind,object] of [['subscription',subscription],['customer',customer],['invoice',invoice]]){
      if(before[kind])continue;
      const path={subscription:`/subscriptions/${subscription.id}`,customer:`/customers/${customer.id}`,invoice:`/invoices/${invoice.id}`}[kind];
      const updated=await request(path,new URLSearchParams({[metadataKey]:handoff.runId}));
      assert(updated.id===object.id&&updated.metadata?.jrn02_run_id===handoff.runId,'updated_run_tag_guard');
    }
  }
  const result={unitId:'JRN-02',runId:handoff.runId,status:mode==='tag'?'TEST_OBJECTS_TAGGED':'TEST_OBJECTS_INSPECTED',checkout:{livemode:false,paid:true,tagged:true},subscription:{active:subscription.status==='active',tagged:mode==='tag'||before.subscription},customer:{tagged:mode==='tag'||before.customer},invoice:{tagged:mode==='tag'||before.invoice},onlyCurrentRunObjects:true};
  if(mode==='tag')await writeFile('/private/tmp/pairvu-jrn02-tag-results.json',JSON.stringify(result,null,2)+'\n',{mode:0o600});
  console.log(JSON.stringify(result));
}catch(error){console.error(JSON.stringify({status:'TEST_OBJECT_TAG_FAIL',stage,errorClass:error instanceof Error?error.name:'unknown'}));process.exitCode=1;}
