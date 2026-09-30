from pathlib import Path
import subprocess, json, hashlib
from PIL import Image, ImageDraw, ImageFont
root=Path('/home/chernodubv/dev/.cron-worktrees/containment-rooms/breached-loading-bay-v3')
out=Path(__file__).parent
sha=lambda b:hashlib.sha256(b).hexdigest()
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
files=['src/render/AuthoredRooms.ts','src/render/Room8Models.test.ts','src/game/roguelike/authoredRoomTopologies.ts','src/game/roguelike/storyRooms.ts','src/game/roguelike/roomTemplates.ts']
manifest={'head':head,'permit':{'source':'parent-delegated valid scheduler preflight','stage_index':4,'completed_start':909,'attempt':3,'max':4},'sources':{},'checks':{}}
for f in files:
 b=(root/f).read_bytes(); old=subprocess.check_output(['git','show',f'HEAD:{f}'],cwd=root)
 manifest['sources'][f]={'sha256':sha(b),'baseSha256':sha(old),'unchanged':b==old}
 if f.startswith('src/render/'):(out/(Path(f).name+'.txt')).write_bytes(b)
old=subprocess.check_output(['git','show','HEAD:src/render/AuthoredRooms.ts'],cwd=root,text=True)
new=(root/'src/render/AuthoredRooms.ts').read_text()
a="  const growth=f.chitin.clone();growth.name='room8-seam-growth';"
b="  const torn=f.edge.clone();torn.name='room8-torn-metal';"
assert old.split(a)[0]==new.split(a)[0] and old.split(b)[1]==new.split(b)[1]
manifest['checks']['everything_outside_room8_growth_unchanged']=True
for f in files[2:]:assert manifest['sources'][f]['unchanged']
changed=subprocess.check_output(['git','diff','--name-only'],cwd=root,text=True).splitlines()
assert sorted(changed)==sorted(files[:2]);manifest['checks']['only_two_allowed_files_changed']=changed
for folder in [out/'before',out]:
 c=json.loads((folder/'capture-result.json').read_text());assert c['passed'] and not c['errors']
 for row in c['rows']:assert sha((folder/row['file']).read_bytes())==row['sha256']
 for f,h in c['source'].items():assert h==manifest['sources'][f]['baseSha256' if folder.name=='before' else 'sha256']
manifest['checks']['both_captures_source_and_image_hashes_match']=True
before=json.loads((out/'before/capture-result.json').read_text());after=json.loads((out/'capture-result.json').read_text())
for a,b in zip(before['rows'],after['rows']):
 assert a['metrics']['camera']==b['metrics']['camera'] and a['metrics']['player']==b['metrics']['player']
 assert a['sha256']!=b['sha256']
manifest['checks']['same_camera_and_player_novel_after_pixels']=True
(out/'source.patch').write_bytes(subprocess.check_output(['git','diff','--',*files[:2]],cwd=root))
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',22)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
sheet=Image.new('RGB',(1600,1390),'#111b20');d=ImageDraw.Draw(sheet)
d.text((20,12),'Room8 attempt909 | One joined organic surface replacing propped panels',font=font,fill='white')
for x,folder,label in [(0,out/'before','BEFORE | c149239'),(800,out,'AFTER | local candidate, same cameras')]:
 d.text((x+15,48),label,font=small,fill='#dfbb80')
 for y,name in [(80,'desktop-in-scene.png'),(660,'overview.png')]:
  im=Image.open(folder/name).convert('RGB');im.thumbnail((790,555));sheet.paste(im,(x+5,y))
# The enlarged model sheet is separate so overview comparisons stay legible.
sheet.save(out/'model-comparison.png')
contact=Image.new('RGB',(1600,1030),'#111b20');d=ImageDraw.Draw(contact)
d.text((20,15),'Room8 model contact sheet | Actual AFTER runtime crops, no paintover',font=font,fill='white')
im=Image.open(out/'desktop-in-scene.png').convert('RGB')
scar=im.crop((365,190,1018,562));scar=scar.resize((1306,744));contact.paste(scar,(147,65))
d.text((25,820),'Joined growth and sealed backing. Freight and torn metal retained unchanged.',font=small,fill='#dfbb80')
contact.paste(im.crop((180,560,370,665)),(170,865));contact.paste(im.crop((590,702,835,795)),(520,865));contact.paste(im.crop((1115,440,1210,535)),(960,865))
contact.save(out/'model-contact-sheet.png')
manifest['images']={}
for f in [out/'before/desktop-in-scene.png',out/'before/overview.png',out/'desktop-in-scene.png',out/'overview.png',out/'model-comparison.png',out/'model-contact-sheet.png']:
 with Image.open(f) as im:im.load(); size=im.size
 manifest['images'][str(f.relative_to(out))]={'sha256':sha(f.read_bytes()),'size':size,'bytes':f.stat().st_size}
manifest['tests']={'focused':{'passed':26,'failed':0,'log':'focused-tests.log'},'build':{'exit':0,'log':'build.log','warning':'existing large chunk warning'},'full_verify':'not run'}
(out/'source-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest['checks'],indent=2));print('Validated six PNG files and both source-matched capture manifests.')
