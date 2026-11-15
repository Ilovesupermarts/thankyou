import numpy as np
from PIL import Image
from scipy import ndimage as nd
im=np.array(Image.open('big.png').convert('RGB')).astype(np.float32)
R=np.load('R.npy')
H,W=R.shape
rock=~R
band=nd.binary_dilation(rock,iterations=3)&R
a=np.ones((H,W),np.float32)
mn=im.min(2)
a[R]=np.clip(1-mn[R]/255.0,0,1)
col=im.copy()
m=R
aa=np.maximum(a[m],1e-3)[:,None]
col[m]=np.clip((im[m]-255*(1-aa))/aa,0,255)
# shadows (in R, away from the rock edge band): pure darkness, softened
sh=R&~band
a[sh]=np.clip((a[sh]-0.02)/0.98,0,1)
lab,n=nd.label(rock)
sizes=nd.sum(rock,lab,range(1,n+1))
keep=[i+1 for i,s in enumerate(sizes) if s>400]
lab2=np.where(np.isin(lab,keep),lab,0)
_,ind=nd.distance_transform_edt(lab2==0,return_indices=True)
near=lab2[ind[0],ind[1]]
# soften the outline's stair steps (the drawing's shading was flattened to a 300 dpi picture)
edge=nd.binary_dilation(rock,iterations=4)&nd.binary_dilation(R,iterations=4)
ab=nd.gaussian_filter(a,1.3)
a=np.where(edge,ab,a)
rgba=np.dstack([col,a*255]).astype(np.uint8)
out=[]
for k in keep:
  ys,xs=np.where(lab2==k); y0,y1,x0,x1=ys.min(),ys.max(),xs.min(),xs.max()
  m=int(max(y1-y0,x1-x0)*0.12)+20
  # include its shadow: pixels nearest to it with alpha
  sel=(near==k)&(a>0.02)
  ys2,xs2=np.where(sel[max(0,y0-m):y1+m, max(0,x0-m):x1+m]); 
  Y0=max(0,y0-m)+ys2.min(); Y1=max(0,y0-m)+ys2.max(); X0=max(0,x0-m)+xs2.min(); X1=max(0,x0-m)+xs2.max()
  crop=rgba[Y0:Y1+1,X0:X1+1].copy()
  crop[...,3]=np.where(sel[Y0:Y1+1,X0:X1+1],crop[...,3],0)
  out.append((x0,y0,x1-x0,y1-y0,crop))
out.sort(key=lambda t:(-(t[2]*t[3])))
for i,(x0,y0,w,h,c) in enumerate(out):
  Image.fromarray(c).save(f'rock{i+1:02d}.png'); print(i+1,x0,y0,w,h,c.shape[:2])
