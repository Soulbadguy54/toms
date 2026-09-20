"""Derive SVG display clipping geometry; source image bytes are never modified."""
from PIL import Image
import numpy as np
from scipy import ndimage as ndi
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
specs={'tom':('hero-sprites.png',(105,5,495,570),1),'dog':('hero-sprites.png',(605,100,949,466),1),'tomatoes':('hero-sprites.png',(1062,143,1484,495),2),'crow':('hero-sprites.png',(30,565,523,1015),1),'plane':('hero-sprites.png',(538,635,1005,938),1),'hanging':('hero-sprites.png',(1154,512,1358,1004),1),'lean-tom':('final-sprites.png',(150,0,774,931),1),'lean-don':('final-sprites.png',(890,119,1510,931),1)}
out={}
for name,(src,(x0,y0,x1,y1),count) in specs.items():
 im=np.array(Image.open(root/'public'/src).convert('RGB')); a=im[y0:y1,x0:x1].astype(float)
 m=(a.max(2)-a.min(2)>15)|(a[:,:,0]-a[:,:,2]>2)|(a.max(2)<120)
 m=ndi.binary_closing(m,iterations=3)
 labels,n=ndi.label(m);sizes=np.bincount(labels.ravel());sizes[0]=0
 keep=np.argsort(sizes)[-count:];m=np.isin(labels,keep);m=ndi.binary_fill_holes(m)
 # Row runs create an exact contour clip without raster editing or resampling.
 paths=[]
 for y,row in enumerate(m):
  edges=np.diff(np.r_[False,row,False].astype(int));starts=np.flatnonzero(edges==1);ends=np.flatnonzero(edges==-1)
  for x,e in zip(starts,ends):paths.append(f'M{x+x0},{y+y0}h{e-x}v1h{x-e}z')
 out[name]={'src':'/'+src,'box':[x0,y0,x1-x0,y1-y0],'width':im.shape[1],'height':im.shape[0],'path':''.join(paths)}
 print(name, m.sum(), 'pixels',len(paths),'runs')
(root/'app'/'sprite-clips.json').write_text(json.dumps(out,separators=(',',':')))
