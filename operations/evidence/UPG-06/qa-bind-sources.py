import base64, hashlib, json, pathlib, subprocess
r=pathlib.Path(__file__).parent
repo=pathlib.Path('/Users/liukai/Documents/Product Visual QA Platform')
sha='65a8591710caa92b61db555e6e7abc289fc04767'
old='c2740c35da10af34b5524c569211568214b3958c'
base='daaeda7ad55c7b6b065c4c01cf82f53001dd5ba5'
def git(*args): return subprocess.check_output(['git',*args],cwd=repo)
def h(b): return hashlib.sha256(b).hexdigest()
def read(p): return json.loads((r/p).read_text())
original=read('fixtures/release-workbench/checks.json')
repair=read('fixtures/release-workbench/utf8-repair-1/checks.json')
sources=dict(original['sourceSha256']); sources.update(repair['sourceSha256'])
bindings=[]
for p, expected in sources.items():
    committed=h(git('show',sha+':'+p)); actual=h((r/p).read_bytes())
    assert expected==committed==actual, (p,expected,committed,actual)
    bindings.append({'path':p,'sha256':actual,'exactCandidate':True})
for f in ['qa-independent-d1-results.json','qa-review-regression.json','qa-structured-regression.json','fixtures/release-workbench/browser-desktop-results.json','fixtures/release-workbench/browser-narrow-results.json']:
    d=read(f); assert d['status']=='PASS'; assert all(c['status']=='PASS' for c in d['cases'])
    for p, expected in d.get('sources',{}).items():
        actual=h((r/p).read_bytes()); assert expected==actual,(f,p)
        if p not in ['scripts/qa-upg06-attempt2.ts','fixtures/release-workbench/ui-entry.tsx']:
            assert actual==h(git('show',sha+':'+p)),(f,p,'not candidate')
    print(f,len(d['cases']),d.get('requestCount'),d.get('viewport'))
for ancestor in [base,old]: subprocess.run(['git','merge-base','--is-ancestor',ancestor,sha],cwd=repo,check=True)
runtime_delta=[p for p in git('diff','--name-only',old,sha).decode().splitlines() if not p.startswith('fixtures/')]
assert set(runtime_delta)=={'lib/releases/repository.ts','scripts/verify-release-workbench.ts','docs/01-architecture/release-workbench-contract.md'}
build=read('fixtures/release-workbench/build-output.json'); raw=base64.b64decode(build['rawBytesBase64']); assert h(raw)==build['rawSha256'] and build['exitCode']==0
assert h((r/'fixtures/release-workbench/build-output.json').read_bytes())=='073f4a865590e0a0ca642f70df7ea8bdf0ae235ea25ef6d35f02d0832b610d5f'
assert git('show',old+':fixtures/release-workbench/build-output.json')==git('show',sha+':fixtures/release-workbench/build-output.json')
(r/'qa-reused-build-original.txt').write_bytes(raw)
preserved=r/'qa-original-candidate-evidence';preserved.mkdir(exist_ok=True)
developer_artifacts=[]
for manifest in [original,repair]:
    for p,expected in manifest.get('artifacts',{}).items():
        if not p.startswith('fixtures/'): p='fixtures/release-workbench/'+p
        if isinstance(expected,dict): expected=expected['sha256']
        b=git('show',sha+':'+p); assert h(b)==expected,(p,'developer artifact')
        out=preserved/p;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(b)
        developer_artifacts.append({'path':p,'sha256':expected})
for p in ['fixtures/release-workbench/ui-entry.tsx','scripts/qa-upg06-attempt2.ts']:
    (r/('qa-final-'+pathlib.Path(p).name+'.txt')).write_bytes((r/p).read_bytes())
prior=pathlib.Path('/tmp/pairvu-upg06-qa.json');priorhash=h(prior.read_bytes());assert priorhash=='ca282ba845ab596be4d823328bd1c796af24d9c45b9702ecc921d2de8b7b3eac'
durable=repo/'operations/evidence/UPG-06-attempt-1/qa-original.json';assert h(durable.read_bytes())==priorhash
diff=git('diff',base,sha);(r/'qa-full-candidate-diff.txt').write_bytes(diff)
check=subprocess.run(['git','diff','--check',base,sha],cwd=repo,capture_output=True)
(r/'qa-candidate-diff-check.txt').write_bytes(check.stdout+check.stderr)
assert check.returncode==0, check.stdout
status=git('status','--short').decode();(r/'qa-shared-status-final.txt').write_text(status)
report={'candidateSha':sha,'baselineSha':base,'rejectedCandidate':old,'status':'PASS','bindings':bindings,'verifiedReportSources':True,'repairNonFixturePaths':runtime_delta,'build':{'reusedFrom':old,'candidateBuildRerun':False,'artifactSha256':h((r/'fixtures/release-workbench/build-output.json').read_bytes()),'rawSha256':h(raw),'originalExitCode':0,'reason':'Only runtime repair is SQL UTF-8 byte predicates; React/CSS/navigation/routes/interfaces unchanged. Exact candidate independently typechecked and local D1 executed. Prior build is retained evidence, not a full new candidate build claim.'},'originalFailureSha256':priorhash,'preservedDeveloperArtifacts':developer_artifacts,'fixtureOverrides':{'path':'fixtures/release-workbench/ui-entry.tsx','candidateSha256':h(git('show',sha+':fixtures/release-workbench/ui-entry.tsx')),'testedQaSha256':h((r/'fixtures/release-workbench/ui-entry.tsx').read_bytes()),'appSourcesUnchanged':True},'sharedStatus':status,'diffCheckExitCode':check.returncode,'fullDiffSha256':h(diff)}
(r/'qa-source-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':'PASS','sourceBindings':len(bindings),'preservedDeveloperArtifacts':len(developer_artifacts),'originalFailureUnchanged':True,'buildRawVerified':True,'sharedStatus':status},ensure_ascii=False))
