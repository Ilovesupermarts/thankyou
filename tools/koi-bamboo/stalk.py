# Draws the stalk the user circled (a group of the sheet's own vector data)
# straightened and sharp, as koi-bamboo/stalk.webp. See README.md.
import sys, cairo
from PIL import Image
sys.path.insert(0, '.')
from airender import load, parse_gradients, R
L = load('priv.ai'); G = parse_gradients(L)
st, en = 88674, 90704              # the stalk's group (u ... U) in priv.ai
s = 6.0
yb, yt = -340.6, 10.2              # its foot and top (points)
xb, xt = 417.4, 436.0              # the middle of its foot and of its top: it leans, so it is sheared upright
k = (xt - xb) / (yt - yb)
half = 18
W, H = int(2 * half * s), int((yt - yb) * s)
surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
c = cairo.Context(surf)
c.set_matrix(cairo.Matrix(s, 0, -k * s, -s, (-xb + k * yb + half) * s, yt * s))
R(L, G, c).run(st, en + 1)
surf.write_to_png('stalk-straight.png')
Image.open('stalk-straight.png').save('stalk.webp', 'WEBP', quality=90, method=6)
