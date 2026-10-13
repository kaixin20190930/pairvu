import assert from 'node:assert/strict';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {mkdtemp,readFile,readdir,realpath,stat,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createRequire} from 'node:module';
import {createPairvuAuth} from '../lib/auth/server';
import {getWorkspaceAccountSnapshot} from '../lib/accounts/repository';
import {getWorkspaceBillingRecord} from '../lib/billing/repository';
import {createStripeCheckoutSession,subscriptionIdFromWebhookEvent,verifyStripeWebhook,type StripeWebhookEvent} from '../lib/billing/stripe';
import type {D1Database,VisualQACloudflareEnv} from '../lib/cloudflare/bindings';

const inputPath='/private/tmp/pairvu-stripe-sandbox-input.json';
const host='127.0.0.1',port=3107,origin=`http://${host}:${port}`;
const require=createRequire(resolve('package.json'));
const wr=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=wr('miniflare');
const esbuild=wr('esbuild');
let runId=`JRN-02-${randomUUID()}`;
let stage='private_input';
let cli:ReturnType<typeof spawn>|undefined;
let server:ReturnType<typeof createServer>|undefined;
let mf:InstanceType<typeof Miniflare>|undefined;
const originalFetch=globalThis.fetch;
const mail=new Map<string,string>();
const sessions=new Map<string,{cookie:string;workspaceId:string;userId:string;email:string}>();
const knownEvents=new Set<string>();
const eventTypes=new Map<string,string>();
let priorEventHashes:string[]=[];
let priorEventTypes:string[]=[];
let priorReplayCount=0;
let checkoutId:string|undefined;
let subscriptionId:string|undefined;
let webhookSecret:string|undefined;
let cliDiagnostic='';
let webhookReplayCount=0;
let webhookPOST:(request:Request)=>Promise<Response>;
let env:VisualQACloudflareEnv;
let input:{PAIRVU_TEST_EMAIL_A:string;PAIRVU_TEST_EMAIL_B:string;STRIPE_SECRET_KEY:string;STRIPE_PRICE_STARTER:string};
let root:string;
let resumed=false;

