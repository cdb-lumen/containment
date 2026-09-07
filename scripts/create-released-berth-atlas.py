"""Original small medical display and deck tread atlas. Run with Python/Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
out=Path(__file__).resolve().parents[1]/'public/assets/awakening/released-berth'
out.mkdir(parents=True,exist_ok=True)
im=Image.new('RGB',(512,512),(24,38,40));d=ImageDraw.Draw(im)
font='/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
def text(p,s,size,fill):d.text(p,s,font=ImageFont.truetype(font,size),fill=fill)
d.rounded_rectangle((12,12,500,244),12,fill=(18,31,33),outline=(83,107,104),width=3)
text((28,28),'RECOVERY / 01',23,(170,190,182))
text((28,79),'RELEASE COMPLETE',34,(231,184,104))
d.line((28,138,482,138),fill=(83,107,104),width=2)
text((28,160),'PRESSURE EQUALIZED',22,(156,188,174))
text((28,200),'RESTRAINTS   UNLOCKED',19,(156,188,174))
d.rectangle((0,256,512,512),fill=(76,91,91))
for y in range(270,512,24):
 for x in range(-24,530,48):d.line((x,y,x+17,y-8),fill=(45,61,64),width=4)
im.save(out/'released-berth-atlas.png')
rough=Image.new('RGB',(512,512),(190,190,190));ImageDraw.Draw(rough).rectangle((0,0,512,255),fill=(115,115,115));rough.save(out/'released-berth-roughness.png')
print(out)
