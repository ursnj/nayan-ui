import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { NButton, cn } from "@nayan-ui/react";
import {
  Copy,
  Expand,
  Film,
  FlipHorizontal,
  FlipVertical,
  Group,
  Link2,
  Lock,
  Magnet,
  MousePointer2,
  Music,
  Plus,
  Ratio,
  Scaling,
  Split,
  Trash2,
  Ungroup,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { player, seekTo } from "../../engine/playerInstance";
import { MOD_LABEL, useCommand } from "../../lib/shortcuts";
import { clamp } from "../../lib/utils";
import { canSplitAt, readEditorState, timelineDurationUs, useEditor } from "../../store/editor";
import { MEDIA_FIT_LABELS, US, clipEndUs, isMediaClip } from "../../types";
import type { Clip, MediaFit, Track } from "../../types";
import { IconButton, SegmentedControl } from "../controls";
import { ClipView, DEFAULT_ASPECT } from "./ClipView";
import type { ClipPreview, TrimEdge } from "./ClipView";
import { ContextMenu } from "./ContextMenu";
import type { MenuItem } from "./ContextMenu";
import { TimeRuler } from "./TimeRuler";
import { TrackHeader } from "./TrackHeader";
import {
  HEADER_WIDTH,
  RULER_HEIGHT,
  SNAP_RADIUS_PX,
  TAIL_PADDING_PX,
  VIRTUALISE_OVERSCAN_PX,
} from "./constants";

type DragState =
  | { kind: "scrub" }
  | { kind: "marquee"; originX: number; originY: number }
  | {
      kind: "move";
      clipId: string;
      grabOffsetUs: number;
      originStarts: Map<string, { startUs: number; trackIndex: number }>;
      originTrackIndex: number;
    }
  | { kind: "trim"; clipId: string; edge: TrimEdge };

const ASSET_MIME = "application/x-nayan-asset";

const FIT_OPTIONS: { value: MediaFit; label: React.ReactNode; title: string }[] = [
  { value: "contain", label: <Ratio className="h-3.5 w-3.5" />, title: MEDIA_FIT_LABELS.contain },
  { value: "cover", label: <Expand className="h-3.5 w-3.5" />, title: MEDIA_FIT_LABELS.cover },
  { value: "stretch", label: <Scaling className="h-3.5 w-3.5" />, title: MEDIA_FIT_LABELS.stretch },
];

/** Stable empty list, so a track with no clips doesn't break row memoisation. */
const NO_CLIPS: Clip[] = [];
const QUANTISE_PX = VIRTUALISE_OVERSCAN_PX / 2;
/** The sticky head above the lanes is just the ruler. */
const HEAD_HEIGHT = RULER_HEIGHT;

export const Timeline = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const snapGuideRef = useRef<HTMLDivElement>(null);
  const [marquee, setMarquee] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const [viewport, setViewport] = useState({ left: 0, width: 0 });

  const tracks = useEditor((state) => state.tracks);
  const clips = useEditor((state) => state.clips);
  const assets = useEditor((state) => state.assets);
  const pxPerSec = useEditor((state) => state.pxPerSec);
  const snapEnabled = useEditor((state) => state.snapEnabled);
  const rippleEnabled = useEditor((state) => state.rippleEnabled);
  const selectedClipIds = useEditor((state) => state.selectedClipIds);
  const durationUs = useEditor((state) => timelineDurationUs(state.clips));

  const selectClip = useEditor((state) => state.selectClip);
  const setSelection = useEditor((state) => state.setSelection);
  const splitAt = useEditor((state) => state.splitAt);
  const duplicateSelection = useEditor((state) => state.duplicateSelection);
  const deleteSelection = useEditor((state) => state.deleteSelection);
  const groupSelection = useEditor((state) => state.groupSelection);
  const ungroupSelection = useEditor((state) => state.ungroupSelection);
  const addTrack = useEditor((state) => state.addTrack);
  const updateTrack = useEditor((state) => state.updateTrack);
  const removeTrack = useEditor((state) => state.removeTrack);
  const updateClip = useEditor((state) => state.updateClip);
  const setSelectionFit = useEditor((state) => state.setSelectionFit);
  const toggleSelectionFlip = useEditor((state) => state.toggleSelectionFlip);
  const addClipFromAsset = useEditor((state) => state.addClipFromAsset);
  const setZoom = useEditor((state) => state.setZoom);
  const toggleSnap = useEditor((state) => state.toggleSnap);
  const toggleRipple = useEditor((state) => state.toggleRipple);
  const copySelection = useEditor((state) => state.copySelection);
  const detachAudio = useEditor((state) => state.detachAudio);

  const laneWidth = Math.max(400, viewport.width - HEADER_WIDTH);
  const projectWidth = (durationUs / US) * pxPerSec;

  const contentWidth = Math.max(
    laneWidth,
    projectWidth > laneWidth ? projectWidth + TAIL_PADDING_PX : projectWidth,
  );

  const clipsByTrack = useMemo(() => {
    const byTrack = new Map<string, Clip[]>();
    for (const clip of clips) {
      const list = byTrack.get(clip.trackId);
      if (list) list.push(clip);
      else byTrack.set(clip.trackId, [clip]);
    }
    return byTrack;
  }, [clips]);

  const previews = useMemo(
    () =>
      new Map<string, ClipPreview>(
        assets.map((asset) => [
          asset.id,
          {
            poster: asset.thumbnail,
            aspect:
              asset.width > 0 && asset.height > 0 ? asset.width / asset.height : DEFAULT_ASPECT,
          },
        ]),
      ),
    [assets],
  );

  /** Cumulative row offsets, so hit-testing works with per-track heights. */
  const rowOffsets = useMemo(() => {
    const offsets: number[] = [];
    let y = 0;
    for (const track of tracks) {
      offsets.push(y);
      y += track.height;
    }
    return offsets;
  }, [tracks]);
  const tracksHeight =
    rowOffsets.length > 0
      ? rowOffsets[rowOffsets.length - 1] + tracks[tracks.length - 1].height
      : 0;

  /** Pointer x → timeline time. Accounts for scroll and the sticky header column. */
  const timeAt = useCallback((clientX: number) => {
    const element = scrollRef.current;
    if (!element) return 0;
    const rect = element.getBoundingClientRect();
    const x = clientX - rect.left + element.scrollLeft - HEADER_WIDTH;
    return Math.max(0, (x / readEditorState().pxPerSec) * US);
  }, []);

  /** Pointer y → track index, honouring each track's own height. */
  const trackIndexAt = useCallback(
    (clientY: number) => {
      const element = scrollRef.current;
      if (!element) return 0;
      const rect = element.getBoundingClientRect();
      const y = clientY - rect.top + element.scrollTop - HEAD_HEIGHT;
      const state = readEditorState();
      let index = state.tracks.length - 1;
      for (let i = 0; i < state.tracks.length; i++) {
        const top = rowOffsets[i] ?? 0;
        const bottom = top + state.tracks[i].height;
        if (y >= top && y < bottom) {
          index = i;
          break;
        }
        if (y < top) {
          index = i;
          break;
        }
      }
      return clamp(index, 0, state.tracks.length - 1);
    },
    [rowOffsets],
  );

  const snapTime = useCallback(
    (timeUs: number, excludeIds: Set<string>): { timeUs: number; snapped: boolean } => {
      const state = readEditorState();
      if (!state.snapEnabled) return { timeUs, snapped: false };

      const threshold = (SNAP_RADIUS_PX / state.pxPerSec) * US;
      let best = timeUs;
      let bestDelta = threshold;
      let snapped = false;
      const consider = (candidate: number) => {
        const delta = Math.abs(candidate - timeUs);
        if (delta < bestDelta) {
          bestDelta = delta;
          best = candidate;
          snapped = true;
        }
      };

      consider(0);
      consider(state.playheadUs);
      if (state.inPointUs !== null) consider(state.inPointUs);
      if (state.outPointUs !== null) consider(state.outPointUs);
      for (const clip of state.clips) {
        if (excludeIds.has(clip.id)) continue;
        consider(clip.startUs);
        consider(clipEndUs(clip));
      }
      return { timeUs: best, snapped };
    },
    [],
  );

  const showSnapGuide = useCallback((timeUs: number | null) => {
    const element = snapGuideRef.current;
    if (!element) return;
    if (timeUs === null) {
      element.style.opacity = "0";
      return;
    }
    element.style.opacity = "1";
    element.style.transform = `translateX(${HEADER_WIDTH + (timeUs / US) * readEditorState().pxPerSec}px)`;
  }, []);

  const handleDragMove = useCallback(
    (event: PointerEvent | React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const state = readEditorState();

      if (drag.kind === "scrub") {
        seekTo(timeAt(event.clientX));
        return;
      }

      if (drag.kind === "marquee") {
        const element = scrollRef.current;
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const currentX = event.clientX - rect.left + element.scrollLeft;
        const currentY = event.clientY - rect.top + element.scrollTop;
        const left = Math.min(drag.originX, currentX);
        const top = Math.min(drag.originY, currentY);
        const width = Math.abs(currentX - drag.originX);
        const height = Math.abs(currentY - drag.originY);
        setMarquee({ left, top, width, height });

        // Select every clip whose box intersects the rubber band.
        const startUs = ((left - HEADER_WIDTH) / state.pxPerSec) * US;
        const endUs = ((left + width - HEADER_WIDTH) / state.pxPerSec) * US;
        const hits = state.clips.filter((clip) => {
          const index = state.tracks.findIndex((track) => track.id === clip.trackId);
          if (index < 0) return false;
          const rowTop = (rowOffsets[index] ?? 0) + HEAD_HEIGHT;
          const rowBottom = rowTop + state.tracks[index].height;
          if (rowBottom < top || rowTop > top + height) return false;
          return clip.startUs < endUs && clipEndUs(clip) > startUs;
        });
        setSelection(hits.map((clip) => clip.id));
        return;
      }

      const clip = state.clips.find((entry) => entry.id === drag.clipId);
      if (!clip) return;

      if (drag.kind === "trim") {
        const snap = snapTime(timeAt(event.clientX), new Set([clip.id]));
        state.setClipEdge(clip.id, drag.edge, snap.timeUs);
        showSnapGuide(snap.snapped ? snap.timeUs : null);
        return;
      }

      const proposedStart = Math.max(0, timeAt(event.clientX) - drag.grabOffsetUs);
      const moving = new Set(drag.originStarts.keys());
      const startSnap = snapTime(proposedStart, moving);
      const endSnap = snapTime(proposedStart + clip.durationUs, moving);
      // Whichever edge lands closer to a guide wins.
      const endAsStart = endSnap.timeUs - clip.durationUs;
      const useStart =
        Math.abs(startSnap.timeUs - proposedStart) <= Math.abs(endAsStart - proposedStart);
      const leadStart = useStart ? startSnap.timeUs : endAsStart;
      const caught = useStart ? startSnap : endSnap;
      showSnapGuide(caught.snapped ? caught.timeUs : null);

      const leadOrigin = drag.originStarts.get(clip.id);
      if (!leadOrigin) return;
      const deltaUs = leadStart - leadOrigin.startUs;

      const targetIndex = trackIndexAt(event.clientY);
      const trackDelta = targetIndex - drag.originTrackIndex;

      const moves: { clipId: string; startUs: number; trackId: string }[] = [];
      for (const [clipId, origin] of drag.originStarts) {
        const source = state.clips.find((entry) => entry.id === clipId);
        if (!source) continue;
        const wanted = source.kind === "audio" ? "audio" : "video";
        const desiredIndex = clamp(origin.trackIndex + trackDelta, 0, state.tracks.length - 1);
        const desired = state.tracks[desiredIndex];
        const target =
          desired && desired.kind === wanted && !desired.locked
            ? desired
            : state.tracks.find((track) => track.id === source.trackId);
        if (!target) return;
        moves.push({ clipId, startUs: Math.max(0, origin.startUs + deltaUs), trackId: target.id });
      }

      state.moveClips(moves);
    },
    [rowOffsets, setSelection, showSnapGuide, snapTime, timeAt, trackIndexAt],
  );

  const beginDrag = useCallback(
    (drag: DragState, event: React.PointerEvent) => {
      event.preventDefault();
      dragRef.current = drag;
      if (drag.kind !== "scrub" && drag.kind !== "marquee") readEditorState().beginInteraction();

      const onMove = (moveEvent: PointerEvent) => handleDragMove(moveEvent);
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        dragRef.current = null;
        setMarquee(null);
        showSnapGuide(null);
        readEditorState().endInteraction();
        player.refresh();
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      handleDragMove(event);
    },
    [handleDragMove, showSnapGuide],
  );

  /** Stable, so the memoised ruler isn't re-rendered by a fresh closure. */
  const beginRulerScrub = useCallback(
    (event: React.PointerEvent) => beginDrag({ kind: "scrub" }, event),
    [beginDrag],
  );

  /** Captures where every selected clip started, so a group drag stays rigid. */
  const startMoveDrag = useCallback(
    (clip: Clip, event: React.PointerEvent) => {
      const state = readEditorState();
      const ids = state.selectedClipIds.includes(clip.id) ? state.selectedClipIds : [clip.id];
      const originStarts = new Map<string, { startUs: number; trackIndex: number }>();
      for (const id of ids) {
        const entry = state.clips.find((item) => item.id === id);
        if (!entry) continue;
        originStarts.set(id, {
          startUs: entry.startUs,
          trackIndex: state.tracks.findIndex((track) => track.id === entry.trackId),
        });
      }
      const originTrackIndex = state.tracks.findIndex((track) => track.id === clip.trackId);
      beginDrag(
        {
          kind: "move",
          clipId: clip.id,
          grabOffsetUs: timeAt(event.clientX) - clip.startUs,
          originStarts,
          originTrackIndex,
        },
        event,
      );
    },
    [beginDrag, timeAt],
  );

  const openClipMenu = useCallback(
    (clip: Clip, event: React.MouseEvent) => {
      event.preventDefault();
      if (!readEditorState().selectedClipIds.includes(clip.id)) selectClip(clip.id);
      const state = readEditorState();

      setMenu({
        x: event.clientX,
        y: event.clientY,
        items: [
          {
            label: "Split at playhead",
            icon: <Split className="h-3.5 w-3.5" />,
            disabled: !canSplitAt(state.clips, state.selectedClipIds, state.playheadUs),
            onSelect: () => splitAt(readEditorState().playheadUs),
          },
          {
            label: "Duplicate",
            icon: <Copy className="h-3.5 w-3.5" />,
            onSelect: duplicateSelection,
          },
          { label: "Copy", onSelect: copySelection },
          {
            label: clip.locked ? "Unlock clip" : "Lock clip",
            icon: <Lock className="h-3.5 w-3.5" />,
            separatorBefore: true,
            onSelect: () => updateClip(clip.id, { locked: !clip.locked }),
          },
          {
            label: "Group selection",
            icon: <Group className="h-3.5 w-3.5" />,
            disabled: state.selectedClipIds.length < 2,
            onSelect: groupSelection,
          },
          {
            label: "Ungroup",
            icon: <Ungroup className="h-3.5 w-3.5" />,
            disabled: !clip.groupId,
            onSelect: ungroupSelection,
          },
          {
            label: "Detach audio",
            icon: <Link2 className="h-3.5 w-3.5" />,
            disabled: clip.kind !== "video",
            onSelect: () => detachAudio(clip.id),
          },
          {
            label: "Delete",
            icon: <Trash2 className="h-3.5 w-3.5" />,
            danger: true,
            separatorBefore: true,
            onSelect: () => deleteSelection(),
          },
          { label: "Ripple delete", danger: true, onSelect: () => deleteSelection(true) },
        ],
      });
    },
    [
      copySelection,
      deleteSelection,
      detachAudio,
      duplicateSelection,
      groupSelection,
      selectClip,
      splitAt,
      ungroupSelection,
      updateClip,
    ],
  );

  /* Stable per-row handlers, so `memo` on ClipView and TrackRow actually holds. */
  const handleSelectClip = useCallback(
    (clip: Clip, additive: boolean) => selectClip(clip.id, additive),
    [selectClip],
  );
  const handleTrimStart = useCallback(
    (clip: Clip, event: React.PointerEvent, edge: TrimEdge) =>
      beginDrag({ kind: "trim", clipId: clip.id, edge }, event),
    [beginDrag],
  );
  const handleDropAsset = useCallback(
    (assetId: string, trackId: string, clientX: number) =>
      addClipFromAsset(assetId, timeAt(clientX), trackId),
    [addClipFromAsset, timeAt],
  );
  const handleLaneClick = useCallback(() => selectClip(null), [selectClip]);

  const zoomToFit = useCallback(() => {
    const element = scrollRef.current;
    const state = readEditorState();
    const total = timelineDurationUs(state.clips);
    if (!element || total <= 0) return;
    state.setZoom(((element.clientWidth - HEADER_WIDTH - 48) / total) * US);
  }, []);

  // Track the horizontal viewport so off-screen clips can be skipped.
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const update = () =>
      setViewport((previous) =>
        previous.left === element.scrollLeft && previous.width === element.clientWidth
          ? previous
          : { left: element.scrollLeft, width: element.clientWidth },
      );
    update();
    element.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      element.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  // Ctrl/⌘ + wheel zooms around the pointer, the convention in every NLE.
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const state = readEditorState();
      const rect = element.getBoundingClientRect();
      const pointerX = event.clientX - rect.left + element.scrollLeft - HEADER_WIDTH;
      const timeAtPointer = pointerX / state.pxPerSec;
      const next = clamp(state.pxPerSec * (event.deltaY < 0 ? 1.12 : 1 / 1.12), 2, 800);
      state.setZoom(next);
      // Keep the instant under the cursor pinned while the scale changes.
      requestAnimationFrame(() => {
        element.scrollLeft = Math.max(
          0,
          timeAtPointer * next - (event.clientX - rect.left - HEADER_WIDTH),
        );
      });
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, []);

  // Only the timeline knows the viewport the project has to fit into.
  useCommand("zoomFit", zoomToFit);

  const rangeStartPx = Math.max(
    0,
    Math.floor(Math.max(0, viewport.left - HEADER_WIDTH - VIRTUALISE_OVERSCAN_PX) / QUANTISE_PX) *
      QUANTISE_PX,
  );
  const rangeEndPx =
    Math.ceil(
      (viewport.left + viewport.width - HEADER_WIDTH + VIRTUALISE_OVERSCAN_PX) / QUANTISE_PX,
    ) * QUANTISE_PX;
  const visibleRange = useMemo(
    () => ({ startUs: (rangeStartPx / pxPerSec) * US, endUs: (rangeEndPx / pxPerSec) * US }),
    [rangeStartPx, rangeEndPx, pxPerSec],
  );

  const videoTrackCount = tracks.filter((track) => track.kind === "video").length;
  const audioTrackCount = tracks.filter((track) => track.kind === "audio").length;

  const selectedIds = useMemo(() => new Set(selectedClipIds), [selectedClipIds]);

  const handleUpdateTrack = useCallback(
    (trackId: string, patch: Partial<Track>) => updateTrack(trackId, patch),
    [updateTrack],
  );
  const handleRemoveTrack = useCallback((trackId: string) => removeTrack(trackId), [removeTrack]);

  const frameState = useMemo(() => {
    const fits = new Set<MediaFit>();
    let fittable = 0;
    let flippable = 0;
    let flippedH = 0;
    let flippedV = 0;

    for (const clip of clips) {
      if (!selectedIds.has(clip.id) || clip.kind === "audio") continue;
      flippable++;
      if (clip.transform.flipH) flippedH++;
      if (clip.transform.flipV) flippedV++;
      if (isMediaClip(clip)) {
        fittable++;
        fits.add(clip.fit);
      }
    }

    return {
      fit: fits.size === 1 ? [...fits][0] : null,
      canFit: fittable > 0,
      canFlip: flippable > 0,
      flipH: flippable > 0 && flippedH === flippable,
      flipV: flippable > 0 && flippedV === flippable,
    };
  }, [clips, selectedIds]);

  return (
    <section className="island isolate flex h-full min-h-0 flex-col">
      <TimelineToolbar
        snapEnabled={snapEnabled}
        rippleEnabled={rippleEnabled}
        toggleSnap={toggleSnap}
        toggleRipple={toggleRipple}
        hasSelection={selectedClipIds.length > 0}
        fit={frameState.fit}
        canFit={frameState.canFit}
        onFitChange={setSelectionFit}
        canFlip={frameState.canFlip}
        flipH={frameState.flipH}
        flipV={frameState.flipV}
        onFlip={toggleSelectionFlip}
        onSplit={() => splitAt(readEditorState().playheadUs)}
        onDuplicate={duplicateSelection}
        onDelete={() => deleteSelection()}
        onAddVideoTrack={() => addTrack("video")}
        onAddAudioTrack={() => addTrack("audio")}
        onZoomIn={() => setZoom(pxPerSec * 1.4)}
        onZoomOut={() => setZoom(pxPerSec / 1.4)}
        onZoomFit={zoomToFit}
      />

      <div
        ref={scrollRef}
        className="relative min-h-0 flex-1 overflow-auto"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          // Empty space: start a rubber-band selection.
          if (event.target !== event.currentTarget) return;
          const element = scrollRef.current;
          if (!element) return;
          const rect = element.getBoundingClientRect();
          selectClip(null);
          beginDrag(
            {
              kind: "marquee",
              originX: event.clientX - rect.left + element.scrollLeft,
              originY: event.clientY - rect.top + element.scrollTop,
            },
            event,
          );
        }}
      >
        <div className="relative [overflow-x:clip]" style={{ width: HEADER_WIDTH + contentWidth }}>
          <Playhead
            scrollRef={scrollRef}
            height={HEAD_HEIGHT + tracksHeight}
            viewportLeft={viewport.left}
            viewportWidth={viewport.width}
            onGrab={(event) => beginDrag({ kind: "scrub" }, event)}
          />

          <div className="sticky left-0 top-0 z-50 h-0" style={{ width: HEADER_WIDTH }}>
            <div
              aria-hidden="true"
              style={{ width: HEADER_WIDTH, height: HEAD_HEIGHT }}
              className="absolute left-0 top-0 border-b border-r border-border bg-editor-chrome"
            />
          </div>

          <div className="sticky top-0 z-30 flex">
            <div
              aria-hidden="true"
              style={{ width: HEADER_WIDTH, height: HEAD_HEIGHT }}
              className="shrink-0"
            />
            <TimeRuler
              width={contentWidth}
              pxPerSec={pxPerSec}
              viewportLeft={viewport.left}
              viewportWidth={viewport.width}
              onScrub={beginRulerScrub}
            />
          </div>

          {tracks.map((track, index) => (
            <TrackRow
              key={track.id}
              track={track}
              index={index}
              clips={clipsByTrack.get(track.id) ?? NO_CLIPS}
              pxPerSec={pxPerSec}
              contentWidth={contentWidth}
              selectedIds={selectedIds}
              previews={previews}
              visibleRange={visibleRange}
              canRemove={(track.kind === "video" ? videoTrackCount : audioTrackCount) > 1}
              onUpdateTrack={handleUpdateTrack}
              onRemoveTrack={handleRemoveTrack}
              onSelectClip={handleSelectClip}
              onClipPointerDown={startMoveDrag}
              onTrimStart={handleTrimStart}
              onClipContextMenu={openClipMenu}
              onDropAsset={handleDropAsset}
              onLaneClick={handleLaneClick}
            />
          ))}

          {clips.length === 0 && (
            <div
              className="pointer-events-none absolute z-10 flex items-center justify-center"
              style={{
                left: HEADER_WIDTH,
                top: HEAD_HEIGHT,
                width: Math.max(0, viewport.width - HEADER_WIDTH),
                height: tracksHeight,
              }}
            >
              <p className="rounded-lg border border-dashed border-separator px-4 py-3 text-xs text-muted">
                Drag media here from the panel on the left
              </p>
            </div>
          )}

          {marquee && (
            <div
              className="pointer-events-none absolute z-[25] rounded-sm border border-accent bg-accent/15"
              style={{
                left: marquee.left,
                top: marquee.top,
                width: marquee.width,
                height: marquee.height,
              }}
            />
          )}

          <div
            ref={snapGuideRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 z-[26] w-px bg-accent opacity-0"
            style={{ height: HEAD_HEIGHT + tracksHeight }}
          />
        </div>
      </div>

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />
      )}
    </section>
  );
};

