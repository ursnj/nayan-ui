#!/usr/bin/env python3
"""Converts Khronos' "Car Concept" glTF sample into the racing game's three car models.

Source: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept (CC-BY 4.0;
built from a public-domain model by Unity Fan). Download glTF-Binary/CarConcept.glb.

  assets/models/car_body.glb   the paint, in white, so each entity's color paints it any color
  assets/models/car_glass.glb  the windows (loaded glossier than the rest)
  assets/models/car_trim.glb   everything else: tyres, rims, lights, black panels, mirrors, plate

The interior, engine, wipers and hidden brake parts are dropped, textures and material extensions are
replaced by flat colors, the car is turned to face -z (the engine's forward) and stood on y = 0, and the
mesh is simplified with glTF-Transform (meshoptimizer) to a size that suits phones.

Run from the example directory:
  python3 scripts/import-car.py CarConcept.glb <path to gltf-transform>
(install it anywhere with `npm install @gltf-transform/cli`; it's only needed to run this script)
"""
import json, os, struct, subprocess, sys, tempfile

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "models")
RATIO, ERROR = 0.1, 0.004  # keep ~10% of the triangles, within 0.4% of the car's size

# Parts the game never shows (seen through dark glass, from outside, at speed).
DROP = ("Interior", "Engine", "Axles", "BodyHoodInterior", "BodyHoodUnder", "BodyWindshieldWipers", "BrakePad", "BrakeDisc")

# Material -> (group, color). "paint" becomes the white body; everything else keeps its color.
MATERIALS = {
    "Paint 1 Carmine": ("paint", (1, 1, 1)),
    "Paint 2 Carmine": ("trim", (0.05, 0.05, 0.06)),  # black accent panels and roof
    "Glass": ("glass", (0.06, 0.08, 0.11)),
    "Rim1": ("trim", (0.16, 0.16, 0.18)),
    "Rim2": ("trim", (0.78, 0.79, 0.82)),
    "Tireside": ("trim", (0.07, 0.07, 0.075)),
    "Tiretread": ("trim", (0.05, 0.05, 0.055)),
    "Headlight": ("trim", (1, 0.97, 0.9)),
    "Brakelight": ("trim", (0.85, 0.05, 0.05)),
    "Signallight": ("trim", (1, 0.6, 0.1)),
    "Mirror": ("trim", (0.72, 0.74, 0.78)),
    "License": ("trim", (0.92, 0.92, 0.9)),
    "Brake": ("trim", (0.7, 0.05, 0.04)),
}
DEFAULT = ("trim", (0.04, 0.04, 0.045))  # unnamed blacks: gaskets, panels, underside


def read_glb(path):
    data = open(path, "rb").read()
    jlen = struct.unpack("<I", data[12:16])[0]
    gltf = json.loads(data[20:20 + jlen])
    blen = struct.unpack("<I", data[20 + jlen:24 + jlen])[0]
    return gltf, data[28 + jlen:28 + jlen + blen]


def accessor(gltf, blob, index):
    a = gltf["accessors"][index]
    view = gltf["bufferViews"][a["bufferView"]]
    comps = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}[a["type"]]
    fmt = {5126: "f", 5125: "I", 5123: "H", 5121: "B"}[a["componentType"]]
    size = struct.calcsize(fmt)
    stride = view.get("byteStride", size * comps)
    base = view.get("byteOffset", 0) + a.get("byteOffset", 0)
    return [struct.unpack_from(f"<{comps}{fmt}", blob, base + i * stride) for i in range(a["count"])]


def mat_mul(a, b):
    """Column-major 4x4 matrices (as glTF stores them)."""
    return [sum(a[k * 4 + r] * b[c * 4 + k] for k in range(4)) for c in range(4) for r in range(4)]


