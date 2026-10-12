import subprocess,pathlib,json
r=pathlib.Path(__file__).parent
results=[]
for variant in ['baseline','candidate']:
 p=subprocess.run(['node','qa-independent-boundaries.mjs','100000',variant],cwd=r,capture_output=True,text=True)
 (r/f'prediction-{variant}-stdout.txt').write_text(p.stdout);(r/f'prediction-{variant}-stderr.txt').write_text(p.stderr);results.append({'count':100000,'variant':variant,'exitCode':p.returncode});print(json.dumps(results[-1]),flush=True)
 if p.returncode:print(p.stderr);break
(r/'qa-prediction-boundary-commands.json').write_text(json.dumps(results,indent=2)+'\n')
raise SystemExit(0 if len(results)==2 and all(x['exitCode']==0 for x in results) else 1)
