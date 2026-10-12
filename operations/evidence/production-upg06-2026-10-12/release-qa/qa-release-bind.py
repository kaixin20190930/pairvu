import json,pathlib,hashlib,subprocess
r=pathlib.Path(__file__).parent;repo=pathlib.Path('/Users/liukai/Documents/Product Visual QA Platform')
old='65a8591710caa92b61db555e6e7abc289fc04767';new='da0e3554b9168d528f6ac2e985e6e4b9ad498838'
def git(*a):return subprocess.check_output(['git',*a],cwd=repo)
def h(b):return hashlib.sha256(b).hexdigest()
def load(p):return json.loads((r/p).read_text())
assert git('rev-parse','HEAD').decode().strip()==new and not git('status','--porcelain')
subprocess.run(['git','merge-base','--is-ancestor',old,new],cwd=repo,check=True)
paths=git('diff','--name-only',old,new).decode().splitlines();assert len(paths)==42
allowed={'wrangler.jsonc','scripts/verify-release-workbench.ts','docs/01-architecture/release-workbench-contract.md','docs/04-roadmap/next-development-batch-2026-10-10.md','docs/04-roadmap/project-progress-2026-10-10.md','operations/README.md','operations/controller-prompt.md','operations/contracts/UPG-06.md','operations/task-registry.json'}
changes=[]
for p in paths:
 assert p in allowed or p.startswith(('operations/evidence/UPG-06','fixtures/release-workbench/enablement-2026-10-12/')),(p,'unexpected diff')
 b=git('show',new+':'+p);assert b==(r/p).read_bytes()
 if p.startswith('operations/evidence/'):assert not p.endswith(('.ts','.tsx','.js','.mjs','.jsx')),(p,'archive compiler input')
 changes.append({'path':p,'sha256':h(b),'bytes':len(b),'category':'enablement configuration' if p=='wrangler.jsonc' else 'verification assertion' if p=='scripts/verify-release-workbench.ts' else 'evidence' if p.startswith(('operations/evidence/','fixtures/')) else 'documentation/controller state'})
oldcfg=git('show',old+':wrangler.jsonc');newcfg=git('show',new+':wrangler.jsonc');assert oldcfg.replace(b'"RELEASE_WORKBENCH_ENABLED": "false"',b'"RELEASE_WORKBENCH_ENABLED": "true"',1)==newcfg
olds=git('show',old+':scripts/verify-release-workbench.ts');news=git('show',new+':scripts/verify-release-workbench.ts')
assert olds.replace(b'default-off flag is exact and production configuration is false',b'code default remains off/strict and authorized production configuration is enabled',1).replace(b'/"RELEASE_WORKBENCH_ENABLED": "false"/',b'/"RELEASE_WORKBENCH_ENABLED": "true"/',1)==news
binding=load('operations/evidence/UPG-06/qa-source-verification.json'); reused=[]
for x in binding['bindings']:
 p=x['path']
 if p in ['wrangler.jsonc','scripts/verify-release-workbench.ts','docs/01-architecture/release-workbench-contract.md']:continue
 assert h(git('show',new+':'+p))==x['sha256'];reused.append(x)
archive=load('operations/evidence/UPG-06/archive-index.json')
for x in archive:
 p='operations/evidence/UPG-06/'+x['archive'];assert h((r/p).read_bytes())==x['sha256'];original=pathlib.Path(x['source']);assert original.exists() and h(original.read_bytes())==x['sha256']
originalreport=(r/'operations/evidence/UPG-06.json').read_bytes();assert h(originalreport)=='a7de5a3ebf922a44e51cb86212648ed2851f36437beeef56cfbbb659aa0f0d11';assert originalreport==pathlib.Path('/tmp/pairvu-upg06-qa-attempt2.json').read_bytes()
fail=(r/'operations/evidence/UPG-06-attempt-1/qa-original.json').read_bytes();assert h(fail)=='ca282ba845ab596be4d823328bd1c796af24d9c45b9702ecc921d2de8b7b3eac';assert fail==pathlib.Path('/tmp/pairvu-upg06-qa.json').read_bytes()
index=load('operations/evidence/UPG-06-attempt-1/qa-source-index.json');first=[]
for p in paths:
 if p.startswith('operations/evidence/UPG-06-attempt-1/') and p not in ['operations/evidence/UPG-06-attempt-1/qa-original.json','operations/evidence/UPG-06-attempt-1/qa-source-index.json']:
  mapped=pathlib.Path(p).name.removesuffix('.txt');match=next(x for x in index['artifacts'] if pathlib.Path(x['path']).name==mapped);assert h((r/p).read_bytes())==match['sha256'];first.append(p)
receipt=load('operations/evidence/UPG-06-cli.json');original=json.loads(originalreport);assert receipt['candidateSha']==old and receipt['result']==original['result']=='PASS';assert receipt['checks']==[{'name':c['name'],'status':c['result']} for c in original['checks']]
enable=load('fixtures/release-workbench/enablement-2026-10-12/checks.json')
for p,expected in enable['sourceSha256'].items():assert h((r/p).read_bytes())==expected
assert h((r/'fixtures/release-workbench/enablement-2026-10-12/d1-results.json').read_bytes())==enable['reportSha256']
for p in git('ls-tree','-r','--name-only',new,'operations/evidence/UPG-06','operations/evidence/UPG-06-attempt-1').decode().splitlines():assert not p.endswith(('.ts','.tsx','.js','.jsx','.mjs'))
result=load('qa-release-d1-results.json');assert result['status']=='PASS' and len(result['cases'])==77 and result['requestCount']==1853 and all(c['status']=='PASS' for c in result['cases'])
for p,expected in result['sources'].items():
 b=(r/'qa-tested-release.ts.txt').read_bytes() if p=='scripts/qa-upg06-release.ts' else (r/p).read_bytes();assert h(b)==expected
 if p!='scripts/qa-upg06-release.ts':assert b==git('show',new+':'+p)
assert h((r/'qa-complete-release-diff.txt').read_bytes())==h(git('diff',old,new))
out={'qaCandidateSha':old,'releaseSha':new,'status':'PASS','completeDelta':changes,'priorSourceBindingsReused':reused,'archiveEntriesChecked':len(archive),'firstFailureArchiveFilesChecked':first,'originalReportHash':h(originalreport),'originalFailureHash':h(fail),'cliAdapterExactConclusionMapping':True,'compilerInputSafety':'Evidence source files end .ts.txt/.tsx.txt; no JS/TS inputs in new UPG06 evidence archive. tsconfig allowJs=false remains unchanged.','allApplicationImplementationUnchanged':True,'exactConfigDeltaVerified':True,'exactAssertionDeltaVerified':True,'developerEnablementSourcesAndReportHashVerified':True,'independentD1Cases':77,'independentD1Requests':1853,'missingFalseAndNonexactValues':result['cases'][41] if result['cases'][41]['name'].startswith('Independent') else next(c for c in result['cases'] if c['name'].startswith('Independent')),'originalQAReuse':'Prior full independent 91 D1/52 UI/35 review/49 structured + workspace verification reused for unchanged implementation. No claim of reexecuting all UI/build.'}
(r/'qa-release-source-check.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':'PASS','changedFiles':len(paths),'archivedArtifacts':len(archive),'unchangedPriorSourceBindings':len(reused),'D1Cases':77,'D1Requests':1853}))
