from pathlib import Path
import hashlib,json,subprocess,socket,re,os
from urllib.parse import urlsplit
from PIL import Image,ImageChops
out=Path(__file__).parent
root=Path('/home/chernodubv/dev/.cron-worktrees/containment-rooms/breached-loading-bay-v3')
ws=out.parents[3]
hashfile=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
pins=json.loads((out/'source-pins-before.json').read_text())
capture=json.loads((out/'capture-result.json').read_text())
assert capture['passed'] and not capture['errors'] and not capture['aborted']
assert len(capture['rows'])==len(pins['matrix'])==4
old={}
for p in (ws/'breached-loading-bay/story-flow-v3').rglob('*.png'):
 if out not in p.parents:old.setdefault(hashfile(p),[]).append(str(p.relative_to(ws)))
images=[]
for row in capture['rows']:
 p=out/row['file'];h=hashfile(p)
 with Image.open(p) as im:
  im.load();assert im.size==(1280,900) and im.format=='PNG'
  dimensions=im.size
 assert h==row['sha256'] and h not in old and p.stat().st_size<8*1024*1024
 m=row['metrics'];assert m['legal'] and not m['loading'] and not m['contextLost'] and m['webglError']==0
 images.append({'file':row['file'],'sha256':h,'dimensions':dimensions,'bytes':p.stat().st_size,'novelAgainstPriorStoryFlowPngs':True,'evidenceClass':'Static checkpoint runtime, not gameplay'})
assert len({r['sha256'] for r in images})==4
changes=[f for f,h in pins['files'].items() if hashfile(root/f)!=h]
assert not changes
policy_changes=[f for f,h in pins['canonicalInputs'].items() if hashfile(ws/f)!=h]
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
status=subprocess.check_output(['git','status','--porcelain'],cwd=root,text=True)
assert head==pins['head'] and not status
subprocess.run(['git','diff','--exit-code','HEAD','--','src','public','package.json','package-lock.json','vite.config.ts','tsconfig.json'],cwd=root,check=True)
pid=capture['pid'];pid_exists=Path(f'/proc/{pid}').exists();assert not pid_exists
address=urlsplit(capture['origin']);sock=socket.socket();sock.settimeout(2)
port_open=sock.connect_ex((address.hostname,address.port))==0;sock.close();assert not port_open
processes=subprocess.check_output(['ps','-eo','pid,ppid,args'],text=True)
relevant=[l for l in processes.splitlines() if any(x in l for x in ['chrome-headless-shell','chromium','/attempt-944/capture.mjs','/node_modules/.bin/vite','esbuild --service'])]
owned=[l for l in relevant if '/attempt-944/capture.mjs' in l or 'chrome-headless-shell' in l or 'chromium' in l or 'esbuild --service' in l]
assert not owned,owned
log=(out/'focused-tests.log').read_text();tests=int(re.search(r'Tests\s+(\d+) passed',log).group(1));files=int(re.search(r'Test Files\s+(\d+) passed',log).group(1))
assert tests==26 and files==4
assert (out/'typecheck.log').stat().st_size==0
report={'head':head,'branch':pins['branch'],'sourceFilesVerifiedUnchanged':len(pins['files']),'changedSourceFiles':changes,'canonicalInputChanges':policy_changes,'gitStatus':status,'images':images,'imageCount':len(images),'priorDistinctPngHashesChecked':len(old),'tests':{'passed':tests,'filesPassed':files,'failures':0,'errors':0,'typecheckExit':0},'capture':{'passed':True,'browserErrors':capture['errors'],'abortedRequests':capture['aborted'],'origin':capture['origin'],'pid':pid},'cleanup':{'capturePidExists':pid_exists,'capturePortOpen':port_open,'ownedProcessesRemaining':owned,'unrelatedProcessesUntouched':relevant}}
(out/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
