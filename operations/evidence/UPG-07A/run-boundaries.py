import subprocess,pathlib,json
r=pathlib.Path(__file__).parent
results=[]
for count,variant in [(100000,'normal'),(100001,'normal'),(100000,'baseline'),(100000,'candidate')]:
 p=subprocess.run(['node','qa-independent-boundaries.mjs',str(count),variant],cwd=r,capture_output=True,text=True)
 key=f'{count}-{variant}';(r/f'boundary-{key}-stdout.txt').write_text(p.stdout);(r/f'boundary-{key}-stderr.txt').write_text(p.stderr);results.append({'count':count,'variant':variant,'exitCode':p.returncode});print(json.dumps(results[-1]),flush=True)
 if p.returncode: print(p.stderr);break
(r/'qa-boundary-commands.json').write_text(json.dumps(results,indent=2)+'\n')
raise SystemExit(0 if len(results)==4 and all(x['exitCode']==0 for x in results) else 1)
