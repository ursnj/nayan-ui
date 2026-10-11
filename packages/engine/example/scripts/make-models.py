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
# Each car is three models in the same frame (front at -z, wheels on y = 0): a white body (paint, roof,
# pillars, mirrors) that the entity color tints to any paint, the windows, and untinted trim (bumpers,
# tyres, alloys, lights). Details sit just outside the surfaces they belong to, or the body hides them.
GLASS, TYRE, ALLOY, WELL = [0.05, 0.07, 0.1, 1], [0.035, 0.035, 0.04, 1], [0.78, 0.79, 0.82, 1], [0.02, 0.02, 0.025, 1]
HEAD, TAIL, TRIM, PLATE = [1, 0.97, 0.88, 1], [0.8, 0.03, 0.03, 1], [0.07, 0.07, 0.08, 1], [0.93, 0.93, 0.9, 1]
PAINT, CHROME = [1, 1, 1, 1], [0.7, 0.7, 0.72, 1]

def patch(stations, a0, a1, grow, steps=10, n=3.4):
    """Part of a loft's surface: section angles a0..a1 (0 = right side, pi/2 = top, pi = left) over the
    given stations, inflated by `grow` so it sits on top of the full loft (windows on a cabin)."""
    rings = []
    for z, w, yb, yt in stations:
        w, yt = w + grow, yt + grow
        ym, h = (yb + yt) / 2, (yt - yb) / 2
        ring = []
        for i in range(steps + 1):
            a = a0 + (a1 - a0) * i / steps
            c, s_ = math.cos(a), math.sin(a)
            ring.append((w * math.copysign(abs(c) ** (2 / n), c), ym + h * math.copysign(abs(s_) ** (2 / n), s_), z))
        rings.append(ring)
    acc = [[[0.0, 0.0, 0.0] for _ in range(steps + 1)] for _ in rings]
    quads = []
    for k in range(len(rings) - 1):
        for i in range(steps):
            A, B, C, D = rings[k][i], rings[k][i + 1], rings[k + 1][i + 1], rings[k + 1][i]
            nrm = cross(sub(B, A), sub(D, A))
            if sum(x * x for x in nrm) < 1e-12:
                nrm = cross(sub(C, B), sub(D, B))
            for kk, ii in ((k, i), (k, i + 1), (k + 1, i + 1), (k + 1, i)):
                for t in range(3):
                    acc[kk][ii][t] += nrm[t]
            quads.append(((k, i), (k, i + 1), (k + 1, i + 1), (k + 1, i)))
    unit = lambda v: [x / (math.sqrt(sum(y * y for y in v)) or 1) for x in v]
    pos, nor = [], []
    for q in quads:
        for kk, ii in (q[0], q[1], q[2], q[0], q[2], q[3]):
            pos.append(rings[kk][ii]); nor.append(unit(acc[kk][ii]))
    return pos, nor

def windows(cabin, grow=0.012):
    """Windshield, rear window and side windows as panels over a cabin loft; the roof and pillars
    between them stay painted."""
    pi = math.pi
    front, rear, middle = cabin[:2], cabin[-2:], cabin[1:-1]
    parts = [patch(front, 0.8, pi - 0.8, grow), patch(rear, 0.8, pi - 0.8, grow)]
    parts += [patch(middle, -0.3, 0.88, grow), patch(middle, pi - 0.88, pi + 0.3, grow)]
    pos, nor = [], []
    for p_, n_ in parts:
        pos += p_; nor += n_
    return pos, nor

def quat_x(angle):
    return [math.sin(angle / 2), 0, 0, math.cos(angle / 2)]

def band(stations, lo, hi, grow):
    """A loft over part of each section's height (lo..hi as fractions), pushed out by `grow`."""
    out = []
    for z, w, yb, yt in stations:
        h = yt - yb
        out.append((z, w + grow, yb + h * lo, max(yb + h * lo + 0.002, yb + h * hi)))
    return out

def width_at(stations, z):
    """Half width of a loft at z (linear between stations)."""
    for (z0, w0, *_), (z1, w1, *_) in zip(stations, stations[1:]):
        if z0 <= z <= z1:
            return w0 + (w1 - w0) * (z - z0) / (z1 - z0)
    return stations[0][1] if z < stations[0][0] else stations[-1][1]

def wheel(radius, width, outer, z):
    """Tyre with a dark rim face, five silver spokes and a hub; `outer` is the tyre's outside x (>0)."""
    parts = []
    for side in (-1, 1):
        start = outer - width if side > 0 else -outer
        rot = quat_z(-math.pi / 2)  # prism runs along +y; this turns it to +x, from the translation outwards
        parts.append((prism(18, radius, radius, width), TYRE, {"translation": [start, radius, z], "rotation": rot}))
        face = side * (outer + 0.004)
        parts.append((prism(16, radius * 0.66, radius * 0.66, 0.006), [0.12, 0.12, 0.13, 1],
                      {"translation": [face - (0.006 if side > 0 else 0), radius, z], "rotation": rot}))
        for k in range(5):
            parts.append((box(0.02, radius * 1.22, 0.06), ALLOY,
                          {"translation": [side * (outer + 0.014), radius, z], "rotation": quat_x(k * math.pi / 5)}))
        parts.append((prism(10, radius * 0.16, radius * 0.16, 0.02), ALLOY,
                      {"translation": [face - (0.02 if side > 0 else 0) + side * 0.02, radius, z], "rotation": rot}))
    return parts

