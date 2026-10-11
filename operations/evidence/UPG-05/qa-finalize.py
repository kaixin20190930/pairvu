import base64,datetime,hashlib,json,pathlib,subprocess
ROOT=pathlib.Path("/private/tmp/pairvu-upg05-qa-yfej9sy1")
REPO=pathlib.Path("/Users/liukai/Documents/Product Visual QA Platform")
SHA="736e61f7b7c1ffe4e886ef4b5821d79049265621"
BASE="d4c6387a9e05f0da7fc5ab1ef930f4d1b3c2f065"
def digest(b): return hashlib.sha256(b).hexdigest()
def read(p): return json.loads((ROOT/p).read_text())
def save(p,v): pathlib.Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+"\n")
def git(*args): return subprocess.check_output(["git",*args],cwd=REPO)
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
source=read("qa-source-verification.json")
sources=[]
overrides=[]
for record in source["candidateSources"]:
    p=record["path"]; committed=git("show",SHA+":"+p); actual=(ROOT/p).read_bytes()
    assert digest(committed)==record["sha256"],p
    r={**record,"currentQaArchiveSha256":digest(actual),"currentQaArchiveMatchesCandidate":actual==committed}
    if actual!=committed:
        assert p=="fixtures/review-decisions/ui-entry.tsx",p
        original=(ROOT/"qa-original-ui-entry.tsx.txt").read_bytes()
        assert original==committed
        overrides.append({"path":p,"scope":"QA temporary test fixture only; production component source unchanged","originalSha256":digest(original),"executedSha256":digest(actual),"originalPath":str(ROOT/"qa-original-ui-entry.tsx.txt"),"reason":"Four independent UI scenarios per viewport added to the controlled test entry."})
    sources.append(r)
source["candidateSources"]=sources
source["qaFixtureOverrides"]=overrides
source["finalVerifiedAt"]=now
source["finalSharedWorkingTreeStatus"]=git("status","--short").decode()
assert source["finalSharedWorkingTreeStatus"]==" M docs/04-roadmap/project-progress-2026-10-10.md\n M operations/task-registry.json\n"
assert subprocess.run(["git","merge-base","--is-ancestor",BASE,SHA],cwd=REPO).returncode==0
assert subprocess.run(["git","diff","--check",BASE,SHA],cwd=REPO).returncode==0
originals=ROOT/"qa-original-candidate-evidence"
original_entries=[]
for p in git("ls-tree","-r","--name-only",SHA,"fixtures/review-decisions").decode().splitlines():
    if p.endswith((".json",".png")):
        data=git("show",SHA+":"+p)
        out=originals/pathlib.Path(p).name
        out.parent.mkdir(parents=True,exist_ok=True); out.write_bytes(data)
        original_entries.append({"committedPath":p,"savedOriginalPath":str(out),"sha256":digest(data),"candidateSha":SHA})
source["preservedCandidateOriginalEvidence"]=original_entries
build=read("fixtures/review-decisions/build-output.json")
assert build["exitCode"]==0
raw=base64.b64decode(build["rawBytesBase64"])
assert digest(raw)==build["rawSha256"]==source["buildReuse"]["rawSha256"]
source["buildReuse"]["verification"]="Original terminal bytes SHA-256 and exit code verified; 16 committed source hashes verified before QA test-fixture override. Build was not independently rerun."
d1=read("qa-independent-d1-results.json")
structured=read("qa-structured-regression.json")
desktop=read("fixtures/review-decisions/browser-desktop-results.json")
narrow=read("fixtures/review-decisions/browser-narrow-results.json")
for report,count in [(d1,43),(structured,49),(desktop,19),(narrow,19)]:
    assert report["status"]=="PASS" and len(report["cases"])==count
    assert all(x["status"]=="PASS" for x in report["cases"])
assert sum(x["name"].startswith("QA ") for x in d1["cases"])==8
for report in [desktop,narrow]:
    assert not report["errors"]
    assert sum(x["name"].startswith("QA ") for x in report["cases"])==4
    for p,h in report["sources"].items(): assert digest((ROOT/p).read_bytes())==h