interface ToolbarProps {
  snapEnabled: boolean;
  rippleEnabled: boolean;
  toggleSnap: () => void;
  toggleRipple: () => void;
  hasSelection: boolean;
  /** The selection's shared fit, or null when it has none or they differ. */
  fit: MediaFit | null;
  /** False when nothing in the selection draws a frame, so fit means nothing. */
  canFit: boolean;
  onFitChange: (fit: MediaFit) => void;
  /** Text can be flipped too, so this is a wider set than `canFit`. */
  canFlip: boolean;
  /** Lit only when every clip the button would act on is already flipped. */
  flipH: boolean;
  flipV: boolean;
  onFlip: (axis: "h" | "v") => void;
  onSplit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddVideoTrack: () => void;
  onAddAudioTrack: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
}

const SplitButton = ({ onSplit }: { onSplit: () => void }) => {
  const canSplit = useEditor((state) =>
    canSplitAt(state.clips, state.selectedClipIds, state.playheadUs),
  );
  return (
    <IconButton
      label={
        canSplit
          ? `Split at playhead (${MOD_LABEL}B)`
          : `Split at playhead (${MOD_LABEL}B) — nothing crosses it`
      }
      onClick={onSplit}
      disabled={!canSplit}
    >
      <Split className="h-4 w-4" />
    </IconButton>
  );
};

