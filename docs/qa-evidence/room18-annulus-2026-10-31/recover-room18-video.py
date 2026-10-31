from pathlib import Path
import hashlib,json,subprocess,datetime
root=Path('/workspace/room18-annulus-final'); m=json.loads((root/'manifest.json').read_text())
hashfile=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
frames=sorted((root/'frames').glob('*.png'))
assert len(frames)==len(m['frames'])==695
out=root/'combat-recovered-from-pngs.mp4'
cmd=['ffmpeg','-hide_banner','-loglevel','error','-y','-framerate','20','-i',str(root/'frames/%05d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',str(out)]
subprocess.run(cmd,check=True)
subprocess.run(['ffmpeg','-v','error','-i',str(out),'-f','null','-'],check=True)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(out)]))
assert int(probe['streams'][0]['nb_read_frames'])==695
record={'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'disclosure':'Original manifest remains unchanged. combat.mp4 was modified after manifest creation; exact prior regeneration command is unavailable. Its current bytes do not match original manifest and are not claimed to be original recorder output. This separate recovery is generated from retained PNGs. Original recorder did not hash individual PNGs, so this establishes current frame provenance only, not historical byte identity.','originalManifestSha256':hashfile(root/'manifest.json'),'originalRecordedVideoSha256':m['video']['sha256'],'preservedMismatchedVideo':{'file':'combat.mp4','sha256':hashfile(root/'combat.mp4')},'command':cmd,'recoveredVideo':{'file':out.name,'sha256':hashfile(out),'probe':probe},'frames':[{'file':str(p.relative_to(root)),'sha256':hashfile(p)} for p in frames]}
(root/'video-recovery-provenance.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps({k:v for k,v in record.items() if k not in ['frames','recoveredVideo']},indent=2))
