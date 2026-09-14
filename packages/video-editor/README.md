# Nayan Cut — browser video editor

A CapCut-style non-linear video editor that runs entirely in the browser. No
uploads, no server, no WASM build of FFmpeg — decoding, compositing and encoding
all happen on the client through **WebCodecs**, with the UI built from
[`@nayan-ui/react`](https://www.nayanui.com).

```bash
yarn editor:dev     # from the repo root
```

Then open the printed URL. Requires a browser with WebCodecs (Chrome/Edge 94+,
Safari 16.4+).

## What it does

- **Import** video, audio and images by drag-and-drop or file picker
- **Timeline** with multiple video and audio tracks, drag to move, edge-drag to
  trim, split at the playhead, duplicate, snapping, zoom, per-track
  mute/hide/lock, filmstrip and waveform previews
- **Preview** on a canvas driven by the audio clock, with frame stepping and
  transport controls
- **Properties** per clip: speed, volume, opacity, fades, position/scale/
  rotation/flip, colour filters with presets, and full text styling
- **Text overlays** with font, size, colour, outline, alignment and position
- **Export** to MP4 with a choice of resolution and quality, progress reporting
  and cancellation

Keyboard: `Space` play/pause · `S` split · `⌫` delete · `←`/`→` frame step
(`⇧` for 10) · `Home`/`End` · `⌘Z`/`⇧⌘Z` undo/redo · `⌘D` duplicate ·
`⌘E` export · `Esc` deselect.

## How it works

[Mediabunny](https://mediabunny.dev) handles containers and wraps WebCodecs;
everything above that is in this package.

```
src/
  types.ts              Domain model. All times are microseconds — the unit
                        WebCodecs uses, so nothing is lost at the encode edge.
  store/editor.ts       Zustand store: clips, tracks, selection, undo/redo.
  media/
    library.ts          Import, probe, thumbnails, filmstrips, PCM + waveform
                        peaks. Owns everything non-serialisable, keyed by asset.
    frameReader.ts      Sequential frame access for the render loop.
  engine/
    compositor.ts       Draws the timeline at one instant onto a canvas.
    audioEngine.ts      Schedules clip audio on a Web Audio graph.
    player.ts           The preview loop.
    exporter.ts         Renders every frame and muxes an MP4.
  components/           UI, built from @nayan-ui/react.
```

Three decisions carry most of the weight:

**One compositor for preview and export.** `renderScene` takes a canvas context,
the scene and a timestamp. The preview points it at a visible `<canvas>`; the
exporter points it at an `OffscreenCanvas` at output resolution. Because clip
positions and font sizes are stored as fractions of the frame, the same scene
renders correctly at any resolution — so what you see really is what you get.

**Sequential frame reads, not random seeks.** Mediabunny's `getSample()` spins
up a decoder and replays the GOP on every call, which is right for a one-off
thumbnail and far too slow at 30fps. `SequentialVideoReader` instead keeps a
`sink.samples()` iterator open and walks it forward, only re-seeking when the
playhead jumps more than a second. Readers are keyed per clip, not per asset, so
two clips showing different parts of one file don't fight over one decoder.

**The audio clock drives playback.** Each clip is scheduled as a single
`AudioBufferSourceNode` when playback starts, so the browser mixes it
sample-accurately with no per-frame work; the render loop then reads its time
from that same clock instead of `performance.now()`, which is what keeps picture
and sound from drifting. Export reuses the identical scheduling code against an
`OfflineAudioContext`.

## Limits

- Export re-encodes the whole timeline; there's no smart passthrough of
  untouched segments.
- Decoded audio is held in memory for waveforms and playback, so very long
  sources are memory-hungry.
- Projects live in memory only — reloading the page starts over.
- Transitions are per-clip fades rather than cross-clip transitions.
