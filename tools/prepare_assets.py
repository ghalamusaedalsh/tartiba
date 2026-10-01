"""Builds assets/board.png from design/calendar-design.png.

- Removes the green checkered background around the wooden frame (so the app
  can draw it in any theme color) while keeping decorations that hang over it.
- Erases the printed calendar so the app can draw a live one.
- Erases the text inside the blue quote badge.
- Cuts holes in the four photo-strip slots so the user's photos show through,
  keeping the pin, gem and smiley that sit on top of them.

Run:  python3 tools/prepare_assets.py
"""
import math
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "design" / "calendar-design.png"
OUT = ROOT / "assets" / "board.png"

LIGHT = np.array([206, 223, 190], float)
MID = np.array([175, 205, 148], float)
DARK = np.array([160, 195, 127], float)

# Inner part of the wooden frame that is always kept as-is.
FRAME = (244, 37, 1631, 1060)  # x0, y0, x1, y1 (inclusive)

# Photo slots: centre x, centre y, width, height, rotation (degrees, CSS sense).
SLOTS = [
    (444.3, 348.9, 121, 163, -4.4),
    (457.7, 522.9, 121, 163, -4.4),
    (471.1, 696.9, 121, 163, -4.4),
    (484.5, 870.9, 121, 163, -4.4),
]


def checker_color(h, w):
    ys, xs = np.mgrid[0:h, 0:w]
    col_on = (xs % 256) >= 128
    row_on = ((ys + 36) % 255.6) < 128
    bg = np.where((col_on & row_on)[..., None], DARK,
                  np.where((col_on ^ row_on)[..., None], MID, LIGHT))
    return bg


def main():
    img = np.array(Image.open(SRC).convert("RGB")).astype(float)
    h, w, _ = img.shape
    alpha = np.ones((h, w))

    # 1) Remove checkered background outside the frame, un-blending edges.
    bg = checker_color(h, w)
    dist = np.linalg.norm(img - bg, axis=2)
    # Near stripe edges the background is a blend of two greens; measure the
    # distance to the light-mid-dark color line there instead.
    def seg_dist(p, a, b):
        ab = b - a
        t = np.clip(((p - a) @ ab) / (ab @ ab), 0, 1)[..., None]
        return np.linalg.norm(p - (a + t * ab), axis=2)
    line_d = np.minimum(seg_dist(img, LIGHT, MID), seg_dist(img, MID, DARK))
    line_d = np.minimum(line_d, seg_dist(img, LIGHT, DARK))
    ys0, xs0 = np.mgrid[0:h, 0:w]
    near_edge = (np.abs(((xs0 + 64) % 128) - 64) < 4) | (np.abs(((ys0 + 36) % 127.8)) < 3) | (np.abs(((ys0 + 36) % 127.8) - 127.8) < 3)
    dist = np.where(near_edge, np.minimum(dist, line_d), dist)
    outside = np.ones((h, w), bool)
    x0, y0, x1, y1 = FRAME
    outside[y0:y1 + 1, x0:x1 + 1] = False
    a = np.clip((dist - np.where(near_edge, 20, 10)) / 45.0, 0, 1)
    alpha[outside] = a[outside]
    # un-premultiply partially transparent pixels so no green fringe remains
    part = outside & (alpha > 0) & (alpha < 1)
    al = alpha[part][:, None]
    img[part] = np.clip((img[part] - (1 - al) * bg[part]) / al, 0, 255)

    # 2) Erase the printed calendar (keep the pins, smiley and bow on its edge).
    img[180:650, 565:1341] = 255
    img[650:692, 565:1316] = 255
    img[306:319, 511:566] = 255     # ends of the printed header line
    img[306:319, 1341:1384] = 255
    for (ya, yb, xa, xb) in [(668, 694, 540, 566), (668, 694, 1300, 1345)]:
        reg = img[ya:yb, xa:xb]
        grayish = (np.ptp(reg, axis=2) < 6) & (reg.mean(axis=2) > 225)
        reg[grayish] = 255

    # 3) Erase the text inside the quote badge.
    blue = np.array([167, 193, 229], float)
    blue_l = 0.299 * blue[0] + 0.587 * blue[1] + 0.114 * blue[2]
    reg = img[740:945, 1245:1530]
    r, g, b = reg[..., 0], reg[..., 1], reg[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    text = (b >= g - 5) & (lum < blue_l - 6)
    reg[text] = blue

    # 4) Cut holes in the photo slots (keep red/yellow/dark decorations).
    ys, xs = np.mgrid[0:h, 0:w]
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    deco = ((r - g > 60) & (r > 110)) | ((r > 190) & (g > 170) & (b < 150) & (r >= g)) | (lum < 95)
    for cx, cy, sw, sh, deg in SLOTS:
        t = math.radians(-deg)
        dx, dy = xs - cx, ys - cy
        u = dx * math.cos(t) - dy * math.sin(t)
        v = dx * math.sin(t) + dy * math.cos(t)
        inside = (np.abs(u) <= sw / 2 + 0.5) & (np.abs(v) <= sh / 2 + 0.5)
        alpha[inside & ~deco] = 0

    rgba = np.dstack([img, alpha * 255]).round().astype(np.uint8)
    OUT.parent.mkdir(exist_ok=True)
    Image.fromarray(rgba, "RGBA").save(OUT, optimize=True)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
