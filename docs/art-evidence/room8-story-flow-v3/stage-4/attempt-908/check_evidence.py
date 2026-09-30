from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import hashlib,subprocess,json,shutil
out=Path(__file__).parent;repo=Path('/home/chernodubv/dev/.cron-worktrees/containment-rooms/breached-loading-bay-v3')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=repo)
base_commit='da59301327264fff7b3ed9583243dcdceff0b525'
base=git('show',base_commit+':src/render/AuthoredRooms.ts').decode();candidate=(repo/'src/render/AuthoredRooms.ts').read_text()
assert base.split('function breachedBay(')[0]==candidate.split('function breachedBay(')[0]
# breachedBay is final builder, followed by the exported authoredRoom function.
after='export function authoredRoom'
assert base.split(after)[1]==candidate.split(after)[1]
for f in ['src/game/roguelike/authoredRoomTopologies.ts','src/game/roguelike/storyRooms.ts','src/game/roguelike/storyRoomTemplates.ts']:
 assert (repo/f).read_bytes()==git('show',base_commit+':'+f)
result=json.loads((out/'capture-result.json').read_text());assert result['passed'] and not result['errors']
for f,h in result['source'].items():assert sha(repo/f)==h
for row in result['rows']:assert sha(out/row['file'])==row['sha256']
before=json.loads((out/'before/capture-result.json').read_text());assert before['passed']
assert before['source']['src/render/AuthoredRooms.ts']==hashlib.sha256(git('show',base_commit+':src/render/AuthoredRooms.ts')).hexdigest()
for row in before['rows']:
 assert sha(out/'before'/row['file'])==row['sha256']
 target=out/('before-'+row['file']);shutil.copy2(out/'before'/row['file'],target)
for a,b in zip(before['rows'],result['rows']):
 assert a['file']==b['file'] and a['metrics']['camera']==b['metrics']['camera'] and a['metrics']['player']==b['metrics']['player']
 assert a['sha256']!=b['sha256']
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',24)
sheet=Image.new('RGB',(1600,1080),'#111b22');draw=ImageDraw.Draw(sheet)
draw.text((24,15),'Room8 stage4 repair, attempt908. Static in-scene model comparison.',font=font,fill='white')
for idx,(name,label) in enumerate([('before-desktop-in-scene.png','Before: pod silhouette and repeated metal teeth'),('desktop-in-scene.png','After: unequal crusts and folded remnants'),('before-overview.png','Before: complete room, fitted overview'),('overview.png','After: same layout, seal, freight and shell')]):
 im=Image.open(out/name).convert('RGB');im.thumbnail((776,474))
 x=16+(idx%2)*800;y=60+(idx//2)*505
 draw.text((x,y),label,font=font,fill='white');sheet.paste(im,(x,y+35))
sheet.save(out/'model-comparison.png')
if not (out/'source.patch').exists():(out/'source.patch').write_bytes(git('diff','--binary',base_commit,'--','src/render/AuthoredRooms.ts','src/render/AuthoredRooms.test.ts'))
for f in ['src/render/AuthoredRooms.ts','src/render/AuthoredRooms.test.ts']:(out/(Path(f).name+'.txt')).write_bytes((repo/f).read_bytes())
images=['before-desktop-in-scene.png','desktop-in-scene.png','before-overview.png','overview.png','model-comparison.png'];rows=[]
for name in images:
 p=out/name
 with Image.open(p) as im:im.load();assert im.width*im.height<=16000000;dims=im.size
 assert p.stat().st_size<=8*1024*1024
 rows.append({'file':name,'sha256':sha(p),'dimensions':dims,'bytes':p.stat().st_size})
assert len({r['sha256'] for r in rows})==len(images)
checks={'passed':True,'images':rows,'runtime_source':result['source'],'source_outside_breachedBay_unchanged':True,'topology_story_templates_unchanged':True,'before_source_matches_head':True,'paired_cameras_and_players':True,'capture_passed':True,'limitations':'Static checkpoint-staged runtime; no full gameplay, network lifecycle or release acceptance.'}
(out/'artifact-checks.json').write_text(json.dumps(checks,indent=2)+'\n')
print(json.dumps(checks,indent=2))
