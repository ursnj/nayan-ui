#!/usr/bin/env python3
"""Generates the example's low-poly glTF models (assets/models/*.glb) with no dependencies.

Each part is its own mesh + material, placed by a node transform, like a typical exported scene.
Faces are flat-shaded (unshared vertices with explicit normals, no index buffer).
"""
import json, math, os, struct

def prism(sides, r_bottom, r_top, height):
    """Faceted cylinder/cone from y=0 to y=height, with caps. Returns (positions, normals)."""
    pos, nor = [], []
    def tri(a, b, c):
        n = cross(sub(b, a), sub(c, a))
        l = math.sqrt(sum(x * x for x in n)) or 1
        n = [x / l for x in n]
        pos.extend([a, b, c]); nor.extend([n, n, n])
    ring = lambda r, y: [(r * math.cos(2 * math.pi * i / sides), y, -r * math.sin(2 * math.pi * i / sides)) for i in range(sides)]
    lo, hi = ring(r_bottom, 0), ring(r_top, height)
    for i in range(sides):
        j = (i + 1) % sides
        if r_top > 0:
            tri(lo[i], lo[j], hi[j]); tri(lo[i], hi[j], hi[i])
            tri((0, height, 0), hi[i], hi[j])
        else:
            tri(lo[i], lo[j], (0, height, 0))
        tri((0, 0, 0), lo[j], lo[i])
    return pos, nor

def box(sx, sy, sz):
    pos, nor = [], []
    for axis in range(3):
        for sign in (1, -1):
            n = [0, 0, 0]; n[axis] = sign
            u, v = [a for a in range(3) if a != axis]
            corners = []
            for a, b in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
                p = [0, 0, 0]; p[axis] = sign; p[u] = a; p[v] = b
                corners.append(tuple(p[k] * s / 2 for k, s in enumerate((sx, sy, sz))))
            if (sign > 0) == (axis == 1):  # keep counter-clockwise winding seen from outside
                corners.reverse()
            for i in (0, 1, 2, 0, 2, 3):
                pos.append(corners[i]); nor.append(tuple(n))
    return pos, nor

sub = lambda a, b: [a[i] - b[i] for i in range(3)]
cross = lambda a, b: [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]

def loft(stations, segments=14, n=4.0):
    """A smooth body through cross-sections along z: stations are (z, half_width, y_bottom, y_top).
    Each section is a superellipse (n = 2 round, higher = boxier); ends are capped flat."""
    rings = []
    for z, w, yb, yt in stations:
        ym, h = (yb + yt) / 2, (yt - yb) / 2
        ring = []
        for i in range(segments):
            a = 2 * math.pi * i / segments
            c, s_ = math.cos(a), math.sin(a)
            ring.append((w * math.copysign(abs(c) ** (2 / n), c), ym + h * math.copysign(abs(s_) ** (2 / n), s_), z))
        rings.append(ring)
    # Smooth normals: each vertex averages the faces around it.
    acc = [[[0.0, 0.0, 0.0] for _ in range(segments)] for _ in rings]
    quads = []
    for k in range(len(rings) - 1):
        for i in range(segments):
            j = (i + 1) % segments
            A, B, C, D = rings[k][i], rings[k][j], rings[k + 1][j], rings[k + 1][i]
            nrm = cross(sub(B, A), sub(D, A))
            if sum(x * x for x in nrm) < 1e-12:
                nrm = cross(sub(C, B), sub(D, B))
            for kk, ii in ((k, i), (k, j), (k + 1, j), (k + 1, i)):
                for t in range(3):
                    acc[kk][ii][t] += nrm[t]
            quads.append(((k, i), (k, j), (k + 1, j), (k + 1, i)))
    unit = lambda v: [x / (math.sqrt(sum(y * y for y in v)) or 1) for x in v]
    pos, nor = [], []
    for q in quads:
        for kk, ii in (q[0], q[1], q[2], q[0], q[2], q[3]):
            pos.append(rings[kk][ii]); nor.append(unit(acc[kk][ii]))
    for ring, facing in ((rings[0], -1), (rings[-1], 1)):
        c = (0, sum(p[1] for p in ring) / segments, ring[0][2])
        for i in range(segments):
            j = (i + 1) % segments
            tri = (c, ring[i], ring[j]) if facing > 0 else (c, ring[j], ring[i])
            pos.extend(tri); nor.extend([(0, 0, facing)] * 3)
    return pos, nor

def quat_z(angle):
    return [0, 0, math.sin(angle / 2), math.cos(angle / 2)]
def quat_y(angle):
    return [0, math.sin(angle / 2), 0, math.cos(angle / 2)]