def rear(body, cabin, tail, exhausts, sporty):
    """Everything on the back panel: light clusters in dark housings joined by a light bar, reversing
    lights, badge, number plate in a recess, boot-lid line, a finned diffuser, reflectors, exhaust tips
    and a third brake light at the top of the rear window. Sized from the body's last section."""
    ty, tz, tw = tail
    _, w, yb, yt = body[-1]
    h = yt - yb
    y = lambda f: yb + h * f  # height on the back panel, 0 = bottom .. 1 = top
    z = tz + 0.002
    parts = [
        (box(tw * 0.92, 0.008, 0.02), TRIM, {"translation": [0, y(0.86), z]}),              # boot-lid line
        (box(tw * 0.62, 0.05, 0.05), TAIL, {"translation": [0, ty, z]}),                     # light bar
        (box(0.11, 0.05, 0.03), CHROME, {"translation": [0, y(0.55), z]}),                    # badge
        (box(0.5, 0.15, 0.02), TRIM, {"translation": [0, y(0.38), z]}),                      # plate recess
        (box(0.42, 0.11, 0.025), PLATE, {"translation": [0, y(0.38), z + 0.005]}),
        (box(w * 1.5, 0.1, 0.06), TRIM, {"translation": [0, y(0.08), z + 0.01]}),             # diffuser
        *[(box(0.02, 0.1, 0.16), TRIM, {"translation": [x, y(0.08) - 0.02, z + 0.04]}) for x in (-0.3, -0.1, 0.1, 0.3)],
    ]
    for side in (-1, 1):
        cx = side * (tw / 2 - 0.16)
        parts += [
            (box(0.4, 0.18, 0.04), TRIM, {"translation": [cx, ty - 0.02, z]}),               # light housing
            (box(0.34, 0.12, 0.05), TAIL, {"translation": [cx, ty - 0.02, z + 0.004]}),
            (box(0.12, 0.05, 0.055), HEAD, {"translation": [cx - side * 0.09, ty - 0.05, z + 0.006]}),  # reversing
            (box(0.12, 0.04, 0.03), TAIL, {"translation": [side * (w * 0.78), y(0.2), z + 0.012]}),     # reflector
        ]
        if sporty:
            parts.append((box(0.16, 0.09, 0.03), TRIM, {"translation": [side * (w * 0.62), y(0.42), z]}))  # vent
    xs = (-0.5, -0.36, 0.36, 0.5) if exhausts == 4 else (-0.42, 0.42)
    for x in xs:
        parts += [
            (prism(10, 0.055, 0.055, 0.14), CHROME, {"translation": [x, y(0.06), tz - 0.06], "rotation": quat_x(math.pi / 2)}),
            (prism(10, 0.036, 0.036, 0.145), WELL, {"translation": [x, y(0.06), tz - 0.06], "rotation": quat_x(math.pi / 2)}),
        ]
    zr, _, _, yr = cabin[-2]
    parts.append((box(0.5, 0.035, 0.04), TAIL, {"translation": [0, yr + 0.005, zr + 0.06]}))  # third brake light
    return parts

