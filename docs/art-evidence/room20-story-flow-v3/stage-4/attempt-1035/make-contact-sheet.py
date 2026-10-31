from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import hashlib,json
p=Path(__file__).parent
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',20)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
canvas=Image.new('RGB',(1600,1100),'#111e24');d=ImageDraw.Draw(canvas)
d.text((24,18),'Room20 model iteration | matched production-camera crops',font=font,fill='white')
d.text((24,49),'Static controlled simulation. Enlarged crops from original PNGs, not independent model renders.',font=small,fill='#b2bcb1')
entries=[]
for i,(label,folder) in enumerate([('Before: stage3 source','before'),('After: stage4 candidate','.')]):
 source=p/folder/'20-overload-floor-gameplay.png';im=Image.open(source).convert('RGB');rect=(470,275,840,540)
 crop=im.crop(rect).resize((740,530),Image.Resampling.NEAREST);x=24+i*780
 canvas.paste(crop,(x,115));d.text((x,82),label,font=font,fill='white')
 entries.append({'label':label,'source':str(source.relative_to(p)),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'crop':rect,'scale':'2x nearest'})
source=p/'20-overload-floor-gameplay.png';im=Image.open(source).convert('RGB')
for i,(label,rect) in enumerate([('Coolant split flanges',(489,292,576,443)),('Segmented coil shoes',(607,313,698,448)),('Power terminal saddles',(724,286,809,443)),('Restraint guide + clevis',(603,429,699,533))]):
 x=24+i*390;d.text((x,679),label,font=font,fill='white');crop=im.crop(rect);crop.thumbnail((350,315));crop=crop.resize((crop.width*2,crop.height*2),Image.Resampling.NEAREST);canvas.paste(crop,(x+60,722))
 entries.append({'label':label,'source':source.name,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'crop':rect,'scale':'2x nearest'})
d.text((24,1056),'Ceramic / bronze / steel. No topology, lighting-state, gameplay or camera changes. Art review pending.',font=small,fill='#b2bcb1')
canvas.save(p/'model-contact-sheet.png')
(p/'contact-sheet-manifest.json').write_text(json.dumps({'kind':'labeled crops of original in-scene captures','entries':entries,'output_sha256':hashlib.sha256((p/'model-contact-sheet.png').read_bytes()).hexdigest()},indent=2)+'\n')