def write_glb(path, parts):
    """parts: list of (geometry, rgba, node fields)."""
    blob = bytearray()
    gltf = {"asset": {"version": "2.0", "generator": "nayan-engine make-models.py"},
            "scene": 0, "scenes": [{"nodes": []}], "nodes": [], "meshes": [], "materials": [],
            "accessors": [], "bufferViews": [], "buffers": []}
    for (pos, nor), color, node in parts:
        attrs = {}
        for name, data in (("POSITION", pos), ("NORMAL", nor)):
            view = {"buffer": 0, "byteOffset": len(blob), "byteLength": len(data) * 12, "target": 34962}
            for v in data:
                blob.extend(struct.pack("<3f", *v))
            acc = {"bufferView": len(gltf["bufferViews"]), "componentType": 5126, "count": len(data), "type": "VEC3"}
            if name == "POSITION":
                acc["min"] = [min(v[i] for v in data) for i in range(3)]
                acc["max"] = [max(v[i] for v in data) for i in range(3)]
            gltf["bufferViews"].append(view)
            attrs[name] = len(gltf["accessors"])
            gltf["accessors"].append(acc)
        gltf["materials"].append({"pbrMetallicRoughness": {"baseColorFactor": color, "metallicFactor": 0}})
        gltf["meshes"].append({"primitives": [{"attributes": attrs, "material": len(gltf["materials"]) - 1}]})
        gltf["scenes"][0]["nodes"].append(len(gltf["nodes"]))
        gltf["nodes"].append({"mesh": len(gltf["meshes"]) - 1, **node})
    gltf["buffers"].append({"byteLength": len(blob)})
    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    blob += b"\0" * (-len(blob) % 4)
    out = struct.pack("<4sII", b"glTF", 2, 12 + 8 + len(js) + 8 + len(blob))
    out += struct.pack("<I4s", len(js), b"JSON") + js + struct.pack("<I4s", len(blob), b"BIN\0") + bytes(blob)
    with open(path, "wb") as f:
        f.write(out)
    print(f"{path}: {len(out)} bytes")

here = os.path.join(os.path.dirname(__file__), "..", "assets", "models")
os.makedirs(here, exist_ok=True)

bark, leaf, leaf2 = [0.45, 0.3, 0.18, 1], [0.25, 0.6, 0.3, 1], [0.32, 0.7, 0.35, 1]
write_glb(os.path.join(here, "tree.glb"), [
    (prism(6, 0.18, 0.14, 0.8), bark, {}),
    (prism(7, 0.8, 0, 1.2), leaf, {"translation": [0, 0.6, 0]}),
    (prism(7, 0.6, 0, 1.0), leaf2, {"translation": [0, 1.2, 0], "rotation": quat_y(0.4)}),
])

white, red, glass = [0.92, 0.92, 0.95, 1], [0.9, 0.25, 0.2, 1], [0.3, 0.6, 0.95, 1]
fins = [(box(0.06, 0.5, 0.4), red, {"translation": [0.3 * math.cos(a), 0.25, -0.3 * math.sin(a)], "rotation": quat_y(a)})
        for a in (0, 2 * math.pi / 3, 4 * math.pi / 3)]
write_glb(os.path.join(here, "rocket.glb"), [
    (prism(10, 0.3, 0.3, 1.4), white, {}),
    (prism(10, 0.3, 0, 0.6), red, {"translation": [0, 1.4, 0]}),
    (box(0.04, 0.22, 0.22), glass, {"translation": [0, 1.0, -0.29], "rotation": quat_y(math.pi / 2)}),
    *fins,
])

# ── Cars ────────────────────────────────────────────────────────────────────
# Each car is two models in the same frame (front at -z, wheels on y = 0): a white body that the
# entity color tints to any paint, and untinted trim (glass, tyres, rims, lights). Lights sit just outside
# the body's end caps, or the body hides them.
GLASS, TYRE, RIM = [0.07, 0.09, 0.12, 1], [0.04, 0.04, 0.045, 1], [0.72, 0.73, 0.76, 1]
HEAD, TAIL, DARK, PAINT = [1, 0.96, 0.82, 1], [0.85, 0.05, 0.04, 1], [0.05, 0.05, 0.06, 1], [1, 1, 1, 1]

def wheels(radius, width, x, zs):
    """Tyres (axis along x, outer face at |x|) with a rim disc on the outside."""
    parts = []
    for side in (-1, 1):
        for z in zs:
            # prism runs along +y; rotated -90° about z it runs along +x, from the translation outwards.
            start = x - width if side > 0 else -x
            parts.append((prism(14, radius, radius, width), TYRE, {"translation": [start, radius, z], "rotation": quat_z(-math.pi / 2)}))
            parts.append((prism(10, radius * 0.62, radius * 0.62, 0.02), RIM,
                          {"translation": [side * x, radius, z], "rotation": quat_z(-side * math.pi / 2)}))
    return parts

