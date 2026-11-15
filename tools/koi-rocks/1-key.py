import numpy as np, heapq
from PIL import Image
from scipy import ndimage as nd
im=np.array(Image.open('big.png').convert('RGB')).astype(np.int16)
H,W,_=im.shape
mn=im.min(2); mx=im.max(2); sat=mx-mn
# flood from the border through near-neutral pixels that darken only gently
R=np.zeros((H,W),bool)
from collections import deque
q=deque()
for y in range(H):
  for x in (0,W-1):
    if mn[y,x]>240: R[y,x]=True; q.append((y,x))
for x in range(W):
  for y in (0,H-1):
    if mn[y,x]>240 and not R[y,x]: R[y,x]=True; q.append((y,x))
STEP=7; SAT=28
while q:
  y,x=q.popleft(); v=mn[y,x]
  for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
    yy,xx=y+dy,x+dx
    if 0<=yy<H and 0<=xx<W and not R[yy,xx]:
      if sat[yy,xx]<SAT and mn[yy,xx]>=v-STEP and mn[yy,xx]>60:
        R[yy,xx]=True; q.append((yy,xx))
np.save('R.npy',R)
