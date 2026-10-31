from pathlib import Path
import subprocess, hashlib, json, shutil
from PIL import Image, ImageChops, ImageDraw, ImageFont
root=Path('/home/chernodubv/dev/.cron-worktrees/containment-rooms/breached-loading-bay-v3')
out=Path(__file__).parent
base='e54d86af8c1d3bea95d86dce3982cd2dc1d6604c'
def git(*args):return subprocess.check_output(['git',*args],cwd=root)
def sha(b):return hashlib.sha256(b).hexdigest()
assert git('rev-parse','HEAD').decode().strip()==base
assert git('branch','--show-current').decode().strip()=='art/breached-loading-bay-v3'
source='src/render/AuthoredRooms.ts'
before=git('show',base+':'+source).decode();after=(root/source).read_text()
def outside(s):
 a=s.index('function breachedBay(');b=s.index('function reactorFloor(',a)
 return s[:a]+s[b:]
assert outside(before)==outside(after)
changed=git('diff','--name-only').decode().splitlines()
assert changed==['src/render/AuthoredRooms.test.ts',source],changed
pins={}
for f in git('ls-files','src').decode().splitlines():
 old=git('show',base+':'+f);new=(root/f).read_bytes()
 if f not in changed:assert old==new,f
 pins[f]={'before':sha(old),'after':sha(new)}
brief=out.parents[1]/'brief.md'
assert sha(brief.read_bytes())=='34a50f7bd217d37799e265db3735f7c73c2778b209125cd2a4b1dc7d0d65b6a9'
previous=out.parents[1]/'stage-3/attempt-905'
images=[]
capture=json.loads((out/'capture-result.json').read_text());assert capture['passed'] and not capture['errors']
for name,oldname in [('overview.png','before-overview-stage3-pinned.png'),('desktop-in-scene.png','before-desktop-stage3-pinned.png')]:
 old=git('show',base+':docs/art-evidence/room8-story-flow-v3/stage-3/attempt-905/'+name)
 assert old==(out/oldname).read_bytes()==(previous/name).read_bytes()
 im=Image.open(out/name);im.load();assert im.size==(1280,900)
 original=Image.open(out/oldname)
 bbox=ImageChops.difference(im.convert('RGB'),original.convert('RGB')).getbbox();assert bbox
 h=sha((out/name).read_bytes());assert h!=sha(old)
 assert next(r['sha256'] for r in capture['rows'] if r['file']==name)==h
 images.extend([{'file':name,'sha256':h,'changedPixelBoundingBox':bbox,'class':'novel stage4 runtime after'},{'file':oldname,'sha256':sha(old),'class':'exact pinned stage3 before','commit':base}])
# Context crops retain adjacent deck and assemblies. No painted-over render pixels.
canvas=Image.new('RGB',(1440,1160),'#111c22');draw=ImageDraw.Draw(canvas)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
large=ImageFont.truetype(font,26);small=ImageFont.truetype(font,17)
draw.text((28,18),'Room8 / stage4 model iteration / attempt906',font=large,fill='#e1e6df')
draw.text((28,57),'Completed model work in context. Crops of actual after renders; not overall room acceptance.',font=small,fill='#bbc7c8')
rows=[('Boarding body and connected seam colonies','desktop-in-scene.png',(448,178,1098,559),(28,106,905,696)),('East fixture cladding','overview.png',(1035,477,1154,584),(946,106,1410,526)),('Pressure freight / fork sockets','desktop-in-scene.png',(246,550,418,674),(28,757,548,1118)),('Outbound pallet / skids, deck, buckles','desktop-in-scene.png',(640,691,882,792),(597,757,1410,1118))]
for title,file,box,(x0,y0,x1,y1) in rows:
 draw.text((x0,y0-27),title,font=small,fill='#d9c996')
 crop=Image.open(out/file).convert('RGB').crop(box);crop.thumbnail((x1-x0,y1-y0),Image.Resampling.LANCZOS)
 # Enlarge small crops with the same aspect ratio; label actual source coordinates below.
 crop_image=Image.open(out/file).convert('RGB').crop(box)
 scale=min((x1-x0)/crop_image.width,(y1-y0)/crop_image.height)
 crop_image=crop_image.resize((round(crop_image.width*scale),round(crop_image.height*scale)),Image.Resampling.LANCZOS)
 canvas.paste(crop_image,(x0,y0));draw.text((x0,y1+5),f'{file} crop {box}',font=ImageFont.truetype(font,13),fill='#84999b')
canvas.save(out/'completed-model-contact-sheet.png')
images.append({'file':'completed-model-contact-sheet.png','sha256':sha((out/'completed-model-contact-sheet.png').read_bytes()),'class':'labeled context crops of final after renders'})
for row in images:
 p=out/row['file'];im=Image.open(p);im.load();assert p.stat().st_size<8*1024*1024 and im.width*im.height<=16000000
 row.update(size=im.size,bytes=p.stat().st_size)
(out/'before-AuthoredRooms.ts.txt').write_text(before)
for f in [source,'src/render/AuthoredRooms.test.ts','src/render/Room8Models.test.ts','src/render/Room8Visuals.test.ts','src/render/Room8Placement.test.ts']:
 shutil.copyfile(root/f,out/(Path(f).name+'.txt'))
(out/'source.patch').write_bytes(git('diff','--',source))
(out/'source-pins.json').write_text(json.dumps({'base':base,'briefSha256':sha(brief.read_bytes()),'trackedSourcePins':pins},indent=2)+'\n')
result={'base':base,'changedTrackedFiles':changed,'newTest':'src/render/Room8Models.test.ts','outsideBreachedBayIdentical':True,'allOtherTrackedSourceIdentical':True,'trackedSourceFileCount':len(pins),'images':images,'capturePassed':True}
(out/'artifact-checks.json').write_text(json.dumps(result,indent=2)+'\n')
repoOut=root/'docs/art-evidence/room8-story-flow-v3/stage-4/attempt-906';repoOut.mkdir(parents=True,exist_ok=True)
for p in out.iterdir():
 if p.is_file() and p.suffix in ['.png','.mjs','.py','.json','.log','.patch','.txt','.md']:
  shutil.copyfile(p,repoOut/p.name);assert p.read_bytes()==(repoOut/p.name).read_bytes()
print(json.dumps(result,indent=2))
