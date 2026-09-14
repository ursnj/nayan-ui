# Nayan Cut — browser video editor

A non-linear video editor that runs entirely in the browser. No uploads, no
server, no WASM build of FFmpeg — decoding, compositing, GPU effects and
encoding all happen on the client through **WebCodecs**, with the UI built from
[`@nayan-ui/react`](https://www.nayanui.com).

```bash
yarn editor:dev     # from the repo root
```

Requires a browser with WebCodecs (Chrome/Edge 94+, Safari 16.4+). WebGL2 is
used for the effects pipeline and degrades to Canvas2D if unavailable.

## What it does

**Timeline** — video and audio tracks with per-track height, level, mute, hide,
lock and reordering. Select and razor tools. Multi-select by shift-click or
rubber-band. Drag to move (groups stay rigid), edge-drag to trim, split, ripple
delete, duplicate, copy/cut/paste, link and detach audio, markers, in/out
range, snapping, filmstrip and waveform previews, ⌘-scroll zoom.

**Keyframes** — the properties worth animating: position, scale, rotation,
opacity, brightness, contrast, saturation, blur, volume, and text size and
position. Diamonds in the inspector add and remove keys at the playhead; keys
are drawn on the clip and survive moving, trimming and splitting.

**Clip properties** — opacity, fades, speed, reverse; position, scale,
rotation, flip; brightness, contrast, saturation, temperature, blur with 8
colour presets; crop; volume and mute; green screen with similarity, edge
softness and spill removal.

**Text** — 4 presets, then font, size, weight, italic, colour, background,
outline, alignment, position and 5 entrance animations.

**Transitions** — dissolve, fade to black, wipe left/right, slide and zoom,
applied to a clip's incoming edge.

**Preview** — direct manipulation on the canvas (drag, corner-scale, rotate),
safe zones, thirds grid, PNG frame export, loop, frame stepping and
edit-to-edit navigation.

**Export** — 1080p / 720p / vertical / square presets or a custom size, MP4 or
WebM, quality choice, optional in/out range, live fps and ETA, cancellation.

**Shell** — each region sits on its own island with the background showing
through between them; the gutters double as resize handles and remember their
size. Light and dark themes, and project save/open as JSON.

Everything is driven by the toolbars, the inspector and right-click menus —
there are no keyboard shortcuts. The one modifier gesture is ⌘/Ctrl-scroll to
zoom the timeline around the pointer.

## How it works

[Mediabunny](https://mediabunny.dev) handles containers and wraps WebCodecs;
everything above that is in this package.

```
src/
  types.ts              Domain model. All times are microseconds — the unit
                        WebCodecs uses — and all geometry is a fraction of the
                        frame, so a project renders identically at any size.
  lib/
    keyframes.ts        Interpolation, and the transforms that keep keys valid
                        through trims, speed changes and splits.
    factories.ts        Clip and track constructors, plus text presets.
  store/editor.ts       Zustand store: clips, tracks, markers, selection,
                        clipboard, tools and undo/redo.
  media/
    library.ts          Import, probe, thumbnails, filmstrips, PCM + waveform
                        peaks. Owns everything non-serialisable, keyed by asset.
    frameReader.ts      Sequential frame access for the render loop.
  engine/
    compositor.ts       Draws the timeline at one instant onto a canvas.
    glProcessor.ts      WebGL2 fragment shader for per-pixel effects.
    transitions.ts      Declarative transition states.
    audioEngine.ts      Schedules clip audio on a Web Audio graph.
    player.ts           The preview loop.
    exporter.ts         Renders every frame and muxes the output.
  components/           UI, built from @nayan-ui/react.
```

Five decisions carry most of the weight:

**One compositor for preview and export.** `renderScene` takes a canvas
context, the scene and a timestamp. The preview points it at a visible
`<canvas>`; the exporter points it at an `OffscreenCanvas` at output
resolution. Because all geometry is fractional, the same scene renders
correctly at any resolution — so what you see really is what you get.

**Sequential frame reads, not random seeks.** Mediabunny's `getSample()` spins
up a decoder and replays the GOP on every call, which is right for a one-off
thumbnail and far too slow at 30fps. `SequentialVideoReader` instead keeps a
`sink.samples()` iterator open and walks it forward, only re-seeking when the
playhead jumps more than a second. Readers are keyed per clip _and_ per target,
so two clips from one file — or a background export and the live preview —
never fight over one decoder.

**A GPU pass, but only when it earns it.** `ctx.filter` handles brightness,
contrast, saturate, grayscale and blur perfectly well and stays on the fast
path. Two things depend on a pixel's own value and can't be expressed that way
— chroma keying and colour temperature — so only layers using those take a
WebGL2 detour.

**The audio clock drives playback.** Each clip is scheduled as a single
`AudioBufferSourceNode` when playback starts, so the browser mixes it
sample-accurately with no per-frame work; the render loop then reads its time
from that same clock instead of `performance.now()`, which is what keeps
picture and sound from drifting. Export reuses the identical scheduling code
against an `OfflineAudioContext`.

**Renders are isolated from React.** The playhead updates 60 times a second,
so only the components that truly need it subscribe to it — the readout, the
marker, the meter. Clips are memoised and virtualised to the viewport, drags
write through `beginInteraction`/`endInteraction` so a gesture is one undo
entry rather than hundreds, and panel resizing writes straight to the DOM until
the pointer is released.

## Testing

The editing model has a headless suite covering the time maths, keyframe
transforms, transition states, and every store action — 58 checks:

```bash
node_modules/.bin/rolldown <test>.ts -o out.mjs --format esm --platform node && node out.mjs
```

## Limits

- Export re-encodes the whole timeline; there's no smart passthrough of
  untouched segments.
- Decoded audio is held in memory for waveforms and playback, so very long
  sources are memory-hungry.
- Saved projects reference media by name — the files must be re-imported after
  opening, since browsers can't persist file handles from an object URL.
- Speed changes resample rather than time-stretch, so pitch shifts with rate.
- No masks, blend modes, shapes or adjustment layers — deliberately left out to
  keep the surface small. The compositor has room for them if they're wanted.