const TimelineToolbar = (props: ToolbarProps) => (
  <div className="flex shrink-0 items-center gap-1.5 border-b border-border bg-editor-panel px-2 py-1.5">
    <SegmentedControl
      value="select"
      onChange={() => undefined}
      className="w-10"
      options={[
        { value: "select", label: <MousePointer2 className="h-3.5 w-3.5" />, title: "Select" },
      ]}
    />

    <span className="mx-0.5 h-4 w-px bg-separator" />

    <SegmentedControl<MediaFit>
      value={props.fit}
      options={FIT_OPTIONS}
      onChange={props.onFitChange}
      disabled={!props.canFit}
      className="w-24"
    />

    <span className="mx-0.5 h-4 w-px bg-separator" />

    <IconButton
      label="Flip horizontally"
      onClick={() => props.onFlip("h")}
      active={props.flipH}
      disabled={!props.canFlip}
    >
      <FlipHorizontal className="h-4 w-4" />
    </IconButton>
    <IconButton
      label="Flip vertically"
      onClick={() => props.onFlip("v")}
      active={props.flipV}
      disabled={!props.canFlip}
    >
      <FlipVertical className="h-4 w-4" />
    </IconButton>

    <span className="mx-0.5 h-4 w-px bg-separator" />

    <SplitButton onSplit={props.onSplit} />
    <IconButton
      label={`Duplicate (${MOD_LABEL}D)`}
      onClick={props.onDuplicate}
      disabled={!props.hasSelection}
    >
      <Copy className="h-4 w-4" />
    </IconButton>
    <IconButton label="Delete (Del)" onClick={props.onDelete} disabled={!props.hasSelection} danger>
      <Trash2 className="h-4 w-4" />
    </IconButton>

    <span className="mx-0.5 h-4 w-px bg-separator" />

    <IconButton label="Add video track" onClick={props.onAddVideoTrack}>
      <span className="relative">
        <Film className="h-4 w-4" />
        <Plus className="absolute -right-1 -top-1 h-2.5 w-2.5" />
      </span>
    </IconButton>
    <IconButton label="Add audio track" onClick={props.onAddAudioTrack}>
      <span className="relative">
        <Music className="h-4 w-4" />
        <Plus className="absolute -right-1 -top-1 h-2.5 w-2.5" />
      </span>
    </IconButton>

    <IconButton
      label={props.snapEnabled ? "Snapping on (S)" : "Snapping off (S)"}
      onClick={props.toggleSnap}
      active={props.snapEnabled}
    >
      <Magnet className="h-4 w-4" />
    </IconButton>
    <IconButton
      label={
        props.rippleEnabled ? "Ripple edit on — deletes close gaps (R)" : "Ripple edit off (R)"
      }
      onClick={props.toggleRipple}
      active={props.rippleEnabled}
    >
      <Link2 className="h-4 w-4" />
    </IconButton>

    <div className="ml-auto flex items-center gap-1">
      <NButton
        isOutline
        onClick={props.onZoomFit}
        title="Zoom to fit (Shift Z)"
        className="h-7 px-2 text-[11px]"
      >
        Fit
      </NButton>
      <IconButton label="Zoom out (−)" onClick={props.onZoomOut}>
        <ZoomOut className="h-4 w-4" />
      </IconButton>
      <IconButton label="Zoom in (+)" onClick={props.onZoomIn}>
        <ZoomIn className="h-4 w-4" />
      </IconButton>
    </div>
  </div>
);

