"""把保留的 Suno 原始 WAV 规范到 -18 LUFS；循环点使用 cues.json 中已准备的值。"""
import argparse,hashlib,json,re,subprocess
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--originals',required=True,type=Path);parser.add_argument('--ffmpeg',default='ffmpeg');args=parser.parse_args()
repo=Path(__file__).resolve().parents[2];cues=json.loads((repo/'audio/wwise/cues.json').read_text())
for cue in cues:
 source=args.originals/cue['source'];target=repo/cue['originalInProject'];target.parent.mkdir(parents=True,exist_ok=True)
 scan=subprocess.run([args.ffmpeg,'-hide_banner','-i',str(source),'-af','loudnorm=I=-18:TP=-1.5:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
 m=json.loads(re.findall(r'\{[^{}]+\}',scan.stderr)[-1])
 af=f"loudnorm=I=-18:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
 if not cue['loop']:af+=f",afade=t=in:d=0.008,afade=t=out:st={cue['seconds']-.3}:d=0.3"
 subprocess.run([args.ffmpeg,'-y','-hide_banner','-loglevel','error','-i',str(source),'-af',af,'-ar','48000','-c:a','pcm_s16le',str(target)],check=True)
 print(cue['key'],hashlib.sha256(target.read_bytes()).hexdigest())
