"""Original deterministic shared graphics atlas and enamel roughness image."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import random
out=Path(__file__).resolve().parents[1]/'public/assets/benchmark';out.mkdir(parents=True,exist_ok=True)
a=Image.new('RGB',(1024,1024),(15,29,32));d=ImageDraw.Draw(a)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def text(x,y,s,t,c=(151,202,186)):d.text((x,y),t,font=ImageFont.truetype(font,s),fill=c)
# upper half is a single screen tile, lower quarter is a casing ID tile.
text(38,28,25,'CRYO / MEDICAL MONITOR')
text(38,83,53,'STASIS STABLE')
d.line([(38,162),(750,162)],fill=(47,81,78),width=2)
text(38,183,22,'NEURAL SUSPENSION   /   NOMINAL')
d.line([(40,290),(130,290),(150,284),(173,292),(191,270),(209,308),(227,286),(244,290),(480,290)],fill=(119,195,163),width=4)
text(38,336,24,'SEAL OK     /     LIFE SUPPORT OK')
text(38,389,20,'AUTONOMOUS CYCLE   |   DO NOT RELEASE',(103,142,137))
# compact body status silhouette at screen right.
d.ellipse((825,183,862,220),outline=(111,172,154),width=3)
d.rounded_rectangle((815,232,872,330),radius=13,outline=(111,172,154),width=3)
for pts in [[(816,244),(791,291)],[(871,244),(896,291)],[(827,328),(821,385)],[(859,328),(865,385)]]:d.line(pts,fill=(111,172,154),width=4)
d.rectangle((0,512,1023,767),fill=(93,113,109))
text(36,533,43,'CR / 08',(26,45,47));text(36,602,24,'SEALED MEDICAL ENCLOSURE',(26,45,47));text(36,650,21,'SERVICE ACCESS  /  AUTHORIZED PERSONNEL',(32,53,53))
d.rectangle((0,768,1023,1023),fill=(16,30,33));text(32,808,44,'SUPPLY   /   RETURN');text(32,887,28,'ISOLATE BEFORE DISCONNECT',(134,165,158))
a.save(out/'cryo-graphics-atlas.png')
r=random.Random(8);im=Image.new('RGB',(512,512));im.putdata([(v,v,v) for v in [r.randrange(170,188) for _ in range(512*512)]])
d=ImageDraw.Draw(im)
for _ in range(45):
 x=r.randrange(512);y=r.randrange(512);d.line((x,y,x+r.randrange(2,12),y+1),fill=(194,194,194),width=1)
im.save(out/'cryo-enamel-roughness.png')
print('Created 1024x1024 RGB graphics atlas and 512x512 RGB roughness; no baked normal map claimed.')
