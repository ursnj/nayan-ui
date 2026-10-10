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