interface TrackRowProps {
  track: Track;
  index: number;
  clips: Clip[];
  pxPerSec: number;
  contentWidth: number;
  visibleRange: { startUs: number; endUs: number };
  canRemove: boolean;
  /** Indexed, so a row does not scan the selection once per clip it draws. */
  selectedIds: Set<string>;
  /** Per-asset poster frame and shape, for the clips' filmstrips. */
  previews: Map<string, ClipPreview>;
  onUpdateTrack: (trackId: string, patch: Partial<Track>) => void;
  onRemoveTrack: (trackId: string) => void;
  onSelectClip: (clip: Clip, additive: boolean) => void;
  onClipPointerDown: (clip: Clip, event: React.PointerEvent) => void;
  onTrimStart: (clip: Clip, event: React.PointerEvent, edge: TrimEdge) => void;
  onClipContextMenu: (clip: Clip, event: React.MouseEvent) => void;
  onDropAsset: (assetId: string, trackId: string, clientX: number) => void;
  onLaneClick: () => void;
}

const TrackRow = memo(
  ({
    track,
    index,
    clips,
    pxPerSec,
    contentWidth,
    selectedIds,
    previews,
    visibleRange,
    canRemove,
    onUpdateTrack,
    onRemoveTrack,
    onSelectClip,
    onClipPointerDown,
    onTrimStart,
    onClipContextMenu,
    onDropAsset,
    onLaneClick,
  }: TrackRowProps) => {
    const trackClips = clips.filter(
      (clip) => clip.startUs < visibleRange.endUs && clipEndUs(clip) > visibleRange.startUs,
    );

    return (
      <div className="flex">
        <TrackHeader
          track={track}
          canRemove={canRemove}
          onUpdate={(patch) => onUpdateTrack(track.id, patch)}
          onRemove={() => onRemoveTrack(track.id)}
        />
        <div
          style={{ width: contentWidth, height: track.height }}
          className={cn(
            "relative border-b border-border",
            index % 2 === 0 ? "bg-editor-track" : "bg-editor-track-alt",
            track.locked && "opacity-60",
            track.hidden && "opacity-40",
          )}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) onLaneClick();
          }}
          onDragOver={(event) => {
            if (!event.dataTransfer.types.includes(ASSET_MIME)) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(event) => {
            const assetId = event.dataTransfer.getData(ASSET_MIME);
            if (!assetId) return;
            event.preventDefault();
            onDropAsset(assetId, track.id, event.clientX);
          }}
        >
          {trackClips.map((clip) => (
            <ClipView
              key={clip.id}
              clip={clip}
              pxPerSec={pxPerSec}
              rowHeight={track.height}
              selected={selectedIds.has(clip.id)}
              trackLocked={track.locked}
              preview={(isMediaClip(clip) ? previews.get(clip.assetId) : null) ?? null}
              onSelect={onSelectClip}
              onMoveStart={onClipPointerDown}
              onTrimStart={onTrimStart}
              onContextMenu={onClipContextMenu}
            />
          ))}
        </div>
      </div>
    );
  },
);