def local_matrix(n):
    if "matrix" in n:
        return list(n["matrix"])
    (tx, ty, tz), (x, y, z, w), (sx, sy, sz) = n.get("translation", [0, 0, 0]), n.get("rotation", [0, 0, 0, 1]), n.get("scale", [1, 1, 1])
    return [(1 - 2 * (y * y + z * z)) * sx, 2 * (x * y + z * w) * sx, 2 * (x * z - y * w) * sx, 0,
            2 * (x * y - z * w) * sy, (1 - 2 * (x * x + z * z)) * sy, 2 * (y * z + x * w) * sy, 0,
            2 * (x * z + y * w) * sz, 2 * (y * z - x * w) * sz, (1 - 2 * (x * x + y * y)) * sz, 0,
            tx, ty, tz, 1]


def meshes_in_scene(gltf):
    """(mesh index, node name, place point, turn normal) for each node with a mesh, transforms applied."""
    out = []
    def visit(i, parent):
        n = gltf["nodes"][i]
        m = mat_mul(parent, local_matrix(n))
        if "mesh" in n:
            # Normals use the inverse transpose of the 3x3 part (its cofactors; the scale is normalized away).
            a, b, c = m[0:3], m[4:7], m[8:11]
            cross = lambda u, v: (u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0])
            nc = (cross(b, c), cross(c, a), cross(a, b))
            place = lambda p, m=m: tuple(m[r] * p[0] + m[4 + r] * p[1] + m[8 + r] * p[2] + m[12 + r] for r in range(3))
            turn = lambda v, nc=nc: tuple(nc[0][r] * v[0] + nc[1][r] * v[1] + nc[2][r] * v[2] for r in range(3))
            out.append((n["mesh"], n.get("name") or "", place, turn))
        for ch in n.get("children", []):
            visit(ch, m)
    identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    for root in gltf["scenes"][gltf.get("scene", 0)]["nodes"]:
        visit(root, identity)
    return out


def write_glb(path, prims):
    """prims: [(material name, rgb, positions, normals, indices)] -> one indexed mesh."""
    blob = bytearray()
    gltf = {"asset": {"version": "2.0", "generator": "nayan-engine import-car.py"}, "scene": 0,
            "scenes": [{"nodes": [0]}], "nodes": [{"mesh": 0}], "meshes": [{"primitives": []}],
            "materials": [], "accessors": [], "bufferViews": []}
    def view(data, target):
        blob.extend(b"\0" * (-len(blob) % 4))
        gltf["bufferViews"].append({"buffer": 0, "byteOffset": len(blob), "byteLength": len(data), "target": target})
        blob.extend(data)
        return len(gltf["bufferViews"]) - 1
    for name, rgb, pos, nor, idx in prims:
        if not idx:
            continue
        a = len(gltf["accessors"])
        gltf["accessors"].append({"bufferView": view(b"".join(struct.pack("<3f", *p) for p in pos), 34962), "componentType": 5126,
                                  "count": len(pos), "type": "VEC3", "min": [min(p[i] for p in pos) for i in range(3)],
                                  "max": [max(p[i] for p in pos) for i in range(3)]})
        gltf["accessors"].append({"bufferView": view(b"".join(struct.pack("<3f", *n) for n in nor), 34962), "componentType": 5126,
                                  "count": len(nor), "type": "VEC3"})
        short = len(pos) <= 65535
        gltf["accessors"].append({"bufferView": view(struct.pack(f"<{len(idx)}{'H' if short else 'I'}", *idx), 34963),
                                  "componentType": 5123 if short else 5125, "count": len(idx), "type": "SCALAR"})
        gltf["materials"].append({"name": name, "pbrMetallicRoughness": {"baseColorFactor": [*rgb, 1], "metallicFactor": 0}})
        gltf["meshes"][0]["primitives"].append({"attributes": {"POSITION": a, "NORMAL": a + 1}, "indices": a + 2,
                                                "material": len(gltf["materials"]) - 1})
    blob.extend(b"\0" * (-len(blob) % 4))
    gltf["buffers"] = [{"byteLength": len(blob)}]
    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    out = struct.pack("<4sII", b"glTF", 2, 28 + len(js) + len(blob))
    out += struct.pack("<I4s", len(js), b"JSON") + js + struct.pack("<I4s", len(blob), b"BIN\0") + bytes(blob)
    with open(path, "wb") as f:
        f.write(out)
    tris = sum(len(p[4]) for p in prims) // 3
    print(f"{os.path.normpath(path)}: {len(out) // 1024} KB, {tris} triangles")


