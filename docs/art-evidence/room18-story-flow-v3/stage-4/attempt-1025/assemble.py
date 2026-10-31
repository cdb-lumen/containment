from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json,hashlib,subprocess,os
out=Path(__file__).resolve().parent
repo=Path('/home/chernodubv/dev/.cron-worktrees/containment-rooms/containment-annulus-v3')
prefix=repo/'docs/art-evidence/room18-story-flow-v3/stage-4/attempt-1025'
prefix.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
records=[]
for phase in ['before','after']:
 for view in ['gameplay','overview']:
  src=out/phase/'native'/f'18-containment-annulus-{view}.png'
  dst=out/f'{phase}-{view}.png';dst.write_bytes(src.read_bytes())
  im=Image.open(dst);im.load();assert im.size==(1280,900)
  records.append({'file':dst.name,'source':str(src.relative_to(out)),'sha256':sha(dst),'size':im.size})
sheet=Image.new('RGB',(1280,1280),'#152129');draw=ImageDraw.Draw(sheet)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',22)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
draw.text((24,18),'ROOM18 | model construction | matched desktop crops',font=font,fill='white')
draw.text((24,52),'Controlled staged simulation. Production desktop camera, no DOM HUD. Not ordinary gameplay.',font=small,fill='#b6c4ca')
regions=[('Radial load-bearing shoes and paired webs',(365,370,625,615)),('Recessed instruments and protective frames',(850,250,990,555)),('Roof lifting saddles and sealed inspection cartridge',(530,445,820,620))]
images={p:Image.open(out/f'{p}-gameplay.png') for p in ['before','after']}
for row,(label,box) in enumerate(regions):
 y=90+row*380
 for col,phase in enumerate(['before','after']):
  x=24+col*628
  draw.text((x,y),phase.upper()+' | '+label,font=small,fill='white')
  crop=images[phase].crop(box);crop.thumbnail((590,332),Image.Resampling.LANCZOS)
  # Crops remain at original pixel resolution unless reduction is necessary.
  sheet.paste(crop,(x+(590-crop.width)//2,y+32+(332-crop.height)//2))
  draw.rectangle((x,y+28,x+590,y+366),outline='#425460',width=1)
sheet.save(out/'model-contact-sheet.png')
records.append({'file':'model-contact-sheet.png','sha256':sha(out/'model-contact-sheet.png'),'size':sheet.size,'regions':regions,'derived_from':['before-gameplay.png','after-gameplay.png']})
for record in records:
 src=out/record['file'];dst=prefix/src.name;dst.write_bytes(src.read_bytes());assert sha(dst)==record['sha256'];record['repository_path']=str(dst.relative_to(repo))
(out/'artifact-manifest.json').write_text(json.dumps(records,indent=2))
# Verify source pin integrity after tests/build and identify any retained owned servers.
pins=json.loads((out/'after/source-pins.json').read_text())
mismatches=[p for p,h in pins['runtime_file_sha256'].items() if sha(repo/p)!=h]
owned=[]
for p in Path('/proc').glob('[0-9]*'):
 try:
  cmd=(p/'cmdline').read_bytes().replace(b'\0',b' ').decode(errors='replace');cwd=os.readlink(p/'cwd')
  if cwd==str(repo) and any(token in cmd for token in ['vite','room-evidence.mjs','chrome','chromium']):owned.append({'pid':int(p.name),'cmd':cmd})
 except OSError:pass
result={'source_pin_mismatches':mismatches,'retained_capture_processes':owned,'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip(),'status':subprocess.check_output(['git','status','--short'],cwd=repo,text=True),'artifact_count':len(records)}
(out/'final-verification.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2));assert not mismatches;assert not owned
