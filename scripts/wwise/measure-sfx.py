"""Read-only PCM measurements of every shipped source; this is not listening approval."""
import json,wave,pathlib,math,numpy as np,datetime
root=pathlib.Path(__file__).resolve().parents[2];catalog=json.loads((root/'audio/wwise/sfx-cues.json').read_text());items=[];problems=[]
for family in catalog:
 for clip in family['clips']:
  with wave.open(str(root/clip['file']),'rb') as w:
   channels=w.getnchannels();rate=w.getframerate();width=w.getsampwidth();frames=w.getnframes();raw=w.readframes(frames)
  if width!=2:raise ValueError('Expected PCM16 delivery: '+clip['file'])
  values=np.frombuffer(raw,dtype='<i2').astype(np.float64)/32768
  peak=float(np.max(np.abs(values)));rms=float(np.sqrt(np.mean(values*values)));size=round(.05*rate)*channels
  windows=[np.sqrt(np.mean(values[n:n+size]**2)) for n in range(0,len(values),size)];peak_window=float(max(windows));clipped=int(np.count_nonzero(np.abs(values)>=.999));db=lambda v:20*math.log10(max(v,1e-12))
  row=dict(key=family['key'],assetId=clip['assetId'],packRevision=clip['packRevision'],channels=channels,sampleRate=rate,seconds=frames/rate,samplePeakDbfs=db(peak),rmsDbfs=db(rms),max50msRmsDbfs=db(peak_window),fullScaleSamples=clipped)
  items.append(row)
  if peak<1e-5:problems.append(clip['assetId']+': near-silent source')
  if clipped:problems.append(clip['assetId']+': full-scale source samples')
report=dict(at=datetime.datetime.now(datetime.timezone.utc).isoformat(),assets=len(items),passed=not problems,problems=problems,method='Native PCM16 channels and sample rate; 50ms windows. Short effects have no reliable integrated LUFS. Playback gain and Wwise mix are excluded.',subjectiveReview='pending',items=items)
(root/'audio/wwise/sfx-source-measurements.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='items'},ensure_ascii=False));raise SystemExit(bool(problems))
