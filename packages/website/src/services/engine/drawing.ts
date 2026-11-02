import type { EngineGuide } from "./types";

export const DrawingGuides: EngineGuide[] = [
  {
    slug: "drawing",
    title: "Drawing and painting",
    description:
      "Paint with native brushes, layers and undo in a DrawingCanvas, save and export artwork, and use the same DrawingDocument to paint, trace and colour inside games.",
    sections: [
      {
        id: "documents-and-canvases",
        title: "Documents and canvases",
        paragraphs: [
          "DrawingDocument owns editable artwork in the Rust core: strokes, layers, tool settings and undo history. DrawingCanvas is a React component that shows a document and feeds it touch, Apple Pencil, stylus or mouse input. Live strokes and frame presentation never go through React state, so drawing stays smooth however large the artwork gets.",
          "Lifecycle: await warmUpEngine() (required in the browser), then create one document per screen with new DrawingDocument(width, height, pixelRatio?) in an effect. width and height are document units (the coordinate space of every API); pixelRatio sets raster resolution. Call clear() to start over and dispose() on unmount; dispose also frees the document's game texture. Unlike a World, a disposed document throws from its methods, so check document.isDisposed in late callbacks. Every editing call throws an Error with the core's message when an operation fails.",
        ],
        examples: [
          {
            title: "useDrawingDocument.ts",
            description:
              "A shared hook for both hosts. It creates the document after warm-up, ignores late setup after unmount and disposes it on cleanup.",
            code: `import { useEffect, useState } from "react";
import { DrawingDocument, warmUpEngine } from "@nayan-ui/engine";

export function useDrawingDocument(width: number, height: number) {
  const [drawing, setDrawing] = useState<DrawingDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    let owned: DrawingDocument | undefined;
    warmUpEngine().then(() => {
      if (cancelled) return;
      owned = new DrawingDocument(width, height, 2);
      owned.setBrush({ brushType: "MARKER", color: "#1e88e5", width: 8, opacity: 1, smoothing: 0.35 });
      setDrawing(owned);
    }).catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason));
    });
    return () => {
      cancelled = true;
      owned?.dispose();
    };
  }, [width, height]);
  return { drawing, error };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "a-complete-paint-screen",
        title: "A complete paint screen",
        paragraphs: [
          "Render DrawingCanvas with the document. mode is draw (default; two-finger pinch and pan still work), move (one finger pans) or view. background is the paper colour shown behind transparent artwork; it is not saved into exports. onChange receives a DrawingState when the document, a stroke boundary or the zoom changes (native hosts send at most about ten per second), so use it for Undo/Redo button state instead of polling. Every editing method also returns the new DrawingState.",
        ],
        examples: [
          {
            title: "PaintPage.tsx",
            description:
              "React browser screen. Save beside useDrawingDocument.ts and give it a sized parent.",
            code: `"use client";
import { useState } from "react";
import { DrawingCanvas, type DrawingState } from "@nayan-ui/engine";
import { useDrawingDocument } from "./useDrawingDocument";

export default function PaintPage() {
  const { drawing, error } = useDrawingDocument(390, 700);
  const [state, setState] = useState<DrawingState | null>(null);
  if (error) return <p role="alert">{error}</p>;
  if (!drawing) return <p>Loading…</p>;
  return <main style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
    <div style={{ display: "flex", gap: 8, padding: 8 }}>
      <button disabled={!state?.canUndo} onClick={() => setState(drawing.undo())}>Undo</button>
      <button disabled={!state?.canRedo} onClick={() => setState(drawing.redo())}>Redo</button>
      <button onClick={() => setState(drawing.updateControls({ tool: "eraser" }))}>Eraser</button>
      <button onClick={() => setState(drawing.updateControls({ tool: "brush", color: "#e53935" }))}>Red</button>
      <button onClick={() => setState(drawing.clear())}>Clear</button>
    </div>
    <DrawingCanvas document={drawing} mode="draw" background="#ffffff" onChange={setState}
      onError={reason => console.error(reason)} style={{ flex: 1, minHeight: 0 }} />
  </main>;
}`,
            platform: "react",
            language: "tsx",
          },
          {
            title: "PaintScreen.tsx",
            description:
              "React Native screen with the same hook. Needs a native development build.",
            code: `import { useState } from "react";
import { Button, Text, View } from "react-native";
import { DrawingCanvas, type DrawingState } from "@nayan-ui/engine";
import { useDrawingDocument } from "./useDrawingDocument";

export default function PaintScreen() {
  const { drawing, error } = useDrawingDocument(390, 700);
  const [state, setState] = useState<DrawingState | null>(null);
  if (error) return <Text accessibilityRole="alert">{error}</Text>;
  if (!drawing) return <Text>Loading…</Text>;
  return <View style={{ flex: 1 }}>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 8 }}>
      <Button title="Undo" disabled={!state?.canUndo} onPress={() => setState(drawing.undo())} />
      <Button title="Redo" disabled={!state?.canRedo} onPress={() => setState(drawing.redo())} />
      <Button title="Eraser" onPress={() => setState(drawing.updateControls({ tool: "eraser" }))} />
      <Button title="Red" onPress={() => setState(drawing.updateControls({ tool: "brush", color: "#e53935" }))} />
      <Button title="Clear" onPress={() => setState(drawing.clear())} />
    </View>
    <DrawingCanvas document={drawing} mode="draw" background="#ffffff" onChange={setState}
      onError={reason => console.error(reason)} style={{ flex: 1 }} />
  </View>;
}`,
            platform: "native",
            language: "tsx",
          },
        ],
      },
      {
        id: "brushes-tools-shapes-and-layers",
        title: "Brushes, tools, shapes and layers",
        paragraphs: [
          "Rust owns the tool settings. Change them with updateControls(partial) (tool, brushType, color, width, opacity, shape, filled, pressure, smoothing, or reset: true) and read the current values from state.controls. setBrush(options) sets the full brush in one call (brushType, color, width, opacity, plus optional isEraser, pressure, smoothing, tool, symmetry, filled and tolerance).",
          "Brushes: NORMAL, MARKER, PENCIL, CALLIGRAPHY, WATERCOLOR, NEON, CRAYON and SPRINKLING (spray). Compatible brushes respond to stylus pressure when pressure is true. symmetry mirrors strokes: none, vertical, horizontal or both. addShape(kind, x, y, endX, endY, filled?) draws one of 20 shapes (line, arrow, rectangle, circle, star, heart, speech-bubble, cloud and more); shapeCatalog() returns their names and SVG previews. fill(x, y, tolerance?) is a bucket fill.",
          "Up to 16 layers: layer('add' | 'duplicate' | 'select' | 'update' | 'move' | 'delete' | 'clear', options?). Layers have name, visible, locked and opacity, and layer operations share the undo history with strokes. View helpers: setViewFit('contain' | 'width'), resetView() and transform(dx, dy, scale?). They never change saved coordinates.",
        ],
        examples: [
          {
            title: "Set up a sketching layer",
            description:
              "Call once after creating the document. Every call returns the new DrawingState.",
            code: `import type { DrawingDocument } from "@nayan-ui/engine";
export function prepareSketch(drawing: DrawingDocument) {
  drawing.setBrush({ brushType: "PENCIL", color: "#224466", width: 3, opacity: 0.7, pressure: true, smoothing: 0.35 });
  drawing.layer("add"); // A new editable layer above the current one, now selected.
  drawing.layer("update", { name: "Details", opacity: 0.8 });
  drawing.addShape("ellipse", 40, 50, 180, 220, true);
  drawing.setViewFit("width"); // Fill the width; pan to reach tall artwork.
  return drawing.state; // Read-only snapshot: state.controls, state.layers, state.canUndo …
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "save-load-and-export",
        title: "Save, load and export",
        paragraphs: [
          "exportProject() returns the full editable source as JSON (version 2, with layers, order, visibility, locks and original metadata); load(project) reopens it. load also accepts the legacy SVG path array (a JSON string or SavedDrawingPath[]). Loading is atomic: if any stroke is invalid, load throws and the current artwork stays untouched.",
          "exportSVG() returns a transparent SVG. snapshot() returns a transparent PNG as { base64, width, height }, independent of zoom and pan. exportPaths() is the raw legacy array without layer settings. For autosave, captureDraft(afterRevision?) returns { project, revision, width, height } or null when nothing changed or a stroke is still in progress; it never finishes a stroke. setEditingEnabled(false) finishes any gesture and freezes editing for a consistent save.",
        ],
        examples: [
          {
            title: "Autosave only when something changed",
            description:
              "Call autosave from a timer or when the screen blurs. The revision makes repeated calls cheap; persist the project string with your own storage.",
            code: `import type { DrawingDocument } from "@nayan-ui/engine";
export function makeAutosave(drawing: DrawingDocument, save: (project: string) => void) {
  let revision = -1;
  return () => {
    const draft = drawing.captureDraft(revision);
    if (!draft) return false; // Unchanged, or a stroke is in progress.
    revision = draft.revision;
    save(draft.project);
    return true;
  };
}
export function exportImage(drawing: DrawingDocument) {
  const { base64, width, height } = drawing.snapshot();
  return { uri: "data:image/png;base64," + base64, width, height, svg: drawing.exportSVG() };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "paint-in-a-game",
        title: "Paint inside a game",
        paragraphs: [
          "Games use a DrawingDocument without a DrawingCanvas. document.texture() returns a live Texture you can put on any entity: transparent paper is cut out, in-progress strokes appear immediately and only changed rows upload each frame. It is created once per document and freed by dispose(); its pixels are not readable through texture APIs.",
          "Feed strokes from your own input with document.input(phase, x, y, pressure?, 'document'): phase 0 begins, 1 moves, 2 ends and 3 cancels a stroke; x and y are document coordinates. Always end (2) or cancel (3) a stroke you began, including when the drag is cancelled or the game pauses. On replay call clear(); on unmount dispose the world first, then the document.",
          "To map a touch onto a built-in plane, intersect it with world.screenToWorld and convert to the plane's 0..1 UV. An unrotated, unparented plane spans one unit before scaling: local x from -0.5 to 0.5 maps to u = 0..1 and local z from -0.5 to 0.5 maps to v = 0..1, so document x = u × width and y = v × height.",
        ],
        examples: [
          {
            title: "paintBoard.ts",
            description:
              "Call createPaintBoard after warmUpEngine with your world, pass drag to GameView's onDrag, and call dispose after the world is disposed. The board lies flat at y = 0, which is screenToWorld's default plane.",
            code: `import { DrawingDocument, type DragEvent, type World } from "@nayan-ui/engine";

const SIZE = 6; // World units across.

export function createPaintBoard(world: World) {
  const paper = new DrawingDocument(512, 512, 1);
  paper.setBrush({ brushType: "MARKER", color: "#e53935", width: 18, opacity: 1 });
  const board = world.spawn({ mesh: "plane", texture: paper.texture(), scale: [SIZE, 1, SIZE] });
  const hit: [number, number, number] = [0, 0, 0];
  let x = 0;
  let y = 0;
  let drawing = false;

  function drag(event: DragEvent) {
    const point = world.screenToWorld(event.x, event.y, undefined, hit);
    if (point) {
      x = (point[0] / SIZE + 0.5) * paper.width;
      y = (point[2] / SIZE + 0.5) * paper.height;
    }
    if (event.phase === "start") {
      if (!point) return;
      drawing = true;
      paper.input(0, x, y, 1, "document");
    } else if (drawing && event.phase === "move") {
      paper.input(1, x, y, 1, "document");
    } else if (drawing && event.phase === "end") {
      drawing = false;
      paper.input(event.cancelled ? 3 : 2, x, y, 1, "document");
    }
  }

  return {
    board, paper, drag,
    replay: () => paper.clear(),
    dispose: () => paper.dispose(), // After world.dispose().
  };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "read-strokes-and-score",
        title: "Read strokes and score drawings",
        paragraphs: [
          "strokes({ from?, tolerance? }) returns committed strokes as DrawingStroke objects in document coordinates: index, layerId, color, width, opacity, isEraser, brushType, style, bounds [x, y, width, height], lines and outline. lines are the smoothed centrelines of brush strokes drawn this session (one flat [x0, y0, x1, y1, …] array per symmetry copy); they are empty for loaded strokes, fills and shapes, so fall back to outline (flattened contours, each { points, closed }). tolerance (default 0.5 document units) controls how finely curves are flattened. Pass from: lastIndex + 1 to read only new strokes. strokes() never finishes a stroke under the finger.",
          "sample(x, y) returns the composited ink under a point as { color, alpha } (straight alpha; bare paper has alpha 0), or null off the paper; it includes a stroke in progress. coverage({ x?, y?, width?, height?, minAlpha? }) returns the fraction 0..1 of a rectangle (default: the whole paper) covered by ink at least minAlpha (default 0.5). Use them for colouring, tracing and scratch-off scores.",
        ],
        examples: [
          {
            title: "Turn new strokes into walls",
            description:
              "Call after a stroke ends in a 2D physics game looking down -z. Each segment of each new stroke becomes a thin fixed box, rotated with quat.z. Keep the returned next index for the following call.",
            code: `import { quat, type DrawingDocument, type Entity, type World } from "@nayan-ui/engine";

const UNITS_PER_PIXEL = 0.02;

export function strokesToWalls(world: World, paper: DrawingDocument, from: number) {
  const walls: Entity[] = [];
  let next = from;
  const toX = (px: number) => (px - paper.width / 2) * UNITS_PER_PIXEL;
  const toY = (py: number) => (paper.height / 2 - py) * UNITS_PER_PIXEL; // Document y points down.
  for (const stroke of paper.strokes({ from, tolerance: 4 })) {
    next = stroke.index + 1;
    if (stroke.isEraser) continue;
    const thickness = Math.max(0.05, stroke.width * UNITS_PER_PIXEL);
    const lines = stroke.lines.length ? stroke.lines : stroke.outline.map(contour => contour.points);
    for (const line of lines) {
      for (let i = 2; i + 1 < line.length; i += 2) {
        const x0 = toX(line[i - 2]!), y0 = toY(line[i - 1]!), x1 = toX(line[i]!), y1 = toY(line[i + 1]!);
        const length = Math.hypot(x1 - x0, y1 - y0);
        if (length < 0.01) continue;
        walls.push(world.spawn({
          mesh: "cube", physics: "fixed", color: [0.2, 0.2, 0.25],
          position: [(x0 + x1) / 2, (y0 + y1) / 2, 0], scale: [length, thickness, thickness],
          rotation: quat.z(Math.atan2(y1 - y0, x1 - x0)),
        }));
      }
    }
  }
  return { walls, next };
}`,
            platform: "shared",
            language: "tsx",
          },
          {
            title: "Score a colouring page",
            description:
              "Call when the player taps Done. Each region is a document rectangle that should be filled; the result is a 0..100 score plus whether the centre of the first region is the expected colour.",
            code: `import type { DrawingDocument } from "@nayan-ui/engine";

type Region = { x: number; y: number; width: number; height: number };

export function scoreColouring(paper: DrawingDocument, regions: readonly Region[], expected: string) {
  if (regions.length === 0) return { score: 0, rightColour: false };
  const filled = regions.map(region => paper.coverage({ ...region, minAlpha: 0.5 }));
  const score = Math.round((100 * filled.reduce((sum, value) => sum + value, 0)) / regions.length);
  const first = regions[0]!;
  const ink = paper.sample(first.x + first.width / 2, first.y + first.height / 2);
  return { score, rightColour: ink !== null && ink.alpha > 0.5 && ink.color.toLowerCase() === expected.toLowerCase() };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
    ],
  },
];
