How `koi-bamboo/stalk.webp` was made from the user's bamboo sheet (an Illustrator EPS, "realistic bamboo background", 500 × 330 pt).

The EPS's printable part is only a 281 × 180 px preview picture, so the real artwork was taken from Illustrator's own data inside it:

1. Unpack it: the text after `%AI9_DataStream` up to the last `%AI9_PrivateDataEnd`, each line's leading `%` removed, is ASCII85; decoded and inflated (zlib) it is the artwork in Illustrator's legacy text format → `priv.ai`.
2. `airender.py` draws that format with pycairo (`pip install pycairo`): paths, solid colours, linear and radial gradients (their stops and midpoints), gradient meshes (Coons patches, cairo's MeshPattern), blend modes, opacity, groups and clip groups. Drawn whole it matches the sheet (some leaves come out white: their effect is not needed here).
3. `stalk.py` draws only the stalk the user circled (the thick yellow one, x 404–450 pt: the group from line 88674 to 90704 of `priv.ai`), sheared upright (it leans 18 pt over its height), 6 px a point, 216 × 2104 px, and saves it as WebP. Its nodes lie at 0.165, 0.418, 0.675 and 0.923 of its length from the top (`FN_NODES` in `koiscreen.html`).