TrackRow.displayName = "TrackRow";

const Playhead = ({
  scrollRef,
  height,
  viewportLeft,
  viewportWidth,
  onGrab,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  height: number;
  viewportLeft: number;
  viewportWidth: number;
  /** Starts a scrub, so the head can be dragged as well as the ruler clicked. */
  onGrab: (event: React.PointerEvent) => void;
}) => {
  const playheadUs = useEditor((state) => state.playheadUs);
  const pxPerSec = useEditor((state) => state.pxPerSec);
  const isPlaying = useEditor((state) => state.isPlaying);
  const [hovered, setHovered] = useState(false);
  const left = HEADER_WIDTH + (playheadUs / US) * pxPerSec;
  const showHandle = left >= viewportLeft + HEADER_WIDTH;
  const emphasised = hovered && showHandle;

  useEffect(() => {
    if (!isPlaying) return;
    const element = scrollRef.current;
    if (!element) return;
    const visibleLeft = viewportLeft + HEADER_WIDTH;
    const visibleRight = viewportLeft + viewportWidth;
    if (left < visibleLeft || left > visibleRight - 80) {
      element.scrollLeft = Math.max(0, left - HEADER_WIDTH - viewportWidth / 3);
    }
  }, [left, isPlaying, scrollRef, viewportLeft, viewportWidth]);

  const moving: React.CSSProperties = {
    transform: `translateX(${left}px)`,
    willChange: "transform",
  };

  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-0 z-[35] bg-playhead transition-[width]",
          emphasised ? "w-0.5" : "w-px",
        )}
        style={{ height, ...moving }}
      />

      {showHandle && (
        <div className="pointer-events-none sticky top-0 z-[55] h-0">
          <button
            type="button"
            aria-label="Drag to move the playhead"
            onPointerDown={onGrab}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            style={moving}
            className="pointer-events-auto absolute -left-[11px] -top-1 flex h-6 w-6 cursor-grab touch-none items-start justify-center active:cursor-grabbing"
          >
            <span
              className={cn(
                "mt-1 h-3 w-2.5 rounded-b-sm bg-playhead transition-transform",
                emphasised && "scale-125",
              )}
            />
          </button>
        </div>
      )}
    </>
  );
};
