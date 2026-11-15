How `koi-rocks/rock01 … rock04.webp` were made from the user's rock sheet (an Illustrator EPS, 400 × 205 pt).

1. `gs -dEPSCrop -sDEVICE=pngalpha -r600 -o big.png rocks.eps` (Illustrator had flattened the shading into 300 dpi pictures on white: only their outline is vector).
2. `python3 1-key.py`: the white background and the soft grey shadows found by a flood from the border (near-neutral pixels that darken only gently) → `R.npy`.
3. `python3 2-cut.py`: alpha from the white (shadows become see-through darkness), the outline's stair steps softened, each rock cut out with its own shadow → `rockNN.png`, largest first.
4. Each shrunk to at most 640 px and saved as WebP (quality 88). Only the four largest are kept (the user's choice: the brown, the grey-brown, the speckled and the blue-grey).
