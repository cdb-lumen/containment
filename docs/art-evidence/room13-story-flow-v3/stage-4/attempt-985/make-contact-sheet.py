from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, hashlib, shutil
out=Path(__file__).parent
repo=Path('/home/chernodubv/dev/.cron-worktrees/containment-rooms/coolant-plant-v3')
font=lambda s:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',s)
sheet=Image.new('RGB',(1120,1120),'#111b20');d=ImageDraw.Draw(sheet)
d.text((24,18),'Room13 / connected machinery',font=font(28),fill='#e0ecec')
d.text((24,57),'Actual desktop scene crops, 2x nearest-neighbor. Same camera and lighting.',font=font(17),fill='#a8bfbe')
d.text((24,88),'BEFORE / stage3 baseline',font=font(20),fill='#c1d0cd')
d.text((578,88),'AFTER / stage4 candidate',font=font(20),fill='#a4cfcb')
rows=[('Heat exchanger / channel heads and connected expansion vessel',(260,135,525,360),126),('Pump / axial coupling, curved suction and exposed strainer basket',(260,485,525,710),619)]
for label,crop,y in rows:
    for i,phase in enumerate(['before','after']):
        im=Image.open(out/phase/'13-coolant-plant-gameplay.png').convert('RGB')
        sheet.paste(im.crop(crop).resize((530,450),Image.Resampling.NEAREST),(24+i*554,y))
    d.text((24,y+456),label,font=font(17),fill='#d0dddd')
d.text((24,1100),'Controlled simulation, no DOM HUD. Enlargements are not extra gameplay detail.',font=font(14),fill='#9caeac')
sheet.save(out/'model-contact-sheet.png')
# Flat publication names retain original scene bytes without image processing.
files={
 'before-in-scene.png':out/'before/13-coolant-plant-gameplay.png',
 'after-in-scene.png':out/'after/13-coolant-plant-gameplay.png',
 'before-overview.png':out/'before/13-coolant-plant-overview.png',
 'after-overview.png':out/'after/13-coolant-plant-overview.png',
 'model-contact-sheet.png':out/'model-contact-sheet.png',
}
manifest=[]
for name,p in files.items():
    if p!=out/name:shutil.copyfile(p,out/name)
    with Image.open(p) as im:
        im.load();dims=list(im.size)
    manifest.append({'file':name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'dimensions':dims,'bytes':p.stat().st_size})
# Parent owns publication. Do not copy into the repository here.
(out/'image-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest,indent=2))