def clean(src, dst):
    """Exterior parts only, flat colors grouped by material, transforms applied, facing -z on y = 0."""
    gltf, blob = read_glb(src)
    mats = gltf["materials"]
    groups = {}  # material key -> (group, rgb, positions, normals, indices)
    for mesh, name, place, turn in meshes_in_scene(gltf):
        if any(d in name for d in DROP):
            continue
        for prim in gltf["meshes"][mesh]["primitives"]:
            mname = mats[prim["material"]].get("name", "") if "material" in prim else ""
            group, rgb = MATERIALS.get(mname, DEFAULT)
            key = f"{group}:{rgb}"
            g = groups.setdefault(key, (group, rgb, [], [], []))
            base = len(g[2])
            for p in accessor(gltf, blob, prim["attributes"]["POSITION"]):
                q = place(p)
                g[2].append((-q[0], q[1], -q[2]))  # turn around: the source faces +z once upright
            for n in accessor(gltf, blob, prim["attributes"]["NORMAL"]):
                v = turn(n)
                ln = sum(x * x for x in v) ** 0.5 or 1
                g[3].append((-v[0] / ln, v[1] / ln, -v[2] / ln))
            idx = [i[0] for i in accessor(gltf, blob, prim["indices"])]
            g[4].extend(base + i for i in idx)
    # Stand it on y = 0, centred along its length.
    every = [p for g in groups.values() for p in g[2]]
    floor = min(p[1] for p in every)
    mid = (min(p[2] for p in every) + max(p[2] for p in every)) / 2
    prims = []
    for key, (group, rgb, pos, nor, idx) in groups.items():
        prims.append((f"{group}|{rgb[0]},{rgb[1]},{rgb[2]}", rgb, [(p[0], p[1] - floor, p[2] - mid) for p in pos], nor, idx))
    write_glb(dst, prims)


def split(src):
    gltf, blob = read_glb(src)
    out = {"paint": [], "glass": [], "trim": []}
    for prim in gltf["meshes"][0]["primitives"]:
        name = gltf["materials"][prim["material"]]["name"]
        group, rgb = name.split("|")
        rgb = tuple(float(x) for x in rgb.split(","))
        pos = accessor(gltf, blob, prim["attributes"]["POSITION"])
        nor = accessor(gltf, blob, prim["attributes"]["NORMAL"])
        idx = [i[0] for i in accessor(gltf, blob, prim["indices"])]
        out[group].append((name, rgb, pos, nor, idx))
    write_glb(os.path.join(OUT, "car_body.glb"), out["paint"])
    write_glb(os.path.join(OUT, "car_glass.glb"), out["glass"])
    write_glb(os.path.join(OUT, "car_trim.glb"), out["trim"])


def main(src, tool):
    with tempfile.TemporaryDirectory() as tmp:
        cleaned, welded, simple = (os.path.join(tmp, f) for f in ("clean.glb", "weld.glb", "simple.glb"))
        clean(src, cleaned)
        subprocess.run([tool, "weld", cleaned, welded], check=True, stdout=subprocess.DEVNULL)
        subprocess.run([tool, "simplify", welded, simple, "--ratio", str(RATIO), "--error", str(ERROR)], check=True, stdout=subprocess.DEVNULL)
        split(simple)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(sys.argv[1], sys.argv[2])
