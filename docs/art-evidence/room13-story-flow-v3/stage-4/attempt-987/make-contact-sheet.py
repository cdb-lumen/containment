from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import hashlib,json,shutil,re
out=Path(__file__).parent
font=lambda s:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',s)
sheet=Image.new('RGB',(1120,1050),'#111b20');d=ImageDraw.Draw(sheet)
d.text((24,18),'Room13 / pump and life-support service repair',font=font(26),fill='#e0ecec')
d.text((24,57),'Controlled simulation, no DOM HUD. Not live campaign gameplay.',font=font(18),fill='#b6cbca')
d.text((24,89),'BEFORE / clean dd9c86c',font=font(20),fill='#c1d0cd')
d.text((578,89),'AFTER / attempt987 working tree',font=font(20),fill='#a4cfcb')
rows=[('Pump scroll and cutaway strainer / 2x nearest-neighbor crop',(270,490,510,700),(480,420),130),('Life-support service identification / 3x nearest-neighbor crop',(605,360,735,470),(390,330),605)]
for label,crop,size,y in rows:
 for i,phase in enumerate(['before','after']):
  im=Image.open(out/phase/'13-coolant-plant-gameplay.png').convert('RGB')
  sheet.paste(im.crop(crop).resize(size,Image.Resampling.NEAREST),(24+i*554,y))
 d.text((24,y+size[1]+9),label,font=font(18),fill='#d0dddd')
d.text((24,994),'Same production camera and lighting. Crops aid inspection; originals set readability.',font=font(17),fill='#a8bfbe')
d.text((24,1021),'Paired layout, exchanger models, materials and collision footprints retained.',font=font(17),fill='#a8bfbe')
sheet.save(out/'model-contact-sheet.png')
files={f'{phase}-{view}.png':out/phase/f'13-coolant-plant-{mode}.png' for phase in ['before','after'] for view,mode in [('in-scene','gameplay'),('overview','overview')]}
files['model-contact-sheet.png']=out/'model-contact-sheet.png'
manifest=[]
for name,p in files.items():
 if p!=out/name: shutil.copyfile(p,out/name)
 with Image.open(p) as im: im.load(); dims=list(im.size)
 manifest.append(dict(file=name,path=str(out/name),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),dimensions=dims,bytes=p.stat().st_size))
assert len(manifest)==5
assert manifest[0]['sha256']!=manifest[2]['sha256']
(out/'image-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest,indent=2))
text=(out/'logs/npm-test.log').read_text()
print('\n'.join(line for line in text.splitlines() if re.search(r'Test Files|Tests\s+|PASS:|^# (tests|pass|fail)',line)))
