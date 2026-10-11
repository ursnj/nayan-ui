#!/usr/bin/env python3
"""Generates the example's textures (assets/textures/*.png) with no dependencies.

Run from the example directory:  python3 scripts/make-textures.py
"""
import os, random, struct, zlib

def write_png(path, width, height, pixel):
    rows = bytearray()
    for y in range(height):
        rows.append(0)  # filter: none
        for x in range(width):
            rows.extend(pixel(x, y))
    chunk = lambda kind, data: struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(rows), 9)) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)
    print(f"{path}: {len(png)} bytes")

here = os.path.join(os.path.dirname(__file__), "..", "assets", "textures")
os.makedirs(here, exist_ok=True)
random.seed(11)

# Asphalt: grey grain with light and dark specks of aggregate, and faint tyre-worn bands.
N = 128
grain = [[random.random() for _ in range(N)] for _ in range(N)]
def asphalt(x, y):
    g = grain[y][x]
    v = 0.25 + (g - 0.5) * 0.09
    if g > 0.985:
        v += 0.16  # light stone
    elif g < 0.02:
        v -= 0.08
    band = abs(((x + 0.5) / N) - 0.5)
    if 0.12 < band < 0.2 or 0.3 < band < 0.38:
        v -= 0.025  # where wheels run
    c = max(0, min(255, int(255 * v)))
    return bytes((c, c, min(255, c + 3)))
write_png(os.path.join(here, "asphalt.png"), N, N, asphalt)

# Building facade: rows of windows, some lit, on concrete.
W, H, CW, CH = 64, 128, 8, 10
lit = {(i, j): random.random() < 0.3 for i in range(-(-W // CW)) for j in range(-(-H // CH))}
def facade(x, y):
    i, j = x // CW, y // CH
    u, v = x % CW, y % CH
    if 1 < u < CW - 1 and 2 < v < CH - 1:
        return bytes((235, 214, 150)) if lit[(i, j)] else bytes((58, 72, 92))
    return bytes((200, 198, 192))
write_png(os.path.join(here, "facade.png"), W, H, facade)

# Grass for the 62 x 6 m ground strips beside the road: drawn 10:1 so it isn't stretched there.
GW, GH = 512, 48
blades = [[random.random() for _ in range(GW)] for _ in range(GH)]
patch = [[random.random() for _ in range(GW // 32 + 2)] for _ in range(GH // 16 + 2)]
def grass(x, y):
    # Big soft patches (bilinear noise) with fine blade speckle on top.
    fx, fy = x / 32, y / 16
    ix, iy = int(fx), int(fy)
    tx, ty = fx - ix, fy - iy
    p = (patch[iy][ix] * (1 - tx) + patch[iy][ix + 1] * tx) * (1 - ty) + (patch[iy + 1][ix] * (1 - tx) + patch[iy + 1][ix + 1] * tx) * ty
    b = blades[y][x]
    g = 0.55 + p * 0.25 + (b - 0.5) * 0.22
    r, gr, bl = 0.42 * g + (0.08 if b > 0.97 else 0), 0.78 * g, 0.3 * g
    return bytes(max(0, min(255, int(255 * v))) for v in (r, gr, bl))
write_png(os.path.join(here, "grass.png"), GW, GH, grass)

# Billboard ads: bold shapes that read at speed.
AW, AH = 128, 64
def chevrons(x, y):
    if y < 6 or y >= AH - 6:
        return bytes((20, 20, 24))
    on = ((x + abs(y - AH / 2)) // 12) % 2 == 0
    return bytes((255, 140, 20)) if on else bytes((24, 24, 28))
def bubbles(x, y):
    for cx, cy, r in ((34, 30, 18), (78, 38, 12), (104, 22, 9)):
        if (x - cx) ** 2 + (y - cy) ** 2 < r * r:
            return bytes((250, 250, 255))
    t = y / AH
    return bytes((int(30 + 40 * t), int(110 + 60 * t), 230))
def bolt(x, y):
    # Red and white bands with a yellow lightning bolt.
    u, v = x / AW, y / AH
    in_bolt = (0.42 < u + 0.35 * (v - 0.5) < 0.52 and v < 0.55) or (0.48 < u + 0.35 * (v - 0.5) < 0.58 and v >= 0.45)
    if in_bolt:
        return bytes((255, 214, 40))
    return bytes((210, 30, 30)) if (y // 8) % 2 == 0 else bytes((245, 245, 245))
for name, fn in (("ad_chevrons", chevrons), ("ad_bubbles", bubbles), ("ad_bolt", bolt)):
    write_png(os.path.join(here, f"{name}.png"), AW, AH, fn)