assert narrow["cases"][13]["detail"]["viewport"]==373
save(ROOT/"qa-source-verification.json",source)
commands=[
 {"command":"git archive 736e61f7b7c1ffe4e886ef4b5821d79049265621","cwd":str(REPO),"result":"PASS","detail":"Candidate archive unpacked in isolated /private/tmp; shared node_modules symlink; no shared source writes."},
 {"command":"pnpm exec tsx scripts/qa-upg05-independent.ts --report qa-independent-d1-results.json","cwd":str(ROOT),"exitCode":0,"result":"PASS","evidence":str(ROOT/"qa-independent-d1-results.json"),"cases":43,"detail":"Observed successful process completion; 798 actual local D1 transport requests; 8 independently added cases and 35 replayed candidate cases."},
 {"command":"pnpm test:structured-evidence --report qa-structured-regression.json","cwd":str(ROOT),"exitCode":0,"result":"PASS","evidence":str(ROOT/"qa-structured-regression.json"),"cases":49,"detail":"UPG-04 structured-evidence regression suite reused as regression; report retains original unitId UPG-04."},
 {"command":"pnpm test:m1:workspace-analysis","cwd":str(ROOT),"exitCode":0,"result":"PASS","observedStdout":"M1 workspace analysis verification passed.\nVerified workspace ownership, anonymous isolation, retention, idempotency, and credit lifecycle wiring."},
 {"command":"pnpm exec tsc --noEmit","cwd":str(ROOT),"exitCode":0,"result":"PASS","detail":"Observed completion with no output, after independent QA fixtures were added."},
 {"command":"node fixtures/review-decisions/ui-server.mjs","cwd":str(ROOT),"result":"PASS","url":"http://127.0.0.1:59069","detail":"Actual React browser tests via CUA. Temporary QA browser tab closed; listener absence verified with lsof after cleanup."},
 {"command":"CUA browser execution: desktop and same-origin narrow iframe fixture","result":"PASS","evidence":[str(ROOT/"fixtures/review-decisions/browser-desktop-results.json"),str(ROOT/"fixtures/review-decisions/browser-narrow-results.json")],"cases":38,"detail":"19 cases each; 4 independently added per viewport. 375px iframe, 373px content viewport. Older-result test uses actual ProductChecker remount."},
 {"command":build["command"],"result":"REUSED_DEVELOPER_EVIDENCE","exitCode":0,"evidence":str(ROOT/"fixtures/review-decisions/build-output.json"),"rawSha256":build["rawSha256"],"detail":"Explicitly permitted one developer build; not independently rerun."},
 {"command":"git diff --check "+BASE+" "+SHA,"cwd":str(REPO),"exitCode":0,"result":"PASS"},
 {"command":"git merge-base --is-ancestor "+BASE+" "+SHA,"cwd":str(REPO),"exitCode":0,"result":"PASS"},
 {"command":"git status --short","cwd":str(REPO),"exitCode":0,"result":"PASS","observedStdout":source["finalSharedWorkingTreeStatus"],"detail":"Existing controller documentation/registry edits preserved."},
 {"command":"lsof -nP -iTCP:59069 -sTCP:LISTEN","exitCode":1,"result":"PASS","detail":"No output/no listening local QA server after cleanup."}
]
save(ROOT/"qa-command-results.json",{"reviewedAt":now,"commands":commands,"rawEvidenceNote":"Reports are original assertion output; observed stdout is included only where retained. No claim of complete raw terminal logs for typecheck/workspace run.","toolIncidents":[{"scope":"CUA initial tab creation","detail":"Completed after approximately 501 seconds despite requested 20-second timeout; no actual approval prompt or denial observed."},{"scope":"QA locator","detail":"Unscoped human-review heading matched main and anonymous fixture; corrected to #checker before click. Test harness locator error, not a product failure."},{"scope":"Initial orchestration","detail":"One JavaScript syntax error before nested tools executed; corrected before archive creation."}]})
files=[
 "qa-candidate-sha.txt","qa-source-verification.json","qa-command-results.json",
 "qa-independent-d1-results.json","qa-structured-regression.json",
 "scripts/qa-upg05-independent.ts","fixtures/review-decisions/ui-entry.tsx",
 "fixtures/review-decisions/ui-server.mjs","fixtures/review-decisions/sql-worker.mjs",
 "fixtures/review-decisions/browser-desktop-results.json","fixtures/review-decisions/browser-narrow-results.json",
 "qa-original-ui-entry.tsx.txt","qa-browser-full.txt","qa-browser-final-dom.json","qa-browser-human-panel.png",
 "fixtures/review-decisions/build-output.json"
]
files+= [str(x.relative_to(ROOT)) for x in originals.iterdir()]
files+= [str(x.relative_to(ROOT)) for x in ROOT.glob("persisted-*.json")]
index={"candidateSha":SHA,"reviewedAt":now,"artifacts":[{"path":str(ROOT/p),"sha256":digest((ROOT/p).read_bytes()),"bytes":(ROOT/p).stat().st_size} for p in files]}
save(ROOT/"qa-source-index.json",index)
def check(name,detail,evidence=None): return {"name":name,"status":"PASS","detail":detail,"evidence":evidence or []}
checks=[
check("fixed candidate SHA","Fixed committed archive at "+SHA+"; baseline ancestry, full diff, source hashes and final whitespace checks passed.",[str(ROOT/"qa-source-verification.json")]),
check("independent QA report","Independent reviewer constructed 8 additional D1 and 8 additional viewport UI cases, executed tests in isolated archive, and did not edit shared application source.",[str(ROOT/"qa-command-results.json"),str(ROOT/"qa-source-index.json")]),
check("authenticated actor and workspace isolation","Real API route and request-access resolver with controlled session/account boundaries: anonymous/foreign/forged actor/workspace/time rejected; inactive membership and ownership race leave no audit event.",[str(ROOT/"qa-independent-d1-results.json")]),
check("D1 CAS, idempotency and atomic rollback","43 cases, 798 local workerd D1 requests; two-worker same-base and same-key payload races; 7 batch failure boundaries, existing-head rollback, zero-row final guard and lost response retries passed.",[str(ROOT/"qa-independent-d1-results.json")]),
check("append-only audit, revoke and retention","Approve/reject/revoke/re-decide chain and machine snapshot hash retained; UPDATE/DELETE/REPLACE blocked; parent RESTRICT and existing asset tombstone/expiry compatibility passed.",[str(ROOT/"qa-independent-d1-results.json")]),
check("actual React browser desktop and narrow","19 cases per viewport; 409 draft retention/failed refresh/manual reconfirmation, committed and uncommitted 503 stable-payload retry, escaped HTML, anonymous isolation, machine DOM unchanged and older-result remount passed. Narrow content width 373px; panel and scroll width both 339px.",[str(ROOT/"fixtures/review-decisions/browser-desktop-results.json"),str(ROOT/"fixtures/review-decisions/browser-narrow-results.json"),str(ROOT/"qa-browser-human-panel.png")]),
check("related regressions and typecheck","49 structured-evidence regression cases, workspace-analysis regression and tsc --noEmit passed.",[str(ROOT/"qa-structured-regression.json"),str(ROOT/"qa-command-results.json")]),
check("one build evidence reuse","Developer's successful build terminal bytes and bound source hashes verified; no independent QA build rerun.",[str(ROOT/"fixtures/review-decisions/build-output.json"),str(ROOT/"qa-source-verification.json")])
]
report={
"unitId":"UPG-05","candidateSha":SHA,"baselineSha":BASE,"reviewerThreadId":"01a1248d-0f67-7333-8dca-5c4696459457","result":"PASS","reviewedAt":now,"checks":checks,
"reviewRole":{"role":"independent acceptance","controllerSelectedModel":"gpt-6.1-sol","controllerSelectedReasoningEffort":"high","rationale":"Cross-session ownership, real D1 concurrency/rollback, audit integrity and UI recovery require independent adversarial acceptance.","escalationCondition":"Repeated failure attributable to reasoning insufficiency; environment failure alone does not justify escalation.","runtimeSettingNote":"Controller-selected role recorded; QA did not use a model-setting tool or claim to change actual runtime."},
"evidenceDirectory":str(ROOT),"sourceIndex":str(ROOT/"qa-source-index.json"),"sourceIndexSha256":digest((ROOT/"qa-source-index.json").read_bytes()),"commandResults":str(ROOT/"qa-command-results.json"),
"counts":{"localD1":43,"localD1TransportRequests":798,"browserDesktop":19,"browserNarrow":19,"structuredRegression":49,"independentNewD1Cases":8,"independentNewBrowserCases":8},
"evidencePreservation":{"originalCandidateEvidence":str(originals),"originalFailureEvidencePreserved":True,"sharedWorkingTreeEditsByQA":False,"details":"Candidate failure and success artifacts preserved byte-for-byte from Git. QA fixture modifications and new test outputs exist only in /private/tmp. Controller registry/roadmap changes preserved."},
"limitations":[
"Local independent acceptance only. No production deployment, feature enablement or production acceptance claim.",
"Actual local workerd D1 and production migrations/repositories/API used; session and account boundaries controlled. No production authentication, remote D1/replicas, model, payment or R2 calls.",
"Actual candidate React components rendered with synthetic session/API responses. Narrow screen verified using 375px iframe/373px content viewport, not a separate mobile device.",
"Older completed-result isolation verified by actual ProductChecker remount; production parent keys the review component by analysis ID. No claim of an in-place standalone prop-switch test.",
"Append-only audit applies to ordinary business SQL constrained by triggers/FKs; privileged schema administrators are outside this guarantee. Future account hard-delete requires an explicit retention policy.",
"Build verification reuses developer evidence by explicit budget authorization; it is not an independently executed QA build.",
"Raw D1/browser/regression assertion outputs, commands and hashes saved; complete raw stdout for every shell command was not retained."
],
"completion":{"implementation":"Independent acceptance PASS for the exact candidate.","deployment":"Not authorized; not performed.","featureEnablement":"Not performed in production.","acceptance":"Local fixed-SHA acceptance PASS; eligible for controller RELEASE_READY, not production verification.","nextAction":"Controller imports this report, binds it to the exact candidate, and records RELEASE_READY.","dependency":"Controller report import; production release subsequently requires explicit user authorization and the repository GitHub-first deployment sequence.","proceedAutomatically":"Controller can automatically record RELEASE_READY; production release requires user input."}
}
save("/tmp/pairvu-upg05-qa.json",report)
assert json.loads(pathlib.Path("/tmp/pairvu-upg05-qa.json").read_text())["result"]=="PASS"
print(json.dumps({"report":"/tmp/pairvu-upg05-qa.json","sha256":digest(pathlib.Path("/tmp/pairvu-upg05-qa.json").read_bytes()),"result":"PASS","counts":report["counts"],"sourceIndexSha256":report["sourceIndexSha256"]}))

