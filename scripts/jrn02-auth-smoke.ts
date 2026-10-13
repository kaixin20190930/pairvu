import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {mkdtemp,readFile,readdir,stat,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createRequire} from 'node:module';
import {createPairvuAuth} from '../lib/auth/server';
import {getWorkspaceAccountSnapshot} from '../lib/accounts/repository';
import type {VisualQACloudflareEnv} from '../lib/cloudflare/bindings';

const inputPath='/private/tmp/pairvu-stripe-sandbox-input.json';
const require=createRequire(resolve('package.json'));
const wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=wranglerRequire('miniflare');
function split(source:string){const out:string[]=[];let buffer='',quote=false,comment=false;for(let i=0;i<source.length;i++){const c=source[i];if(comment){if(c==='\n'){comment=false;buffer+='\n';}continue;}if(!quote&&c==='-'&&source[i+1]==='-'){comment=true;i++;continue;}buffer+=c;if(c==="'"){if(quote&&source[i+1]==="'"){buffer+=source[++i];continue;}quote=!quote;}if(c===';'&&!quote&&(!/^\s*create\s+trigger/i.test(buffer)||/\bend\s*;$/i.test(buffer))){out.push(buffer.trim());buffer='';}}if(buffer.trim())out.push(buffer.trim());return out;}

async function main(){
  const inputFile=await stat(inputPath);assert(inputFile.isFile()&&(inputFile.mode&0o077)===0,'private_input_guard');
  const privateInput=JSON.parse(await readFile(inputPath,'utf8')) as Record<string,unknown>;
  const a=privateInput.PAIRVU_TEST_EMAIL_A,b=privateInput.PAIRVU_TEST_EMAIL_B;
  if(typeof a!=='string'||typeof b!=='string'||a===b)throw Error('invalid_private_test_identities');
  const root=await mkdtemp(join(tmpdir(),'pairvu-jrn02-auth-'));
  const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("local-only")}}',compatibilityDate:'2026-07-26',d1Databases:{DB:'jrn02-local'},d1Persist:join(root,'d1'),outboundService:async()=>new Response('Outbound disabled',{status:403})});
  const originalFetch=globalThis.fetch;
  const mail=new Map<string,string>();
  let stage='migrations',outbound=0;
  try{
    const db=await mf.getD1Database('DB');
    for(const file of (await readdir('migrations')).filter(name=>name.endsWith('.sql')).sort()){
      const statements=split(await readFile(join('migrations',file),'utf8'));
      await db.batch(statements.map(sql=>db.prepare(sql)));
    }
    const env={VISUALQA_DB:db,BETTER_AUTH_URL:'http://127.0.0.1:3107',BETTER_AUTH_SECRET:randomBytes(32).toString('hex'),AUTH_TRUSTED_ORIGINS:'http://127.0.0.1:3107',RESEND_API_KEY:'local-capture-only',AUTH_EMAIL_FROM:'no-reply@local.invalid'} as VisualQACloudflareEnv;
    globalThis.fetch=(async(input:RequestInfo|URL,init?:RequestInit)=>{
      const target=String(input);
      if(target!=='https://api.resend.com/emails'){outbound++;throw Error('outbound_blocked');}
      const body=JSON.parse(String(init?.body)) as {to:string[];text:string};
      if(![a,b].includes(body.to[0]))throw Error('unexpected_email_recipient');
      const link=body.text.match(/http:\/\/127\.0\.0\.1:3107\/api\/auth\/magic-link\/verify\?[^\s]+/)?.[0];
      if(!link)throw Error('local_magic_link_missing');
      mail.set(body.to[0],link);
      return Response.json({id:'local-capture'}, {status:200});
    }) as typeof fetch;
    const auth=createPairvuAuth(env);
    const results=[] as Array<{alias:string;workspacePresent:boolean;free:boolean;available:number;cookieValid:boolean}>;
    const workspaceIds=new Set<string>();
    for(const [alias,email] of [['A',a],['B',b]] as const){
      stage=`${alias}_magic_link`;
      const sent=await auth.handler(new Request('http://127.0.0.1:3107/api/auth/sign-in/magic-link',{method:'POST',headers:{'content-type':'application/json',origin:'http://127.0.0.1:3107'},body:JSON.stringify({email,callbackURL:'/account'})}));
      assert.equal(sent.status,200,'magic link request must succeed');
      const url=mail.get(email);assert(url,'mail must be captured locally');
      stage=`${alias}_verification`;
      const verified=await auth.handler(new Request(url,{headers:{origin:'http://127.0.0.1:3107'}}));
      assert([200,302].includes(verified.status));
      const cookies=verified.headers.getSetCookie().map(cookie=>cookie.split(';')[0]).join('; ');
      assert(cookies.includes('session_token'),'actual auth must set a session cookie');
      stage=`${alias}_session`;
      const session=await auth.api.getSession({headers:new Headers({cookie:cookies})});
      assert.equal(session?.user?.email,email);
      const account=await getWorkspaceAccountSnapshot(db,{id:String(session.user.id),name:String(session.user.name??''),email:String(session.user.email)});
      assert.equal(account.planCode,'free');
      workspaceIds.add(account.workspaceId);
      results.push({alias,workspacePresent:Boolean(account.workspaceId),free:account.planCode==='free',available:account.available,cookieValid:true});
      mail.delete(email);
    }
    assert.equal(results.length,2);
    assert.equal(workspaceIds.size,2);
    assert.equal(outbound,0);
    const report={unitId:'JRN-02',status:'AUTH_LOCAL_PASS',actualBetterAuth:true,localMagicLinkCapture:true,realEmailSent:false,localD1:true,uniqueWorkspaces:true,accounts:results,remoteWrites:0,outboundBlocked:outbound,temporaryDirectory:root,limitations:['This verifies actual local Better Auth and workspace creation, not Google OAuth or Stripe payment.','Session cookies and magic links are retained only in process memory and never written to the report.']};
    await writeFile(resolve(process.argv[2]??join(root,'auth-results.json')),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({status:report.status,actualBetterAuth:true,accounts:2,localD1:true,realEmailSent:false,remoteWrites:0}));
  }catch(error){console.error(JSON.stringify({status:'AUTH_LOCAL_FAIL',stage,errorCode:error instanceof Error?error.name:'unknown'}));process.exitCode=1;}
  finally{globalThis.fetch=originalFetch;mail.clear();await mf.dispose();}
}
main().catch(()=>{console.error(JSON.stringify({status:'AUTH_LOCAL_FAIL',stage:'bootstrap'}));process.exitCode=1;});
