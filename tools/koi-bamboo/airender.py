# A small renderer for Illustrator's legacy text format (the private data of an
# AI EPS): paths, solid fills, linear / radial gradients, gradient meshes,
# blend modes, opacity, groups and clip groups. Enough for the bamboo sheet.
import re, sys, math
import cairo

BLEND = {0: cairo.OPERATOR_OVER, 1: cairo.OPERATOR_MULTIPLY, 2: cairo.OPERATOR_SCREEN,
         3: cairo.OPERATOR_OVERLAY, 4: cairo.OPERATOR_SOFT_LIGHT, 5: cairo.OPERATOR_HARD_LIGHT,
         6: cairo.OPERATOR_COLOR_DODGE, 7: cairo.OPERATOR_COLOR_BURN, 8: cairo.OPERATOR_DARKEN,
         9: cairo.OPERATOR_LIGHTEN, 10: cairo.OPERATOR_DIFFERENCE, 11: cairo.OPERATOR_EXCLUSION,
         12: cairo.OPERATOR_HSL_HUE, 13: cairo.OPERATOR_HSL_SATURATION, 14: cairo.OPERATOR_HSL_COLOR,
         15: cairo.OPERATOR_HSL_LUMINOSITY}

def cmyk2rgb(c, m, y, k):
    return ((1 - c) * (1 - k), (1 - m) * (1 - k), (1 - y) * (1 - k))

def load(path):
    t = open(path, 'rb').read().decode('latin1')
    return re.split(r'[\r\n]+', t)

def parse_gradients(lines):
    G = {}
    i = 0
    while i < len(lines):
        l = lines[i]
        if l.startswith('%AI5_BeginGradient'):
            name = None; typ = 0; stops = []
            j = i + 1
            while not lines[j].startswith('%AI5_EndGradient'):
                lj = lines[j]
                m = re.match(r'\((.*)\) (\d+) (\d+) Bd', lj)
                if m: name = m.group(1); typ = int(m.group(2))
                if lj.endswith(' Bs') and lj.startswith('%_'):
                    named = '(' in lj
                    v = [float(a) for a in re.sub(r'\([^)]*\)', ' ', lj[2:-3]).split()]
                    loc = v[-1]; mid = v[-2]; ct = int(v[-3]); col = v[:-3]
                    if ct == 0: rgb = (1 - col[0],) * 3
                    elif ct in (1, 3) and len(col) < 7: rgb = cmyk2rgb(*col[:4])
                    elif len(col) >= 7: rgb = tuple(col[4:7])
                    else: rgb = cmyk2rgb(*col[:4])
                    stops.append((loc / 100.0, mid / 100.0, rgb))
                j += 1
            if name is not None:
                G[name] = (typ, stops)
            i = j
        i += 1
    return G

