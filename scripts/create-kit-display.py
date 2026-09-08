"""Original medical display atlas, no third-party imagery. Pillow required."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'public/assets/awakening/recovery-kit';root.mkdir(parents=True,exist_ok=True)
im=Image.new('RGB',(512,256),'#10282d');d=ImageDraw.Draw(im)
f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf',48)
d.text((22,15),'08 STABLE',font=f,fill='#a5ece5')
ys=[155,155,151,163,110,193,145,155,155,155,151,163,110,193,145,155,155]
d.line([(22+i*29,y) for i,y in enumerate(ys)],fill='#7edbd5',width=4)
for i in range(8):d.rounded_rectangle((24+i*60,224,64+i*60,231),radius=2,fill='#7edbd5')
im.save(root/'kit-display.png')
