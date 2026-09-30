from pathlib import Path
import hashlib,json,subprocess
root=Path('/home/chernodubv/dev/.cron-worktrees/containment-rooms/breached-loading-bay-v3')
out=Path(__file__).parent
ws=out.parents[3]
prior=ws/'breached-loading-bay/story-flow-v3/stage-4/attempt-909/capture.mjs'
s=prior.read_text()
s=s.replace('Room8 stage4 attempt909 AFTER, newly captured static paused runtime','Room8 stage5 attempt944 overall, fresh static checkpoint runtime, NOT gameplay')
s=s.replace("const origin=server.resolvedUrls.local[0];","const origin=server.resolvedUrls.local[0];result.origin=origin;result.pid=process.pid;result.startedAt=new Date().toISOString();")
s=s.replace("for(const mode of ['desktop-in-scene','overview']){","for(const pose of [{mode:'desktop-entry-static',x:240,y:320},{mode:'desktop-north-static',x:570,y:150},{mode:'desktop-south-static',x:590,y:620},{mode:'overview-static',x:1020,y:360}]){\n  const mode=pose.mode;")
s=s.replace('page.evaluate(async mode=>{','page.evaluate(async pose=>{\n   const mode=pose.mode;')
s=s.replace('x:650,y:650,moving:false','x:pose.x,y:pose.y,moving:false')
s=s.replace("mode==='overview'","mode==='overview-static'")
s=s.replace('new T.Vector3(0,36,26)','new T.Vector3(0,48,18)')
s=s.replace('},mode);','},pose);')
s=s.replace("player:{x:g.player.x,y:g.player.y},","player:{x:g.player.x,y:g.player.y,radius:g.player.radius},enemyCount:g.enemies?.length,captureClass:'static checkpoint, not gameplay',")
s=s.replace("const file=mode+'.png'","await page.evaluate(()=>document.fonts.ready);\n  const file=mode+'.png'")
s=s.replace("result.cleanup='owned Chromium and Vite closed';","result.cleanup='owned Chromium and Vite closed';result.finishedAt=new Date().toISOString();")
(out/'capture.mjs').write_text(s)
def git(*args):return subprocess.check_output(['git',*args],cwd=root,text=True).strip()
assert git('rev-parse','HEAD')=='2502fe91f79f3a8635bca08a09be2a4309f32055'
assert git('branch','--show-current')=='art/breached-loading-bay-v3'
assert not git('status','--porcelain')
files=git('ls-files','src','public','package.json','package-lock.json','vite.config.ts','tsconfig.json').splitlines()
pins={f:hashlib.sha256((root/f).read_bytes()).hexdigest() for f in files if (root/f).is_file()}
policies=['map-model-production.md','production-guard.md','map-model-state.json','human-review-queue.json','breached-loading-bay/story-flow-v3/brief.md']
manifest={'head':git('rev-parse','HEAD'),'branch':git('branch','--show-current'),'beforeStatus':git('status','--porcelain'),'files':pins,'canonicalInputs':{f:hashlib.sha256((ws/f).read_bytes()).hexdigest() for f in policies},'captureAdaptedFrom':str(prior),'capturePriorSha256':hashlib.sha256(prior.read_bytes()).hexdigest(),'matrix':[{'file':'desktop-entry-static.png','purpose':'West entry approach and upper freight route','player':[240,320]},{'file':'desktop-north-static.png','purpose':'North loop against the sealed scar','player':[570,150]},{'file':'desktop-south-static.png','purpose':'South loop, freight pads and exit approach','player':[590,620]},{'file':'overview-static.png','purpose':'Whole-room routes and assemblies from a higher capture-only fit','player':[1020,360]}]}
(out/'source-pins-before.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'sourceFilesPinned':len(pins),'capture':str(out/'capture.mjs'),'matrixRows':len(manifest['matrix'])}))
