import pathlib,subprocess,os,datetime,json
r=pathlib.Path('/tmp/pairvu-upg06-production')
for p in ['d1-read-stdout.txt','d1-read-stderr.txt','d1-read-command.json']:
 (r/p).rename(r/(p.replace('.', '-initial.',1)))
sql=(r/'exact-synthetic-read.sql').read_text()
assert all(s.strip().upper().startswith('SELECT') for s in sql.split(';') if s.strip())
env=dict(os.environ);env['WRANGLER_LOG_PATH']=str(r/'wrangler-read-logs')
p=subprocess.run(['pnpm','exec','wrangler','d1','execute','pairvu-production','--remote','--command',sql,'--json'],cwd='/private/tmp/pairvu-upg06-release-qa-n1xax86c',env=env,capture_output=True,text=True)
(r/'d1-read-stdout.txt').write_text(p.stdout);(r/'d1-read-stderr.txt').write_text(p.stderr)
(r/'d1-read-command.json').write_text(json.dumps({'command':'set -a / source .dev.vars / set +a; pnpm exec wrangler d1 execute pairvu-production --remote --command [exact-synthetic-read.sql] --json','exitCode':p.returncode,'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z'),'readOnlySelects':6,'stdout':str(r/'d1-read-stdout.txt'),'stderr':str(r/'d1-read-stderr.txt')},indent=2)+'\n')
print('exit',p.returncode,'stdoutBytes',len(p.stdout),'stderr',p.stderr[:1000])
if p.returncode==0:
 d=json.loads(p.stdout);(r/'d1-exact-rows.json').write_text(json.dumps(d,indent=2)+'\n');print([(x.get('success'),len(x.get('results',[])),x.get('meta',{}).get('rows_written')) for x in d])