def write_car(name, body, cabin, wheels, *, pillar=None, nose, tail, spoiler=False, rails=False, exhausts=2):
    radius, width, zs = wheels
    body_w = max(st[1] for st in body)
    outer = body_w + 0.035
    # Body: paint, roof and pillars (the cabin is painted; glass is a band over it in the trim).
    paint = [(loft(body, 22, 4.2), PAINT, {}), (loft(cabin, 18, 3.4), PAINT, {})]
    mz = cabin[0][0] + 0.35
    for side in (-1, 1):
        paint.append((box(0.12, 0.07, 0.1), PAINT, {"translation": [side * (width_at(cabin, mz) + 0.07), cabin[0][2] + 0.1, mz]}))  # mirrors
        if pillar is not None:
            paint.append((box(0.05, cabin[1][3] - cabin[1][2], 0.11), PAINT,
                          {"translation": [side * (width_at(cabin, pillar) + 0.012), (cabin[1][2] + cabin[1][3]) / 2 + 0.02, pillar]}))
    write_glb(os.path.join(here, f"{name}_body.glb"), paint)

    (hx, hy, hz, hw), (ty, tz, tw) = nose, tail
    # Windows all round, as their own model so they can be glossier than the trim.
    write_glb(os.path.join(here, f"{name}_glass.glb"), [(windows(cabin), GLASS, {})])
    trim = [
        (loft(band(body, 0.0, 0.2, 0.012), 22, 4.2), TRIM, {}),          # bumpers and side skirts
        *[(box(hw, 0.07, 0.04), HEAD, {"translation": [side * hx, hy, hz]}) for side in (-1, 1)],
        (box(hx * 1.3, 0.1, 0.05), TRIM, {"translation": [0, hy - 0.14, hz - 0.005]}),       # grille
        *rear(body, cabin, tail, exhausts, spoiler),
    ]
    for z in zs:
        for side in (-1, 1):  # wheel wells: dark discs just outside the body, behind the tyres
            trim.append((prism(20, radius * 1.24, radius * 1.24, 0.01), WELL,
                         {"translation": [side * (width_at(body, z) + 0.004), radius, z],
                          "rotation": quat_z(-side * math.pi / 2)}))
        trim += wheel(radius, width, outer, z)
    if spoiler:
        trim.append((box(body_w * 1.75, 0.04, 0.3), TRIM, {"translation": [0, body[-2][3] + 0.24, body[-2][0] + 0.05]}))
        trim += [(box(0.05, 0.24, 0.14), TRIM, {"translation": [side * 0.55, body[-2][3] + 0.11, body[-2][0] + 0.05]}) for side in (-1, 1)]
    if rails:
        trim += [(box(0.05, 0.06, (cabin[-2][0] - cabin[1][0]) * 0.95), TRIM,
                  {"translation": [side * 0.7, cabin[2][3] + 0.04, (cabin[-2][0] + cabin[1][0]) / 2]}) for side in (-1, 1)]
    write_glb(os.path.join(here, f"{name}_trim.glb"), trim)

# Sports car: low wedge nose, long hood, fastback cabin, rear wing.
write_car(
    "sports",
    body=[(-2.28, 0.58, 0.30, 0.48), (-2.15, 0.80, 0.24, 0.58), (-1.75, 0.92, 0.21, 0.66), (-1.1, 0.96, 0.20, 0.72),
          (-0.4, 0.97, 0.20, 0.77), (0.4, 0.98, 0.20, 0.81), (1.2, 0.98, 0.22, 0.84), (1.8, 0.95, 0.25, 0.84),
          (2.15, 0.88, 0.29, 0.81), (2.3, 0.78, 0.33, 0.76)],
    cabin=[(-0.8, 0.80, 0.74, 0.76), (-0.35, 0.75, 0.76, 1.02), (0.25, 0.68, 0.78, 1.15), (0.85, 0.66, 0.80, 1.12),
           (1.45, 0.70, 0.81, 0.96), (1.95, 0.76, 0.82, 0.84)],
    wheels=(0.34, 0.27, (-1.42, 1.38)),
    nose=(0.4, 0.42, -2.3, 0.34),
    tail=(0.66, 2.32, 1.3),
    spoiler=True,
    exhausts=4,
)

# Sedan: taller three-box shape with a boot and two side windows.
write_car(
    "sedan",
    body=[(-2.35, 0.68, 0.32, 0.64), (-2.2, 0.84, 0.26, 0.74), (-1.6, 0.91, 0.24, 0.82), (-0.8, 0.93, 0.24, 0.85),
          (0.2, 0.93, 0.24, 0.87), (1.2, 0.93, 0.25, 0.89), (1.85, 0.91, 0.27, 0.92), (2.25, 0.85, 0.31, 0.92),
          (2.38, 0.76, 0.36, 0.86)],
    cabin=[(-0.7, 0.84, 0.84, 0.86), (-0.2, 0.80, 0.86, 1.30), (0.5, 0.78, 0.88, 1.40), (1.1, 0.78, 0.88, 1.38),
           (1.6, 0.82, 0.90, 0.98)],
    wheels=(0.35, 0.25, (-1.45, 1.45)),
    pillar=0.42,
    nose=(0.46, 0.52, -2.37, 0.36),
    tail=(0.74, 2.4, 1.4),
)

# SUV: boxy and tall, with roof rails.
write_car(
    "suv",
    body=[(-2.4, 0.80, 0.40, 0.84), (-2.25, 0.93, 0.34, 0.97), (-1.6, 0.98, 0.32, 1.05), (-0.4, 0.99, 0.32, 1.08),
          (0.9, 0.99, 0.33, 1.09), (1.9, 0.99, 0.35, 1.11), (2.32, 0.95, 0.39, 1.12), (2.44, 0.87, 0.45, 1.08)],
    cabin=[(-1.05, 0.92, 1.04, 1.08), (-0.6, 0.90, 1.06, 1.64), (0.55, 0.90, 1.08, 1.72), (1.9, 0.90, 1.10, 1.70),
           (2.34, 0.88, 1.10, 1.42)],
    wheels=(0.43, 0.31, (-1.48, 1.52)),
    pillar=0.6,
    nose=(0.52, 0.68, -2.42, 0.4),
    tail=(0.92, 2.46, 1.5),
    rails=True,
)
