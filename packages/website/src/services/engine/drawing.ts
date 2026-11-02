import type { EngineGuide } from "./types";

export const DrawingGuides: EngineGuide[] = [
  {
    slug: "drawing",
    title: "Drawing and painting",
    description: "Paint with native brushes, layers and undo, and reuse the artwork inside games.",
    sections: [
      {
        id: "documents-and-canvases",
        title: "Documents and canvases",
        paragraphs: [
          "A DrawingDocument holds the artwork in the Rust core: strokes, layers, tool settings and undo history. DrawingCanvas shows a document and feeds it touch, pencil or mouse input without going through React state.",
          "new DrawingDocument(width, height, pixelRatio = 2) takes document units, the coordinates every method uses; await warmUpEngine() first (required on the web). Dispose it on unmount: after that its methods throw, so check isDisposed in late callbacks.",
        ],
        examples: [
          {
            title: "useDrawingDocument.ts",
            description: "One document per screen, shared by both hosts.",
            platform: "shared",
            language: "tsx",
            code: `import { useEffect, useState } from "react";
import { DrawingDocument, warmUpEngine } from "@nayan-ui/engine";

export function useDrawingDocument(width: number, height: number) {
  const [drawing, setDrawing] = useState<DrawingDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    let owned: DrawingDocument | undefined;
    warmUpEngine().then(() => {
      if (!active) return;
      owned = new DrawingDocument(width, height);
      owned.setBrush({ brushType: "MARKER", color: "#1E88E5", width: 8, opacity: 1 });
      setDrawing(owned);
    }).catch((reason: unknown) => active && setError(String(reason)));
    return () => {
      active = false;
      setDrawing(null);
      owned?.dispose();
    };
  }, [width, height]);
  return { drawing, error };
}`,
          },
        ],
      },
      {
        id: "paint-screen",
        title: "A paint screen with undo",
        paragraphs: [
          "Editing methods return the new DrawingState and onChange delivers it after each stroke, so drive buttons from state.canUndo and state.canRedo. undo(), redo() and clear() share one history with strokes and layer edits.",
        ],
        table: {
          headers: ["Prop", "Meaning"],
          rows: [
            ["document", "The DrawingDocument to show and edit"],
            [
              "mode",
              "'draw' (default; pinch and pan still work), 'move' (one finger pans) or 'view'",
            ],
            ["background", "Paper color behind transparent ink; not saved in exports"],
            ["active", "false stops showing and editing the document"],
            ["onChange", "The new DrawingState after strokes, edits and zoom"],
            ["onError", "Failures while reading a change"],
            ["style", "Container style; give it a size"],
          ],
        },
        examples: [
          {
            title: "PaintPage.tsx",
            platform: "react",
            language: "tsx",
            code: `"use client";
import { useState } from "react";
import { DrawingCanvas, type DrawingState } from "@nayan-ui/engine";
import { useDrawingDocument } from "./useDrawingDocument";

export default function PaintPage() {
  const { drawing, error } = useDrawingDocument(390, 700);
  const [state, setState] = useState<DrawingState | null>(null);
  if (error) return <p role="alert">{error}</p>;
  if (!drawing) return <p>Loading…</p>;
  return (
    <main style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button disabled={!state?.canUndo} onClick={() => setState(drawing.undo())}>Undo</button>
        <button disabled={!state?.canRedo} onClick={() => setState(drawing.redo())}>Redo</button>
        <button onClick={() => setState(drawing.clear())}>Clear</button>
      </div>
      <DrawingCanvas document={drawing} background="#FFFFFF" onChange={setState} style={{ flex: 1, minHeight: 0 }} />
    </main>
  );
}`,
          },
          {
            title: "PaintScreen.tsx",
            platform: "native",
            language: "tsx",
            code: `import { useState } from "react";
import { Button, Text, View } from "react-native";
import { DrawingCanvas, type DrawingState } from "@nayan-ui/engine";
import { useDrawingDocument } from "./useDrawingDocument";

export default function PaintScreen() {
  const { drawing, error } = useDrawingDocument(390, 700);
  const [state, setState] = useState<DrawingState | null>(null);
  if (error) return <Text accessibilityRole="alert">{error}</Text>;
  if (!drawing) return <Text>Loading…</Text>;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button title="Undo" disabled={!state?.canUndo} onPress={() => setState(drawing.undo())} />
        <Button title="Redo" disabled={!state?.canRedo} onPress={() => setState(drawing.redo())} />
        <Button title="Clear" onPress={() => setState(drawing.clear())} />
      </View>
      <DrawingCanvas document={drawing} background="#FFFFFF" onChange={setState} style={{ flex: 1 }} />
    </View>
  );
}`,
          },
        ],
      },
      {
        id: "brushes-and-tools",
        title: "Brushes and tools",
        paragraphs: [
          "setBrush(options) sets the whole brush at once; updateControls(partial) changes single settings (tool, color, width, shape…) and reset: true restores the defaults. Current values are in state.controls.",
        ],
        table: {
          headers: ["setBrush option", "Values"],
          rows: [
            [
              "brushType",
              "NORMAL, MARKER, PENCIL, CALLIGRAPHY, WATERCOLOR, NEON, CRAYON, SPRINKLING (spray)",
            ],
            ["color, width, opacity", "CSS color, document units, 0..1"],
            ["isEraser", "Erase instead of paint"],
            ["pressure", "Follow stylus pressure on brushes that support it"],
            ["smoothing", "Stroke smoothing, 0..1 (default 0.35)"],
            ["tool", "'brush', 'fill', 'picker' (sets state.pickedColor) or a shape name"],
            ["symmetry", "'none', 'vertical', 'horizontal' or 'both' mirroring"],
            ["filled, tolerance", "Fill drawn shapes; bucket-fill color tolerance"],
          ],
        },
        examples: [
          {
            title: "tools.ts",
            platform: "shared",
            language: "tsx",
            code: `import type { DrawingDocument } from "@nayan-ui/engine";

export function mirroredPencil(drawing: DrawingDocument) {
  drawing.setBrush({ brushType: "PENCIL", color: "#224466", width: 3, opacity: 0.8, pressure: true, symmetry: "vertical" });
}
export const eraser = (drawing: DrawingDocument) => drawing.updateControls({ tool: "eraser" });
export const redMarker = (drawing: DrawingDocument) =>
  drawing.updateControls({ tool: "brush", brushType: "MARKER", color: "#E53935", width: 12 });`,
          },
        ],
      },
      {
        id: "shapes-and-fills",
        title: "Shapes and fills",
        paragraphs: [
          "addShape(kind, x, y, endX, endY, filled?) draws one of 20 shapes (line, arrow, rectangle, circle, star, heart, speech-bubble, cloud…) between two document points. shapeCatalog() lists them with SVG previews for a picker, and fill(x, y, tolerance?) is a bucket fill.",
        ],
        examples: [
          {
            title: "shapes.ts",
            platform: "shared",
            language: "tsx",
            code: `import type { DrawingDocument } from "@nayan-ui/engine";

export function decorate(drawing: DrawingDocument) {
  drawing.addShape("star", 40, 40, 200, 200);
  drawing.addShape("speech-bubble", 220, 60, 380, 180, true);
  drawing.fill(120, 130); // fill inside the star with the brush color
  return drawing.shapeCatalog().map(({ kind, name, path }) => ({ kind, name, path })); // picker items
}`,
          },
        ],
      },
      {
        id: "layers-and-view",
        title: "Layers and the view",
        paragraphs: [
          "layer(action, options?) adds, duplicates, selects, updates, moves, deletes or clears a layer (up to 16), each with a name, visible, locked and opacity. Pass id to target a layer other than the active one; layer edits undo like strokes.",
          "setViewFit('contain' | 'width'), resetView() and transform(dx, dy, scale?) change only the view, never saved coordinates.",
        ],
        examples: [
          {
            title: "layers.ts",
            platform: "shared",
            language: "tsx",
            code: `import type { DrawingDocument } from "@nayan-ui/engine";

export function addInkLayer(drawing: DrawingDocument) {
  const base = drawing.state.layers[0]!;
  drawing.layer("update", { id: base.id, locked: true }); // protect the sketch
  drawing.layer("add"); // new layer above the active one, now selected
  drawing.layer("update", { name: "Ink", opacity: 0.9 });
  drawing.setViewFit("width");
}`,
          },
        ],
      },
      {
        id: "save-and-load",
        title: "Save and load",
        paragraphs: [
          "exportProject() returns the editable project as JSON (layers, order, locks and metadata) and load(project) reopens it; load also takes the older SVG path array. Loading is atomic: invalid input throws and leaves the artwork unchanged.",
          "For autosave, captureDraft(afterRevision) returns { project, revision } only when something changed and no stroke is in progress. setEditingEnabled(false) ends any gesture and freezes editing for a final save.",
        ],
        examples: [
          {
            title: "autosave.ts",
            description: "Call the returned function from a timer or when the screen blurs.",
            platform: "shared",
            language: "tsx",
            code: `import type { DrawingDocument } from "@nayan-ui/engine";

export function makeAutosave(drawing: DrawingDocument, save: (project: string) => void) {
  let revision = -1;
  return () => {
    const draft = drawing.captureDraft(revision);
    if (!draft) return; // unchanged, or a stroke is in progress
    revision = draft.revision;
    save(draft.project);
  };
}

export const restore = (drawing: DrawingDocument, project: string) => drawing.load(project);`,
          },
        ],
      },
      {
        id: "export-svg-and-png",
        title: "Export SVG and PNG",
        paragraphs: [
          "exportSVG() returns transparent SVG markup and snapshot() a transparent PNG as { base64, width, height }, both independent of zoom and pan. exportPaths() returns the legacy path array without layers.",
        ],
        examples: [
          {
            title: "exportImage.ts",
            platform: "shared",
            language: "tsx",
            code: `import type { DrawingDocument } from "@nayan-ui/engine";

export function exportImage(drawing: DrawingDocument) {
  const { base64, width, height } = drawing.snapshot();
  return { uri: "data:image/png;base64," + base64, width, height, svg: drawing.exportSVG() };
}`,
          },
        ],
      },
      {
        id: "game-texture",
        title: "Use a drawing as a game texture",
        paragraphs: [
          "texture() returns a live texture for any entity: paper is transparent, strokes appear as they're drawn and only changed rows upload. It's created once per document and freed by dispose(); call clear() to start a replay.",
          "Dispose the document only once nothing draws it: despawn its entities or dispose the world first.",
        ],
        examples: [
          {
            title: "paintGame.ts",
            description: "A useWorld setup with a 6 × 6 paintable board on the ground.",
            platform: "shared",
            language: "tsx",
            code: `import { DrawingDocument, type World } from "@nayan-ui/engine";

export function setupPaintGame(world: World) {
  const paper = new DrawingDocument(512, 512, 1);
  paper.setBrush({ brushType: "MARKER", color: "#E53935", width: 18, opacity: 1 });
  const board = world.spawn({ mesh: "plane", texture: paper.texture(), scale: [6, 1, 6] });
  return () => {
    world.despawn(board); // nothing draws the texture now…
    paper.dispose(); // …so the document can go; useWorld disposes the world next
  };
}`,
          },
        ],
      },
      {
        id: "game-input",
        title: "Paint from game input",
        paragraphs: [
          "input(phase, x, y, pressure, 'document') feeds a stroke from your own touches: 0 begins, 1 moves, 2 ends and 3 cancels. Always end a stroke you began, including when the game pauses; finish() and cancel() end whatever stroke is active.",
          "To paint on a plane, hit-test the touch with world.screenToWorld and map it to the plane's UV. An unrotated plane spans -0.5..0.5 before scaling, so document x = (localX + 0.5) × width.",
        ],
        examples: [
          {
            title: "paintInput.ts",
            description:
              "Pass the returned handler to GameView's onDrag; the board lies at y = 0, screenToWorld's default plane.",
            platform: "shared",
            language: "tsx",
            code: `import type { DragEvent, DrawingDocument, World } from "@nayan-ui/engine";

export function paintWithDrag(world: World, paper: DrawingDocument, size: number) {
  const hit: [number, number, number] = [0, 0, 0];
  let x = 0;
  let y = 0;
  let painting = false;
  return (event: DragEvent) => {
    const point = world.screenToWorld(event.x, event.y, undefined, hit);
    if (point) {
      x = (point[0] / size + 0.5) * paper.width;
      y = (point[2] / size + 0.5) * paper.height;
    }
    if (event.phase === "start") painting = point !== null;
    if (!painting) return;
    const phase = event.phase === "start" ? 0 : event.phase === "move" ? 1 : event.cancelled ? 3 : 2;
    paper.input(phase, x, y, 1, "document");
    if (event.phase === "end") painting = false;
  };
}`,
          },
        ],
      },
      {
        id: "read-strokes",
        title: "Read strokes",
        paragraphs: [
          "strokes({ from, tolerance }) returns committed strokes in document coordinates with color, width, bounds, lines and outline. lines are smoothed centrelines of strokes drawn this session (loaded strokes, fills and shapes only have outline); pass from: lastIndex + 1 to read only new ones.",
        ],
        examples: [
          {
            title: "strokesToWalls.ts",
            description:
              "Turns new strokes into thin fixed walls for a 2D game looking down -z; returns the next index.",
            platform: "shared",
            language: "tsx",
            code: `import { quat, type DrawingDocument, type World } from "@nayan-ui/engine";

const SCALE = 0.02; // world units per document unit

export function strokesToWalls(world: World, paper: DrawingDocument, from: number) {
  let next = from;
  const toX = (px: number) => (px - paper.width / 2) * SCALE;
  const toY = (py: number) => (paper.height / 2 - py) * SCALE; // document y points down
  for (const stroke of paper.strokes({ from, tolerance: 4 })) {
    next = stroke.index + 1;
    if (stroke.isEraser) continue;
    const lines = stroke.lines.length ? stroke.lines : stroke.outline.map((contour) => contour.points);
    for (const line of lines)
      for (let i = 2; i + 1 < line.length; i += 2) {
        const x0 = toX(line[i - 2]!), y0 = toY(line[i - 1]!), x1 = toX(line[i]!), y1 = toY(line[i + 1]!);
        const length = Math.hypot(x1 - x0, y1 - y0);
        if (length < 0.01) continue;
        world.spawn({
          mesh: "cube", physics: "fixed", color: "#333340", scale: [length, 0.1, 0.1],
          position: [(x0 + x1) / 2, (y0 + y1) / 2, 0], rotation: quat.z(Math.atan2(y1 - y0, x1 - x0)),
        });
      }
  }
  return next;
}`,
          },
        ],
      },
      {
        id: "score-drawings",
        title: "Score what was drawn",
        paragraphs: [
          "sample(x, y) returns the ink under a point as { color, alpha }, including a stroke in progress, or null off the paper. coverage({ x, y, width, height, minAlpha }) returns the fraction (0..1) of a rectangle, the whole paper by default, inked at least minAlpha (default 0.5).",
        ],
        examples: [
          {
            title: "scoreColouring.ts",
            description:
              "Call when the player taps Done; regions are document rectangles that should be filled.",
            platform: "shared",
            language: "tsx",
            code: `import type { DrawingDocument } from "@nayan-ui/engine";

type Region = { x: number; y: number; width: number; height: number };

export function scoreColouring(paper: DrawingDocument, regions: readonly Region[], expected: string) {
  const filled = regions.map((region) => paper.coverage(region));
  const score = Math.round((100 * filled.reduce((sum, value) => sum + value, 0)) / Math.max(1, regions.length));
  const first = regions[0];
  const ink = first ? paper.sample(first.x + first.width / 2, first.y + first.height / 2) : null;
  return { score, rightColour: !!ink && ink.alpha > 0.5 && ink.color.toLowerCase() === expected.toLowerCase() };
}`,
          },
        ],
      },
    ],
  },
];
