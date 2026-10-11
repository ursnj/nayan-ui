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