class R:
    def __init__(self, lines, grads, ctx):
        self.L = lines; self.G = grads; self.c = ctx
        self.fill = (0, 0, 0); self.grad = None; self.mode = 0; self.op = 1.0; self.rule = 0
        self.path = []; self.pendingClip = False
        self.depth = 0

    def apply_path(self):
        c = self.c
        c.new_path()
        for p in self.path:
            if p[0] == 'm': c.move_to(*p[1])
            elif p[0] == 'l': c.line_to(*p[1])
            elif p[0] == 'c': c.curve_to(*p[1])
            elif p[0] == 'h': c.close_path()

    def gradient_pattern(self):
        name, bm, kind, ox, oy, ang, ln = self.grad
        if name not in self.G: return None
        typ, stops = self.G[name]
        if typ == 0:
            a = math.radians(ang)
            pat = cairo.LinearGradient(ox, oy, ox + ln * math.cos(a), oy + ln * math.sin(a))
        else:
            pat = cairo.RadialGradient(ox, oy, 0, ox, oy, ln)
        prev = None
        for (loc, mid, rgb) in stops:
            if prev is not None and abs(mid - 0.5) > 0.01:
                # midpoint: the half-way colour sits at mid between the two stops
                pl, prgb = prev
                at = pl + (loc - pl) * mid
                pat.add_color_stop_rgb(at, *[(a + b) / 2 for a, b in zip(prgb, rgb)])
            pat.add_color_stop_rgb(loc, *rgb)
            prev = (loc, rgb)
        if bm is not None:
            m = cairo.Matrix(*bm)
            m.invert()
            pat.set_matrix(m)
        pat.set_extend(cairo.EXTEND_PAD)
        return pat

    def paint_fill(self):
        c = self.c
        c.save()
        self.apply_path()
        c.set_fill_rule(cairo.FILL_RULE_EVEN_ODD if self.rule else cairo.FILL_RULE_WINDING)
        if self.grad:
            pat = self.gradient_pattern()
            if pat is None: c.restore(); return
            c.set_source(pat)
        else:
            c.set_source_rgb(*self.fill)
        self.blend_paint(lambda: c.fill())
        c.restore()

    def blend_paint(self, fn):
        c = self.c
        c.set_operator(BLEND.get(self.mode, cairo.OPERATOR_OVER))
        if self.op < 0.999:
            c.push_group(); c.set_operator(cairo.OPERATOR_OVER)
            fn()
            c.pop_group_to_source()
            c.set_operator(BLEND.get(self.mode, cairo.OPERATOR_OVER))
            c.paint_with_alpha(self.op)
        else:
            fn()
        c.set_operator(cairo.OPERATOR_OVER)

    def mesh(self, i):
        # i: index of '/Mesh X!'
        c = self.c
        pat = cairo.MeshPattern()
        cs = 'rgb'; nodes = []; j = i + 1
        while self.L[j].strip() != '/End X!':
            l = self.L[j]
            if '/DeviceCMYK /CS' in l: cs = 'cmyk'
            if '/DeviceGray /CS' in l: cs = 'gray'
            m = re.match(r'%_\[([^\]]*)\] /N X#', l)
            if m:
                v = [float(a) for a in m.group(1).split()]
                n = {'rgb': 3, 'cmyk': 4, 'gray': 1}[cs]
                col = v[:n]
                if cs == 'cmyk': col = cmyk2rgb(*col)
                elif cs == 'gray': col = (col[0],) * 3
                p = v[n:]
                nodes.append((tuple(col), (p[0], p[1]), (p[2], p[3]), (p[5], p[6])))
                if len(nodes) == 4:
                    P = [nd[1] for nd in nodes]; A = [nd[2] for nd in nodes]; B = [nd[3] for nd in nodes]
                    pat.begin_patch()
                    pat.move_to(*P[0])
                    for k in range(4):
                        k2 = (k + 1) % 4
                        pat.curve_to(A[k][0], A[k][1], B[k2][0], B[k2][1], P[k2][0], P[k2][1])
                    for k in range(4): pat.set_corner_color_rgb(k, *nodes[k][0])
                    pat.end_patch()
                    nodes = []
            j += 1
        c.save()
        c.set_source(pat)
        self.blend_paint(lambda: c.paint())
        c.restore()
        return j

    def run(self, i0, i1, only=None):
        """Draw lines i0..i1. only(i) -> bool can veto top-level objects."""
        c = self.c
        L = self.L
        i = i0
        meshClip = False
        stack = []
        while i < i1:
            l = L[i]
            s = l.strip()
            if s.startswith('%_') or s.startswith('%%') or s.startswith('%AI') or not s:
                i += 1; continue
            if s == '/Mesh X!':
                if meshClip:
                    i = self.mesh(i); c.restore(); meshClip = False
                else:
                    i = self.mesh(i)
                i += 1; continue
            tk = s.split()
            op = tk[-1]
            args = tk[:-1]
            try:
                f = [float(a) for a in args]
            except ValueError:
                f = None
            if op == 'm': self.path = [('m', (f[0], f[1]))]
            elif op in ('l', 'L'): self.path.append(('l', (f[0], f[1])))
            elif op in ('c', 'C'): self.path.append(('c', tuple(f[:6])))
            elif op in ('v', 'V'):
                cur = self.cur(); self.path.append(('c', (cur[0], cur[1], f[0], f[1], f[2], f[3])))
            elif op in ('y', 'Y'): self.path.append(('c', (f[0], f[1], f[2], f[3], f[2], f[3])))
            elif op == 'h': self.path.append(('h',))
            elif op == 'W': self.pendingClip = True
            elif op in ('n', 'N'):
                if self.pendingClip:
                    self.pendingClip = False
                    nxt = self.next_op(i + 1)
                    if nxt == 'mesh' and not stack_has_q(stack):
                        c.save(); self.apply_path(); c.clip(); meshClip = True
                    else:
                        self.apply_path(); c.clip()
                self.path = []
            elif op in ('f', 'F'):
                if op == 'f': self.path.append(('h',))
                self.paint_fill(); self.path = []
            elif op in ('b', 'B'):
                if op == 'b': self.path.append(('h',))
                self.paint_fill(); self.path = []
            elif op in ('s', 'S'):
                self.path = []
            elif op == 'Xa' and f: self.fill = tuple(f[:3]); self.grad = None
            elif op == 'k' and f: self.fill = cmyk2rgb(*f[:4]); self.grad = None
            elif op == 'g' and f: self.fill = (f[0],) * 3; self.grad = None
            elif op == 'x' and f: self.fill = cmyk2rgb(*f[:4]); self.grad = None
            elif op == 'Xy' and f: self.mode = int(f[0]); self.op = f[1]
            elif op == 'XR' and f: self.rule = int(f[0])
            elif op == 'Bb': self.gstate = {}
            elif op == 'Bg':
                m = re.match(r'(\d+) \((.*)\) (\S+) (\S+) (\S+) (\S+) (\S+) (\S+) (\S+) (\S+) (\S+) (\S+) Bg', s)
                if m and m.group(1) == '1':
                    g = m.groups()
                    self.grad = [g[1], None, 0, float(g[2]), float(g[3]), float(g[4]), float(g[5])]
                    # Bg's own matrix (used when no Bm follows)
                    self.grad_bg = [float(x) for x in g[6:12]]
                    self.grad[1] = tuple(self.grad_bg)
            elif op == 'Bm' and f and self.grad: self.grad[1] = tuple(f[:6])
            elif op == 'BB':
                pass
            elif op == 'q':
                c.save(); stack.append('q')
            elif op == 'Q':
                if stack and stack[-1] == 'q': stack.pop(); c.restore()
            elif op == 'u':
                stack.append('u')
            elif op == 'U':
                if stack and stack[-1] == 'u': stack.pop()
            i += 1

    def cur(self):
        p = self.path[-1]
        if p[0] in ('m', 'l'): return p[1]
        if p[0] == 'c': return p[1][4:6]
        return (0, 0)

    def next_op(self, i):
        while i < len(self.L):
            s = self.L[i].strip()
            if s == '/Mesh X!': return 'mesh'
            if s and not s.startswith('%') and s.split()[-1] in ('m', 'f', 'F', 'Bb', 'u', 'q', 'Q', 'U'):
                return 'other'
            i += 1
        return None

def stack_has_q(st):
    return False
