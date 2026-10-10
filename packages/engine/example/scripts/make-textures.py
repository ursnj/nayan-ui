#!/usr/bin/env python3
"""Generates the example's textures (assets/textures/*.png) with no dependencies."""
import math, os, random, struct, zlib

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

random.seed(7)
phases = [random.uniform(0, math.tau) for _ in range(8)]

def wood(x, y):
    u, v = x / 256, y / 256
    # Grain lines along x, wobbling with a few sine waves (tileable: whole periods only).
    wobble = sum(math.sin(math.tau * (k + 1) * u + phases[k]) / (k + 2) for k in range(4)) * 0.018
    rings = math.sin(math.tau * 9 * (v + wobble)) * 0.5 + 0.5
    fine = math.sin(math.tau * 41 * (v + wobble * 1.7) + phases[5]) * 0.5 + 0.5
    t = 0.65 * rings ** 2.2 + 0.35 * fine ** 4
    base = (0.78, 0.55, 0.32)
    dark = (0.52, 0.32, 0.17)
    return bytes(int(255 * (b + (d - b) * t)) for b, d in zip(base, dark))

here = os.path.join(os.path.dirname(__file__), "..", "assets", "textures")
os.makedirs(here, exist_ok=True)
write_png(os.path.join(here, "wood.png"), 256, 256, wood)