function safeRecord(value:unknown):Record<string,unknown>|null{return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;}
function split(source:string){const out:string[]=[];let buffer='',quote=false,comment=false;for(let i=0;i<source.length;i++){const c=source[i];if(comment){if(c==='\n'){comment=false;buffer+='\n';}continue;}if(!quote&&c==='-'&&source[i+1]==='-'){comment=true;i++;continue;}buffer+=c;if(c==="'"){if(quote&&source[i+1]==="'"){buffer+=source[++i];continue;}quote=!quote;}if(c===';'&&!quote&&(!/^\s*create\s+trigger/i.test(buffer)||/\bend\s*;$/i.test(buffer))){out.push(buffer.trim());buffer='';}}if(buffer.trim())out.push(buffer.trim());return out;}
function send(response:import('node:http').ServerResponse,status:number,body:Record<string,unknown>){response.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});response.end(JSON.stringify(body));}
function safeError(error:unknown){return error instanceof Error?error.name:'unknown';}
async function stripe(path:string,method:'GET'|'POST',body?:URLSearchParams){const result=await originalFetch(`https://api.stripe.com/v1${path}`,{method,headers:{authorization:`Bearer ${input.STRIPE_SECRET_KEY}`,...(body?{'content-type':'application/x-www-form-urlencoded'}:{})},body,signal:AbortSignal.timeout(15000)});const data=safeRecord(await result.json());if(!result.ok||!data)throw Error(`stripe_${method.toLowerCase()}_${result.status}`);if(data.object==='list'){assert(Array.isArray(data.data)&&data.data.every((value:unknown)=>safeRecord(value)?.livemode===false),'stripe_test_list_guard');}else if(data.livemode!==false)throw Error('stripe_live_object_rejected');return data;}
async function compileWebhook(){const output=join(root,'webhook.cjs');const bindings="export function getVisualQAEnv(){return globalThis.__jrn02Env;}";await esbuild.build({entryPoints:[resolve('app/api/billing/webhook/route.ts')],bundle:true,platform:'node',format:'cjs',outfile:output,plugins:[{name:'local-env-and-next-server',setup(build:unknown){const b=build as {onResolve:(options:unknown,callback:unknown)=>void;onLoad:(options:unknown,callback:unknown)=>void};b.onResolve({filter:/^@\/lib\/cloudflare\/bindings$/},()=>({path:'bindings',namespace:'jrn02'}));b.onLoad({filter:/.*/,namespace:'jrn02'},()=>({contents:bindings,loader:'js'}));b.onResolve({filter:/^next\/server$/},()=>({path:require.resolve('next/server.js'),external:true}));}}]});webhookPOST=require(output).POST as (request:Request)=>Promise<Response>;}
async function initialize(){
  const file=await stat(inputPath);assert(file.isFile()&&(file.mode&0o077)===0&&file.size<=65536,'private_input_guard');
  const raw=safeRecord(JSON.parse(await readFile(inputPath,'utf8')));assert(raw,'private_input_object');
  const a=raw.PAIRVU_TEST_EMAIL_A,b=raw.PAIRVU_TEST_EMAIL_B,key=raw.STRIPE_SECRET_KEY,price=raw.STRIPE_PRICE_STARTER;
  assert(typeof a==='string'&&typeof b==='string'&&a!==b&&[a,b].every(v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)),'test_identities_guard');
  assert(typeof key==='string'&&/^sk_test_[A-Za-z0-9]+$/.test(key),'test_key_guard');
  assert(typeof price==='string'&&/^price_[A-Za-z0-9]+$/.test(price),'test_price_id_guard');
  input={PAIRVU_TEST_EMAIL_A:a,PAIRVU_TEST_EMAIL_B:b,STRIPE_SECRET_KEY:key,STRIPE_PRICE_STARTER:price};
  stage='test_price';const priceObject=await stripe(`/prices/${encodeURIComponent(price)}`,'GET');assert(priceObject.active===true&&priceObject.type==='recurring','active_recurring_test_price_guard');
  stage='local_d1';const resume=process.argv[2];resumed=Boolean(resume);if(resume){const resolved=await realpath(resume),canonicalTemp=await realpath(tmpdir());assert(resolved.startsWith(join(canonicalTemp,'pairvu-jrn02-run-')),'resume_path_guard');const previous=safeRecord(JSON.parse(await readFile(join(resolved,'report.json'),'utf8')));assert(previous?.unitId==='JRN-02'&&previous.origin===origin&&typeof previous.runId==='string'&&/^JRN-02-[0-9a-f-]{36}$/.test(previous.runId),'resume_report_guard');root=resolved;runId=previous.runId;priorEventHashes=Array.isArray(previous.eventHashes)?previous.eventHashes.filter((value):value is string=>typeof value==='string'):[];priorEventTypes=Array.isArray(previous.webhookEvents)?previous.webhookEvents.filter((value):value is string=>typeof value==='string'):[];priorReplayCount=typeof previous.signedReplayCount==='number'?previous.signedReplayCount:0;}else root=await mkdtemp(join(tmpdir(),'pairvu-jrn02-run-'));mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("local-only")}}',compatibilityDate:'2026-07-26',d1Databases:{DB:'jrn02-local'},d1Persist:join(root,'d1'),outboundService:async()=>new Response('Outbound disabled',{status:403})});const db=await mf.getD1Database('DB') as D1Database;if(!resume)for(const file of (await readdir('migrations')).filter(name=>name.endsWith('.sql')).sort())await db.batch(split(await readFile(join('migrations',file),'utf8')).map(sql=>db.prepare(sql)));
  env={VISUALQA_DB:db,BETTER_AUTH_URL:origin,BETTER_AUTH_SECRET:randomBytes(32).toString('hex'),AUTH_TRUSTED_ORIGINS:origin,RESEND_API_KEY:'local-capture-only',AUTH_EMAIL_FROM:'no-reply@local.invalid',STRIPE_SECRET_KEY:key,STRIPE_PRICE_STARTER:price,STRIPE_WEBHOOK_SECRET:undefined,RELEASE_WORKBENCH_ENABLED:'true'} as VisualQACloudflareEnv;
  (globalThis as typeof globalThis & {__jrn02Env?:VisualQACloudflareEnv}).__jrn02Env=env;
  await compileWebhook();
  stage='local_auth';globalThis.fetch=(async(target:RequestInfo|URL,init?:RequestInit)=>{const url=String(target);if(url==='https://api.resend.com/emails'){const body=JSON.parse(String(init?.body)) as {to:string[];text:string};assert([a,b].includes(body.to[0]),'local_mail_recipient');const link=body.text.match(/http:\/\/127\.0\.0\.1:3107\/api\/auth\/magic-link\/verify\?[^\s]+/)?.[0];assert(link,'local_magic_link');mail.set(body.to[0],link);return Response.json({id:'local-capture'});}if(url==='https://api.stripe.com/v1/checkout/sessions'&&init?.method==='POST'){const body=new URLSearchParams(String(init.body));assert(!body.has('metadata[jrn02_run_id]')&&!body.has('subscription_data[metadata][jrn02_run_id]'),'duplicate_run_tag_guard');body.set('metadata[jrn02_run_id]',runId);body.set('subscription_data[metadata][jrn02_run_id]',runId);return originalFetch(target,{...init,body});}if(url.startsWith('https://api.stripe.com/v1/'))return originalFetch(target,init);throw Error('outbound_blocked');}) as typeof fetch;
  if(resume){for(const [alias,email] of [['A',a],['B',b]] as const){const row=await db.prepare("SELECT u.id as userId,w.id as workspaceId FROM user u JOIN workspace_memberships m ON m.user_id=u.id JOIN workspaces w ON w.id=m.workspace_id WHERE u.email=? AND m.role='owner' AND w.status='active'").bind(email).first<{userId:string;workspaceId:string}>();assert(row,'resume_identity_missing');assert.equal(row.workspaceId,`personal_${row.userId}`,'resume_identity_guard');sessions.set(alias,{cookie:'',workspaceId:row.workspaceId,userId:row.userId,email});}}else{const auth=createPairvuAuth(env);for(const [alias,email] of [['A',a],['B',b]] as const){const sent=await auth.handler(new Request(`${origin}/api/auth/sign-in/magic-link`,{method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify({email,callbackURL:'/account'})}));assert.equal(sent.status,200);const link=mail.get(email);assert(link,'local_magic_link_missing');const verified=await auth.handler(new Request(link,{headers:{origin}}));assert([200,302].includes(verified.status));const cookie=verified.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');const session=await auth.api.getSession({headers:new Headers({cookie})});assert.equal(session?.user?.email,email);const account=await getWorkspaceAccountSnapshot(db,{id:String(session.user.id),name:String(session.user.name??''),email});assert.equal(account.planCode,'free');sessions.set(alias,{cookie,workspaceId:account.workspaceId,userId:String(session.user.id),email});mail.delete(email);}}
  assert.notEqual(sessions.get('A')?.workspaceId,sessions.get('B')?.workspaceId);
  if(resume){stage='stripe_resume_check';const listed=await stripe('/checkout/sessions?limit=30','GET');const matches=Array.isArray(listed.data)?listed.data.filter(value=>{const entry=safeRecord(value);return safeRecord(entry?.metadata)?.jrn02_run_id===runId;}):[];assert.equal(matches.length,1,'resume_exactly_one_checkout');const previous=safeRecord(matches[0]);assert(previous?.livemode===false&&typeof previous.id==='string'&&previous.id.startsWith('cs_test_'),'resume_test_checkout_guard');checkoutId=previous.id;subscriptionId=typeof previous.subscription==='string'?previous.subscription:undefined;}
  stage='local_server';server=createServer(async(request,response)=>{try{await handle(request,response);}catch(error){send(response,500,{status:'LOCAL_ERROR',stage:'request',errorClass:safeError(error)});}});await new Promise<void>((yes,no)=>server!.listen(port,host,()=>yes()).once('error',no));
  stage='stripe_cli';await startCli();
  console.log(JSON.stringify({status:'LOCAL_READY',runId,origin,localD1:true,actualBetterAuth:true,checkoutAdapter:true,productionCheckoutRouteCovered:false,webhookListener:'test-only',reportPath:join(root,'report.json')}));
  await writeReport();
}
async function startCli(){const args=['listen','--skip-update','--config',join(root,'stripe-cli.toml'),'--events','checkout.session.completed,invoice.paid,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted','--forward-to',`${origin}/api/billing/webhook`];cli=spawn('stripe',args,{env:{NODE_ENV:'test',PATH:process.env.PATH??'/usr/bin:/bin',LANG:'C',XDG_CONFIG_HOME:root,STRIPE_API_KEY:input.STRIPE_SECRET_KEY},stdio:['ignore','pipe','pipe']});await new Promise<void>((yes,no)=>{let output='';const timer=setTimeout(()=>no(Error('stripe_cli_timeout')),20000);function receive(bytes:Buffer){output+=bytes.toString();const match=output.match(/whsec_[A-Za-z0-9]+/);if(match){webhookSecret=match[0];env.STRIPE_WEBHOOK_SECRET=webhookSecret;clearTimeout(timer);yes();}if(output.length>10000)output=output.slice(-5000);}cli!.stdout?.on('data',receive);cli!.stderr?.on('data',receive);cli!.once('error',error=>{clearTimeout(timer);no(error);});cli!.once('exit',code=>{if(!webhookSecret){clearTimeout(timer);cliDiagnostic=output.replaceAll(input.STRIPE_SECRET_KEY,'[key]').replace(/whsec_[A-Za-z0-9]+/g,'[webhook-secret]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email]').slice(-800);no(Error(`stripe_cli_exit_${code}`));}});});}
async function readBody(request:import('node:http').IncomingMessage){const chunks:Buffer[]=[];for await(const chunk of request){chunks.push(Buffer.from(chunk));if(chunks.reduce((sum,c)=>sum+c.length,0)>1024*1024)throw Error('request_too_large');}return Buffer.concat(chunks).toString('utf8');}
async function handle(request:import('node:http').IncomingMessage,response:import('node:http').ServerResponse){
  const url=new URL(request.url??'/',origin);if(url.origin!==origin){send(response,400,{error:'loopback_origin_required'});return;}
  if(url.pathname==='/health'){send(response,200,{status:'LOCAL_READY',runId,checkoutCreated:Boolean(checkoutId),webhookEvents:priorEventHashes.length+knownEvents.size,resumed});return;}
  if(url.pathname==='/jrn02/checkout'&&request.method==='POST'){
    if(resumed){send(response,409,{error:'resumed_run_checkout_locked'});return;}
    const cookie=request.headers.cookie??'';const session=await createPairvuAuth(env).api.getSession({headers:new Headers({cookie})});if(session?.user?.email!==input.PAIRVU_TEST_EMAIL_A){send(response,401,{error:'A_session_required'});return;}
    if(checkoutId){const existing=await stripe(`/checkout/sessions/${encodeURIComponent(checkoutId)}`,'GET');assert(existing.id===checkoutId&&existing.status==='open'&&typeof existing.url==='string','existing_checkout_guard');send(response,200,{status:'EXISTING_TEST_CHECKOUT',checkoutUrl:existing.url,runId});return;}
    const account=await getWorkspaceAccountSnapshot(env.VISUALQA_DB,{id:String(session.user.id),name:String(session.user.name??''),email:String(session.user.email)});assert.equal(account.workspaceId,sessions.get('A')?.workspaceId);const billing=await getWorkspaceBillingRecord(env.VISUALQA_DB,account.workspaceId);assert(!billing?.subscriptionId,'existing_subscription_guard');
    const checkout=await createStripeCheckoutSession({env,workspaceId:account.workspaceId,email:String(session.user.email),planCode:'starter',customerId:billing?.customerId,returnBaseUrl:origin});assert(/^cs_test_/.test(checkout.id)&&checkout.url.startsWith('https://checkout.stripe.com/'),'test_checkout_guard');
    checkoutId=checkout.id;const tagged=await stripe(`/checkout/sessions/${encodeURIComponent(checkout.id)}`,'GET');assert(tagged.id===checkout.id&&safeRecord(tagged.metadata)?.jrn02_run_id===runId,'atomic_checkout_tag_guard');await writeReport();send(response,200,{status:'TEST_CHECKOUT_CREATED',checkoutUrl:checkout.url,runId});return;
  }
  if(url.pathname==='/jrn02/a'&&request.method==='GET'){if(resumed){send(response,409,{error:'resumed_run_checkout_locked'});return;}const cookie=sessions.get('A')!.cookie.split('; ').map(c=>`${c}; HttpOnly; SameSite=Lax; Path=/`).join(', ');response.writeHead(200,{'content-type':'text/html; charset=utf-8','set-cookie':cookie,'cache-control':'no-store'});response.end('<!doctype html><title>JRN-02 Test Checkout</title><h1>JRN-02 isolated test checkout</h1><p>This creates a Stripe test-mode Checkout Session for account A.</p><button id="pay">Open test checkout</button><pre id="status"></pre><script>document.getElementById("pay").onclick=async()=>{const r=await fetch("/jrn02/checkout",{method:"POST",credentials:"same-origin"});const x=await r.json();if(r.ok)location.href=x.checkoutUrl;else document.getElementById("status").textContent=x.error||x.status;};</script>');return;}
  if(url.pathname==='/api/billing/webhook'&&request.method==='POST'){
    const payload=await readBody(request),signature=String(request.headers['stripe-signature']??'');let event:StripeWebhookEvent;try{event=await verifyStripeWebhook(payload,signature,webhookSecret);}catch{send(response,400,{error:'stripe_signature_invalid'});return;}
    const object=safeRecord(event.data.object),metadata=safeRecord(object?.metadata);if(event.livemode!==false){send(response,400,{error:'test_event_required'});return;}
    const objId=object?.id,candidateSub=subscriptionIdFromWebhookEvent(event);
    let owned=metadata?.jrn02_run_id===runId || (typeof objId==='string'&&objId===checkoutId) || (typeof objId==='string'&&objId===subscriptionId) || (candidateSub!==null&&candidateSub===subscriptionId);
    if(!owned&&candidateSub){const providerSub=await stripe(`/subscriptions/${encodeURIComponent(candidateSub)}`,'GET');const subMetadata=safeRecord(providerSub.metadata);if(subMetadata?.jrn02_run_id===runId&&subMetadata.workspace_id===sessions.get('A')?.workspaceId){owned=true;subscriptionId=candidateSub;}}
    if(!owned){send(response,200,{received:true,ignored:true});return;}
    const signed=()=>new Request(`${origin}${url.pathname}`,{method:'POST',headers:{'stripe-signature':signature,'content-type':'application/json'},body:payload});const result=await webhookPOST(signed());const resultBody=safeRecord(await result.json());if(result.status===200){knownEvents.add(event.id);eventTypes.set(event.id,event.type);if(candidateSub)subscriptionId=candidateSub;if(typeof objId==='string'&&event.type.startsWith('customer.subscription.'))subscriptionId=objId;if(resultBody?.duplicate!==true){const replay=await webhookPOST(signed()),replayBody=safeRecord(await replay.json());assert(replay.status===200&&replayBody?.duplicate===true,'signed_event_replay_guard');webhookReplayCount++;}await writeReport();}send(response,result.status,resultBody??{error:'invalid_webhook_response'});return;
  }
  send(response,404,{error:'not_found'});
}
async function writeReport(){const a=sessions.get('A'),b=sessions.get('B'),eventHashes=[...new Set([...priorEventHashes,...[...knownEvents].map(id=>createHash('sha256').update(id).digest('hex'))])].sort(),webhookEvents=[...new Set([...priorEventTypes,...eventTypes.values()])].sort();const report={unitId:'JRN-02',runId,status:eventHashes.length?'WEBHOOK_RECEIVED':'LOCAL_READY',origin,localD1:true,actualBetterAuth:true,distinctWorkspaces:a?.workspaceId!==b?.workspaceId,baselineA:'free',baselineB:'free',testCheckoutAdapter:true,productionCheckoutRouteCovered:false,checkoutCreated:Boolean(checkoutId),webhookEvents,eventHashes,signedReplayCount:priorReplayCount+webhookReplayCount,localPath:root,productionChangedByFixture:false};await writeFile(join(root,'report.json'),JSON.stringify(report,null,2)+'\n',{mode:0o600});}
async function stop(){cli?.kill('SIGTERM');await new Promise<void>(yes=>server?.close(()=>yes())??yes());globalThis.fetch=originalFetch;mail.clear();sessions.clear();await mf?.dispose();}
process.once('SIGINT',()=>{void stop().then(()=>process.exit(0));});process.once('SIGTERM',()=>{void stop().then(()=>process.exit(0));});
initialize().catch(async(error)=>{console.error(JSON.stringify({status:'LOCAL_BOOT_FAIL',stage,errorClass:safeError(error),detail:stage==='local_d1'&&error instanceof Error?error.message:undefined,cliDiagnostic:stage==='stripe_cli'?cliDiagnostic:undefined}));await stop();process.exitCode=1;});
