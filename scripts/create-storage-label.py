"""Original compact equipment label. Pillow, system DejaVu font."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
out=Path(__file__).resolve().parents[1]/'public/assets/awakening/recovery-storage'
out.mkdir(parents=True,exist_ok=True)
im=Image.new('RGB',(256,128),'#18262b');d=ImageDraw.Draw(im)
f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf',90)
d.text((128,67),'KIT',font=f,anchor='mm',fill='#d5dfd7')
im.save(out/'locker-label.png')