def write_car(name, body, cabin, wheel, lights, extras=()):
    write_glb(os.path.join(here, f"{name}_body.glb"), [(loft(body, 16, 4.5), PAINT, {})])
    radius, width, wx, wzs = wheel
    (hx, hy, hz), (tx, ty, tz) = lights
    write_glb(os.path.join(here, f"{name}_trim.glb"), [
        (loft(cabin, 14, 3.2), GLASS, {}),
        *wheels(radius, width, wx, wzs),
        *[(box(0.36, 0.11, 0.06), HEAD, {"translation": [side * hx, hy, hz]}) for side in (-1, 1)],
        *[(box(0.42, 0.1, 0.05), TAIL, {"translation": [side * tx, ty, tz]}) for side in (-1, 1)],
        (box(hx * 1.1, 0.12, 0.05), DARK, {"translation": [0, hy - 0.13, hz + 0.01]}),  # grille
        *extras,
    ])

# Sports car: low wedge, long hood, fastback cabin, rear wing.
write_car(
    "sports",
    body=[(-2.25, 0.62, 0.30, 0.52), (-2.05, 0.84, 0.24, 0.62), (-1.4, 0.94, 0.20, 0.72), (-0.6, 0.97, 0.20, 0.78),
          (0.4, 0.98, 0.20, 0.82), (1.3, 0.97, 0.22, 0.85), (1.95, 0.92, 0.26, 0.84), (2.25, 0.82, 0.32, 0.78)],
    cabin=[(-0.75, 0.80, 0.74, 0.76), (-0.25, 0.74, 0.76, 1.04), (0.35, 0.68, 0.78, 1.14), (0.95, 0.66, 0.80, 1.08),
           (1.55, 0.72, 0.82, 0.88), (1.85, 0.76, 0.83, 0.84)],
    wheel=(0.34, 0.26, 0.98, (-1.4, 1.4)),
    lights=((0.38, 0.43, -2.27), (0.5, 0.62, 2.27)),
    extras=[(box(1.7, 0.05, 0.32), DARK, {"translation": [0, 1.06, 2.0]}),
            *[(box(0.06, 0.24, 0.16), DARK, {"translation": [side * 0.6, 0.94, 2.02]}) for side in (-1, 1)]],
)

# Sedan: taller, three-box shape with a boot.
write_car(
    "sedan",
    body=[(-2.3, 0.70, 0.32, 0.66), (-2.1, 0.86, 0.26, 0.76), (-1.2, 0.92, 0.24, 0.84), (-0.4, 0.93, 0.24, 0.86),
          (0.8, 0.93, 0.24, 0.88), (1.6, 0.92, 0.26, 0.92), (2.15, 0.86, 0.30, 0.92), (2.35, 0.76, 0.36, 0.86)],
    cabin=[(-0.65, 0.84, 0.84, 0.86), (-0.15, 0.80, 0.86, 1.30), (0.55, 0.78, 0.88, 1.38), (1.15, 0.78, 0.88, 1.36),
           (1.55, 0.82, 0.90, 0.96)],
    wheel=(0.35, 0.24, 0.95, (-1.45, 1.45)),
    lights=((0.44, 0.52, -2.32), (0.45, 0.72, 2.37)),
)

# SUV: boxy and tall, with roof rails.
write_car(
    "suv",
    body=[(-2.35, 0.80, 0.40, 0.86), (-2.15, 0.94, 0.34, 0.98), (-1.3, 0.98, 0.32, 1.06), (0.2, 0.99, 0.32, 1.08),
          (1.6, 0.99, 0.34, 1.10), (2.25, 0.96, 0.38, 1.12), (2.4, 0.88, 0.44, 1.08)],
    cabin=[(-1.0, 0.92, 1.04, 1.08), (-0.55, 0.90, 1.06, 1.62), (0.6, 0.90, 1.08, 1.70), (2.1, 0.90, 1.10, 1.68),
           (2.32, 0.88, 1.10, 1.40)],
    wheel=(0.42, 0.3, 1.0, (-1.45, 1.5)),
    lights=((0.5, 0.66, -2.37), (0.55, 0.9, 2.42)),
    extras=[*[(box(0.06, 0.06, 2.6), DARK, {"translation": [side * 0.7, 1.75, 0.8]}) for side in (-1, 1)]],
)
