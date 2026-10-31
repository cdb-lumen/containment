from pathlib import Path
import json,hashlib,shutil
from PIL import Image,ImageDraw,ImageFont
p=Path(__file__).parent
repo=Path('/home/chernodubv/dev/.cron-worktrees/containment-rooms/transmission-chamber-v3')
out=repo/'docs/art-evidence/room10-story-flow-v3/stage-4/attempt-965'
out.mkdir(parents=True,exist_ok=False)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',22)
sheet=Image.new('RGB',(1280,760),'#14212a');d=ImageDraw.Draw(sheet)
d.text((20,12),'Room10 model iteration / attempt965 / REJECTED dish construction',font=font,fill='white')
for i,phase in enumerate(['before','after']):
 d.text((20+i*640,52),phase.upper()+' / static capture, not combat',font=font,fill='white')
 im=Image.open(p/phase/'overview-static.png');im.verify()
 im=Image.open(p/phase/'overview-static.png')
 sheet.paste(im.crop((500,78,790,230)).resize((580,304),Image.Resampling.NEAREST),(20+i*640,90))
 im=Image.open(p/phase/'desktop-north-static.png')
 sheet.paste(im.crop((510,393,770,550)).resize((520,314),Image.Resampling.NEAREST),(20+i*640,420))
sheet.save(p/'model-contact-sheet.png')
for phase in ['before','after']:
 manifest=json.loads((p/phase/'capture-result.json').read_text())
 assert not manifest['errors'] and not manifest['aborted']
 for row in manifest['rows']:
  src=p/phase/row['file'];assert hashlib.sha256(src.read_bytes()).hexdigest()==row['sha256']
  shutil.copy2(src,out/(phase+'-'+row['file']))
 for f in ['capture.mjs','capture-result.json']:shutil.copy2(p/phase/f,out/(phase+'-'+f))
for f,h in json.loads((p/'after/capture-result.json').read_text())['source'].items():
 assert hashlib.sha256((repo/f).read_bytes()).hexdigest()==h,f
for f in ['model-contact-sheet.png','independent-review.md','review.md']:shutil.copy2(p/f,out/f)
shutil.copy2(__file__,out/'prepare-publication.py')
print('Prepared eight original PNGs and contact sheet; source pins and PNG hashes match')
