import subprocess,sys,pathlib,json,datetime
r=pathlib.Path(__file__).parent
name=sys.argv[1];args={'specialized':['pnpm','test:reference-view-shadow'],'upg02':['pnpm','test:upgrade-dataset'],'typecheck':['pnpm','exec','tsc','--noEmit']}[name]
p=subprocess.run(args,cwd=r,capture_output=True,text=True)
(r/('qa-'+name+'-stdout.txt')).write_text(p.stdout);(r/('qa-'+name+'-stderr.txt')).write_text(p.stderr)
d={'command':args,'exitCode':p.returncode,'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'stdout':str(r/('qa-'+name+'-stdout.txt')),'stderr':str(r/('qa-'+name+'-stderr.txt'))}
if name=='specialized' and p.returncode==0:
 report=json.loads(p.stdout[p.stdout.index('{'):]);(r/'qa-specialized-results.json').write_text(json.dumps(report,indent=2)+'\n');d.update({k:report[k] for k in ['status','checkCount','cliInvocations','qualityEvidence','realQualityStatus']})
(r/('qa-'+name+'-command.json')).write_text(json.dumps(d,indent=2)+'\n')
print(json.dumps(d));print(p.stdout[-700:] if name!='specialized' else '');print(p.stderr[:1200])
