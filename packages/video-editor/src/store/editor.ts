import { create } from 'zustand';
import { makeMediaClip, makeTextClip, makeTrack } from '../lib/factories';
import { removeKeyAt, scaleAnimations, shiftAnimations, splitAnimations, upsertKey } from '../lib/keyframes';
import { clamp, uid } from '../lib/utils';
import { releaseAllReaders, releaseAsset, releaseReader } from '../media/library';
import { DEFAULT_BACKGROUND, DEFAULT_CHROMA, DEFAULT_COLOR, DEFAULT_CROP, DEFAULT_TRANSFORM, US, clipEndUs, isMediaClip } from '../types';
import type { Clip, Marker, MediaAsset, ProjectSettings, TextClip, Track, TrackKind, TransitionKind } from '../types';

/** Nothing shorter than this can be created by trimming or splitting. */
export const MIN_CLIP_US = 100_000;

/** Select for everything, razor for cutting. */
export type ToolMode = 'select' | 'razor';

const DEFAULT_PROJECT: ProjectSettings = {
  name: 'Untitled project',
  width: 1920,
  height: 1080,
  fps: 30,
  background: { ...DEFAULT_BACKGROUND }
};

/** The undoable slice of state. Playhead, zoom and tool are deliberately excluded. */
interface Snapshot {
  project: ProjectSettings;
  tracks: Track[];
  clips: Clip[];
  markers: Marker[];
}

interface EditorState extends Snapshot {
  assets: MediaAsset[];
  selectedClipIds: string[];
  playheadUs: number;
  isPlaying: boolean;
  pxPerSec: number;
  snapEnabled: boolean;
  rippleEnabled: boolean;
  tool: ToolMode;
  /** Export/preview range, set with I and O. */
  inPointUs: number | null;
  outPointUs: number | null;
  clipboard: Clip[];
  past: Snapshot[];
  future: Snapshot[];
  interacting: boolean;

  beginInteraction: () => void;
  endInteraction: () => void;

  addAsset: (asset: MediaAsset) => void;
  updateAsset: (assetId: string, patch: Partial<MediaAsset>) => void;
  removeAsset: (assetId: string) => void;

  addClipFromAsset: (assetId: string, atUs?: number, preferredTrackId?: string) => string | null;
  addTextClip: (preset?: Partial<TextClip>, atUs?: number) => string | null;

  updateClip: (clipId: string, patch: Partial<Clip>) => void;
  updateSelectedClips: (patch: Partial<Clip>) => void;
  moveClips: (moves: { clipId: string; startUs: number; trackId: string }[]) => void;
  setClipEdge: (clipId: string, edge: 'start' | 'end', timeUs: number) => void;
  splitAt: (timeUs: number, clipId?: string) => void;
  duplicateSelection: () => void;
  deleteSelection: (ripple?: boolean) => void;
  copySelection: () => void;
  cutSelection: () => void;
  paste: (atUs?: number) => void;
  groupSelection: () => void;
  ungroupSelection: () => void;
  detachAudio: (clipId: string) => void;

  selectClip: (clipId: string | null, additive?: boolean) => void;
  setSelection: (clipIds: string[]) => void;
  selectAll: () => void;

  setTransition: (clipId: string, kind: TransitionKind | null, durationUs?: number) => void;

  toggleKeyframe: (clipId: string, path: string, value: number) => void;
  removeKeyframe: (clipId: string, path: string, localUs: number) => void;
  clearKeyframes: (clipId: string, path: string) => void;

  addTrack: (kind: TrackKind) => void;
  updateTrack: (trackId: string, patch: Partial<Track>) => void;
  removeTrack: (trackId: string) => void;
  reorderTrack: (trackId: string, direction: -1 | 1) => void;

  addMarker: (atUs?: number) => void;
  updateMarker: (markerId: string, patch: Partial<Marker>) => void;
  removeMarker: (markerId: string) => void;

  updateProject: (patch: Partial<ProjectSettings>) => void;
  setPlayhead: (timeUs: number) => void;
  setPlaying: (playing: boolean) => void;
  setZoom: (pxPerSec: number) => void;
  toggleSnap: () => void;
  toggleRipple: () => void;
  setTool: (tool: ToolMode) => void;
  setInPoint: (timeUs: number | null) => void;
  setOutPoint: (timeUs: number | null) => void;

  loadProject: (data: ProjectFile) => void;
  resetProject: () => void;

  undo: () => void;
  redo: () => void;
}

const INITIAL_TRACKS = [makeTrack('video', 1), makeTrack('audio', 1)];

/** Timeline length, i.e. the end of the last clip. */
export const timelineDurationUs = (clips: Clip[]) => clips.reduce((end, clip) => Math.max(end, clipEndUs(clip)), 0);

/** Source material still available after the clip's in-point, in timeline time. */
const availableSourceUs = (clip: Clip, assets: MediaAsset[]) => {
  if (!isMediaClip(clip) || clip.kind === 'image') return Number.POSITIVE_INFINITY;
  const asset = assets.find(entry => entry.id === clip.assetId);
  if (!asset) return Number.POSITIVE_INFINITY;
  return Math.max(0, (asset.durationUs - clip.inUs) / clip.speed);
};

const overlaps = (clip: Clip, startUs: number, endUs: number) => clip.startUs < endUs && clipEndUs(clip) > startUs;

/**
 * Track order is also layer order: `tracks[0]` is the topmost row and the last
 * thing the compositor draws. Prefers the lowest free layer so a new import
 * lands on the main track rather than floating above what's there.
 */
const findFreeTrack = (tracks: Track[], clips: Clip[], kind: TrackKind, startUs: number, durationUs: number): Track | null => {
  const endUs = startUs + durationUs;
  const candidates = tracks.filter(track => track.kind === kind && !track.locked).reverse();
  for (const track of candidates) {
    const busy = clips.some(clip => clip.trackId === track.id && overlaps(clip, startUs, endUs));
    if (!busy) return track;
  }
  return null;
};

/** New video tracks stack on top; new audio tracks go to the bottom. */
const insertTrack = (tracks: Track[], track: Track): Track[] => (track.kind === 'video' ? [track, ...tracks] : [...tracks, track]);

const snapshotOf = (state: Snapshot): Snapshot => ({
  project: state.project,
  tracks: state.tracks,
  clips: state.clips,
  markers: state.markers
});

const MAX_HISTORY = 80;

export interface ProjectFile {
  version: 1;
  project: ProjectSettings;
  tracks: Track[];
  clips: Clip[];
  markers: Marker[];
  /** Assets are referenced by name/size — the files themselves can't be serialised. */
  assetRefs: { id: string; name: string; size: number; kind: string }[];
}

/*
 * Project files are plain JSON written by an earlier build, so nothing
 * guarantees they carry the fields the current model expects. A missing one is
 * not a cosmetic problem: `project.background` undefined throws on every
 * frame, and a `colorAdjust` short of a dial feeds `undefined` to a shader
 * uniform, which renders as garbage rather than as an error.
 *
 * So the file is filled out against current defaults on the way in. The
 * version number is deliberately not bumped for this — every older file stays
 * readable, which is the whole point.
 */

/** An older file's project settings, before the background became a record. */
type LegacyProject = ProjectSettings & { backgroundColor?: string };

const normaliseProject = (project: ProjectSettings): ProjectSettings => {
  const legacy = project as LegacyProject;
  return {
    ...project,
    background: project.background
      ? { ...DEFAULT_BACKGROUND, ...project.background }
      : // Pre-background files carried a single colour; keep it as the solid fill.
        { ...DEFAULT_BACKGROUND, color: legacy.backgroundColor ?? DEFAULT_BACKGROUND.color }
  };
};

const normaliseClip = (clip: Clip): Clip => {
  const base = {
    ...clip,
    transform: { ...DEFAULT_TRANSFORM, ...clip.transform },
    crop: { ...DEFAULT_CROP, ...clip.crop },
    colorAdjust: { ...DEFAULT_COLOR, ...clip.colorAdjust },
    animations: clip.animations ?? {},
    filter: clip.filter ?? null
  };
  return isMediaClip(base) ? { ...base, chromaKey: { ...DEFAULT_CHROMA, ...base.chromaKey } } : base;
};

export const useEditor = create<EditorState>((set, get) => {
  /**
   * Wraps a mutation so it becomes one undo step. During a drag the snapshot is
   * taken once by `beginInteraction`, so the hundreds of intermediate updates a
   * pointer move produces collapse into a single entry.
   */
  const commit = (mutate: (state: EditorState) => Partial<EditorState> | null) =>
    set(state => {
      const patch = mutate(state);
      if (!patch) return {};
      if (state.interacting) return patch;
      return { ...patch, past: [...state.past, snapshotOf(state)].slice(-MAX_HISTORY), future: [] };
    });

  /** Resolves a clip plus everything grouped with it. */
  const expandGroups = (clips: Clip[], ids: string[]): string[] => {
    const groups = new Set(clips.filter(clip => ids.includes(clip.id) && clip.groupId).map(clip => clip.groupId));
    if (groups.size === 0) return ids;
    const expanded = new Set(ids);
    for (const clip of clips) {
      if (clip.groupId && groups.has(clip.groupId)) expanded.add(clip.id);
    }
    return [...expanded];
  };

  /** Places a freshly created clip, adding a track if every candidate is busy. */
  const placeClip = (state: EditorState, kind: TrackKind, startUs: number, durationUs: number, preferredTrackId?: string) => {
    let tracks = state.tracks;
    const preferred = tracks.find(entry => entry.id === preferredTrackId);
    const preferredUsable =
      preferred &&
      preferred.kind === kind &&
      !preferred.locked &&
      !state.clips.some(clip => clip.trackId === preferred.id && overlaps(clip, startUs, startUs + durationUs));

    let track = preferredUsable ? preferred : findFreeTrack(tracks, state.clips, kind, startUs, durationUs);
    if (!track) {
      const count = tracks.filter(entry => entry.kind === kind).length + 1;
      track = makeTrack(kind, count);
      tracks = insertTrack(tracks, track);
    }
    return { tracks, track };
  };

  return {
    project: DEFAULT_PROJECT,
    tracks: INITIAL_TRACKS,
    clips: [],
    markers: [],
    assets: [],
    selectedClipIds: [],
    playheadUs: 0,
    isPlaying: false,
    pxPerSec: 60,
    snapEnabled: true,
    rippleEnabled: false,
    tool: 'select',
    inPointUs: null,
    outPointUs: null,
    clipboard: [],
    past: [],
    future: [],
    interacting: false,

    beginInteraction: () =>
      set(state => (state.interacting ? {} : { past: [...state.past, snapshotOf(state)].slice(-MAX_HISTORY), future: [], interacting: true })),
    endInteraction: () => set({ interacting: false }),

    /* ---------------- assets ---------------- */

    addAsset: asset => set(state => ({ assets: [...state.assets, asset] })),

    updateAsset: (assetId, patch) => set(state => ({ assets: state.assets.map(asset => (asset.id === assetId ? { ...asset, ...patch } : asset)) })),

    removeAsset: assetId => {
      const affected = get().clips.filter(clip => isMediaClip(clip) && clip.assetId === assetId);
      commit(state => ({
        assets: state.assets.filter(asset => asset.id !== assetId),
        clips: state.clips.filter(clip => !(isMediaClip(clip) && clip.assetId === assetId)),
        selectedClipIds: state.selectedClipIds.filter(id => !affected.some(clip => clip.id === id))
      }));
      void Promise.all(affected.map(clip => releaseReader(clip.id))).then(() => releaseAsset(assetId));
    },

    /* ---------------- creating clips ---------------- */

    addClipFromAsset: (assetId, atUs, preferredTrackId) => {
      const state = get();
      const asset = state.assets.find(entry => entry.id === assetId);
      if (!asset) return null;

      const kind: TrackKind = asset.kind === 'audio' ? 'audio' : 'video';
      const startUs = Math.max(0, Math.round(atUs ?? state.playheadUs));
      const durationUs = Math.max(MIN_CLIP_US, asset.durationUs || 5 * US);
      const { tracks, track } = placeClip(state, kind, startUs, durationUs, preferredTrackId);
      const clip = makeMediaClip(asset, track.id, startUs, durationUs);

      commit(current => ({ tracks, clips: [...current.clips, clip], selectedClipIds: [clip.id] }));
      return clip.id;
    },

    addTextClip: (preset, atUs) => {
      const state = get();
      const startUs = Math.max(0, Math.round(atUs ?? state.playheadUs));
      const { tracks, track } = placeClip(state, 'video', startUs, 3 * US);
      const clip = makeTextClip(track.id, startUs, preset);
      commit(current => ({ tracks, clips: [...current.clips, clip], selectedClipIds: [clip.id] }));
      return clip.id;
    },

    /* ---------------- editing ---------------- */

    updateClip: (clipId, patch) =>
      commit(state => ({ clips: state.clips.map(clip => (clip.id === clipId ? ({ ...clip, ...patch } as Clip) : clip)) })),

    updateSelectedClips: patch =>
      commit(state => ({
        clips: state.clips.map(clip => (state.selectedClipIds.includes(clip.id) ? ({ ...clip, ...patch } as Clip) : clip))
      })),

    /**
     * Moves a set of clips at once. Taking the whole set in one call keeps a
     * multi-clip drag rigid — moving them one by one would let each clamp
     * independently and shear the selection apart.
     */
    moveClips: moves =>
      commit(state => {
        const trackById = new Map(state.tracks.map(track => [track.id, track]));
        const resolved: { clipId: string; startUs: number; trackId: string }[] = [];

        for (const move of moves) {
          const clip = state.clips.find(entry => entry.id === move.clipId);
          if (!clip || clip.locked) return null;
          const target = trackById.get(move.trackId);
          if (!target || target.locked) return null;
          const wanted: TrackKind = clip.kind === 'audio' ? 'audio' : 'video';
          // Reject the whole gesture rather than dropping one clip out of it.
          if (target.kind !== wanted) return null;
          resolved.push({ ...move, startUs: Math.max(0, Math.round(move.startUs)) });
        }

        const byId = new Map(resolved.map(move => [move.clipId, move]));
        return {
          clips: state.clips.map(clip => {
            const move = byId.get(clip.id);
            return move ? { ...clip, startUs: move.startUs, trackId: move.trackId } : clip;
          })
        };
      }),

    setClipEdge: (clipId, edge, timeUs) =>
      commit(state => {
        const clip = state.clips.find(entry => entry.id === clipId);
        if (!clip || clip.locked) return null;
        const endUs = clipEndUs(clip);

        if (edge === 'start') {
          // Dragging the left edge also moves the in-point, so the visible
          // frames stay put instead of sliding.
          const headroomUs = isMediaClip(clip) && clip.kind !== 'image' ? clip.inUs / clip.speed : Number.POSITIVE_INFINITY;
          const lowerBound = Math.max(0, clip.startUs - headroomUs);
          const newStart = clamp(Math.round(timeUs), lowerBound, endUs - MIN_CLIP_US);
          const deltaUs = newStart - clip.startUs;
          const newDuration = endUs - newStart;

          const updated: Clip = {
            ...clip,
            startUs: newStart,
            durationUs: newDuration,
            animations: shiftAnimations(clip.animations, deltaUs, newDuration),
            ...(isMediaClip(clip) && clip.kind !== 'image' ? { inUs: Math.max(0, clip.inUs + deltaUs * clip.speed) } : {})
          } as Clip;

          return { clips: state.clips.map(entry => (entry.id === clipId ? updated : entry)) };
        }

        const maxDurationUs = availableSourceUs(clip, state.assets);
        const newEnd = clamp(Math.round(timeUs), clip.startUs + MIN_CLIP_US, clip.startUs + maxDurationUs);
        const newDuration = newEnd - clip.startUs;
        const updated: Clip = {
          ...clip,
          durationUs: newDuration,
          animations: scaleAnimations(clip.animations, newDuration / Math.max(1, clip.durationUs))
        };
        return { clips: state.clips.map(entry => (entry.id === clipId ? updated : entry)) };
      }),

    splitAt: (timeUs, clipId) =>
      commit(state => {
        const at = Math.round(timeUs);
        const targets = state.clips.filter(clip => {
          if (clip.locked) return false;
          if (clipId) return clip.id === clipId;
          // No explicit target: cut everything the playhead crosses on
          // selected clips, or on every track when nothing is selected.
          if (state.selectedClipIds.length > 0 && !state.selectedClipIds.includes(clip.id)) return false;
          return true;
        });

        const cuttable = targets.filter(
          clip => clip.startUs < at && clipEndUs(clip) > at && at - clip.startUs >= MIN_CLIP_US && clipEndUs(clip) - at >= MIN_CLIP_US
        );
        if (cuttable.length === 0) return null;

        const removed = new Set(cuttable.map(clip => clip.id));
        const created: Clip[] = [];

        for (const clip of cuttable) {
          const leftDuration = at - clip.startUs;
          const rightDuration = clipEndUs(clip) - at;
          const { left: leftAnimations, right: rightAnimations } = splitAnimations(clip.animations, leftDuration);

          created.push({
            ...clip,
            durationUs: leftDuration,
            fadeOutUs: Math.min(clip.fadeOutUs, leftDuration),
            animations: leftAnimations
          } as Clip);

          created.push({
            ...clip,
            id: uid('clip'),
            startUs: at,
            durationUs: rightDuration,
            fadeInUs: Math.min(clip.fadeInUs, rightDuration),
            animations: rightAnimations,
            // The right half starts at a cut, not at the original head.
            transitionIn: null,
            ...(isMediaClip(clip) ? { inUs: clip.inUs + leftDuration * clip.speed } : {})
          } as Clip);
        }

        return {
          clips: [...state.clips.filter(clip => !removed.has(clip.id)), ...created],
          selectedClipIds: created.filter(clip => clip.startUs === at).map(clip => clip.id)
        };
      }),

    duplicateSelection: () =>
      commit(state => {
        const ids = expandGroups(state.clips, state.selectedClipIds);
        const originals = state.clips.filter(clip => ids.includes(clip.id));
        if (originals.length === 0) return null;

        // Offset the whole set by its own span so copies sit after the originals.
        const spanStart = Math.min(...originals.map(clip => clip.startUs));
        const spanEnd = Math.max(...originals.map(clipEndUs));
        const offset = spanEnd - spanStart;
        const groupRemap = new Map<string, string>();

        const copies = originals.map(clip => {
          let groupId = clip.groupId;
          if (groupId) {
            if (!groupRemap.has(groupId)) groupRemap.set(groupId, uid('group'));
            groupId = groupRemap.get(groupId)!;
          }
          return { ...clip, id: uid('clip'), startUs: clip.startUs + offset, groupId } as Clip;
        });

        return { clips: [...state.clips, ...copies], selectedClipIds: copies.map(clip => clip.id) };
      }),

    deleteSelection: ripple =>
      set(state => {
        const ids = expandGroups(state.clips, state.selectedClipIds);
        const doomed = state.clips.filter(clip => ids.includes(clip.id) && !clip.locked);
        if (doomed.length === 0) return {};

        const doomedIds = new Set(doomed.map(clip => clip.id));
        let clips = state.clips.filter(clip => !doomedIds.has(clip.id));

        if (ripple ?? state.rippleEnabled) {
          // Close the gap on each affected track by pulling later clips back.
          for (const gone of doomed) {
            clips = clips.map(clip =>
              clip.trackId === gone.trackId && clip.startUs >= clipEndUs(gone)
                ? { ...clip, startUs: Math.max(0, clip.startUs - gone.durationUs) }
                : clip
            );
          }
        }

        void Promise.all(doomed.map(clip => releaseReader(clip.id)));
        return {
          clips,
          selectedClipIds: [],
          past: [...state.past, snapshotOf(state)].slice(-MAX_HISTORY),
          future: []
        };
      }),

    copySelection: () =>
      set(state => {
        const ids = expandGroups(state.clips, state.selectedClipIds);
        const copied = state.clips.filter(clip => ids.includes(clip.id));
        return copied.length > 0 ? { clipboard: copied.map(clip => ({ ...clip })) } : {};
      }),

    cutSelection: () => {
      get().copySelection();
      get().deleteSelection();
    },

    paste: atUs => {
      const state = get();
      if (state.clipboard.length === 0) return;
      const target = Math.max(0, Math.round(atUs ?? state.playheadUs));
      // Preserve the relative layout of a multi-clip copy.
      const anchor = Math.min(...state.clipboard.map(clip => clip.startUs));
      const groupRemap = new Map<string, string>();

      const pasted = state.clipboard.map(clip => {
        let groupId = clip.groupId;
        if (groupId) {
          if (!groupRemap.has(groupId)) groupRemap.set(groupId, uid('group'));
          groupId = groupRemap.get(groupId)!;
        }
        const startUs = target + (clip.startUs - anchor);
        // Fall back to a valid track if the original is gone.
        const trackExists = state.tracks.some(track => track.id === clip.trackId);
        const trackId = trackExists
          ? clip.trackId
          : (state.tracks.find(track => track.kind === (clip.kind === 'audio' ? 'audio' : 'video'))?.id ?? clip.trackId);
        return { ...clip, id: uid('clip'), startUs, trackId, groupId } as Clip;
      });

      commit(current => ({ clips: [...current.clips, ...pasted], selectedClipIds: pasted.map(clip => clip.id) }));
    },

    /**
     * Splits a video clip's sound onto its own audio clip, muting the original.
     * The two are grouped so they stay in sync unless deliberately ungrouped.
     */
    detachAudio: clipId =>
      commit(state => {
        const clip = state.clips.find(entry => entry.id === clipId);
        if (!clip || clip.kind !== 'video' || !isMediaClip(clip)) return null;

        let tracks = state.tracks;
        let track = findFreeTrack(tracks, state.clips, 'audio', clip.startUs, clip.durationUs);
        if (!track) {
          track = makeTrack('audio', tracks.filter(entry => entry.kind === 'audio').length + 1);
          tracks = insertTrack(tracks, track);
        }

        const groupId = clip.groupId ?? uid('group');
        const audio: Clip = {
          ...clip,
          id: uid('clip'),
          kind: 'audio',
          trackId: track.id,
          name: `${clip.name} (audio)`,
          groupId,
          transitionIn: null,
          muted: false,
          volume: clip.volume
        };

        return {
          tracks,
          clips: [...state.clips.map(entry => (entry.id === clipId ? { ...entry, muted: true, groupId } : entry)), audio],
          selectedClipIds: [clipId, audio.id]
        };
      }),

    groupSelection: () =>
      commit(state => {
        if (state.selectedClipIds.length < 2) return null;
        const groupId = uid('group');
        return {
          clips: state.clips.map(clip => (state.selectedClipIds.includes(clip.id) ? { ...clip, groupId } : clip))
        };
      }),

    ungroupSelection: () =>
      commit(state => {
        const ids = expandGroups(state.clips, state.selectedClipIds);
        return { clips: state.clips.map(clip => (ids.includes(clip.id) ? { ...clip, groupId: null } : clip)) };
      }),

    /* ---------------- selection ---------------- */

    selectClip: (clipId, additive) =>
      set(state => {
        if (!clipId) return { selectedClipIds: [] };
        const expanded = expandGroups(state.clips, [clipId]);
        if (!additive) return { selectedClipIds: expanded };
        const already = expanded.every(id => state.selectedClipIds.includes(id));
        return {
          selectedClipIds: already
            ? state.selectedClipIds.filter(id => !expanded.includes(id))
            : [...new Set([...state.selectedClipIds, ...expanded])]
        };
      }),

    setSelection: clipIds => set(state => ({ selectedClipIds: expandGroups(state.clips, clipIds) })),

    selectAll: () => set(state => ({ selectedClipIds: state.clips.map(clip => clip.id) })),

    /* ---------------- transitions ---------------- */

    setTransition: (clipId, kind, durationUs) =>
      commit(state => ({
        clips: state.clips.map(clip =>
          clip.id === clipId
            ? {
                ...clip,
                transitionIn: kind
                  ? // A transition can't be longer than the clip it opens.
                    { kind, durationUs: Math.min(durationUs ?? 500_000, clip.durationUs) }
                  : null
              }
            : clip
        )
      })),

    /* ---------------- keyframes ---------------- */

    toggleKeyframe: (clipId, path, value) =>
      commit(state => {
        const clip = state.clips.find(entry => entry.id === clipId);
        if (!clip) return null;
        const localUs = state.playheadUs - clip.startUs;
        if (localUs < 0 || localUs > clip.durationUs) return null;

        const tolerance = US / (state.project.fps * 2);
        const existing = clip.animations[path];
        const hasKeyHere = existing?.some(key => Math.abs(key.atUs - localUs) <= tolerance);

        const keys = hasKeyHere ? removeKeyAt(existing, localUs, tolerance) : upsertKey(existing, localUs, value, tolerance);
        const animations = { ...clip.animations };
        if (keys.length > 0) animations[path] = keys;
        else delete animations[path];

        return { clips: state.clips.map(entry => (entry.id === clipId ? { ...entry, animations } : entry)) };
      }),

    removeKeyframe: (clipId, path, localUs) =>
      commit(state => {
        const clip = state.clips.find(entry => entry.id === clipId);
        if (!clip) return null;
        const tolerance = US / (state.project.fps * 2);
        const keys = removeKeyAt(clip.animations[path], localUs, tolerance);
        const animations = { ...clip.animations };
        if (keys.length > 0) animations[path] = keys;
        else delete animations[path];
        return { clips: state.clips.map(entry => (entry.id === clipId ? { ...entry, animations } : entry)) };
      }),

    clearKeyframes: (clipId, path) =>
      commit(state => {
        const clip = state.clips.find(entry => entry.id === clipId);
        if (!clip) return null;
        const animations = { ...clip.animations };
        delete animations[path];
        return { clips: state.clips.map(entry => (entry.id === clipId ? { ...entry, animations } : entry)) };
      }),

    /* ---------------- tracks ---------------- */

    addTrack: kind =>
      commit(state => {
        const count = state.tracks.filter(track => track.kind === kind).length + 1;
        return { tracks: insertTrack(state.tracks, makeTrack(kind, count)) };
      }),

    updateTrack: (trackId, patch) => {
      const apply = (state: EditorState) => ({
        tracks: state.tracks.map(track => (track.id === trackId ? { ...track, ...patch } : track))
      });
      // Height, level and name all change continuously — from a drag or a
      // keystroke — and would flood the undo stack. The toggles are single
      // decisions, so those get recorded.
      const continuous = 'height' in patch || 'volume' in patch || 'name' in patch;
      if (continuous) set(apply);
      else commit(apply);
    },

    removeTrack: trackId => {
      const doomed = get().clips.filter(clip => clip.trackId === trackId);
      commit(state => {
        const track = state.tracks.find(entry => entry.id === trackId);
        if (!track) return null;
        // Never leave the timeline without a track of each kind.
        if (state.tracks.filter(entry => entry.kind === track.kind).length <= 1) return null;
        return {
          tracks: state.tracks.filter(entry => entry.id !== trackId),
          clips: state.clips.filter(clip => clip.trackId !== trackId),
          selectedClipIds: state.selectedClipIds.filter(id => !doomed.some(clip => clip.id === id))
        };
      });
      void Promise.all(doomed.map(clip => releaseReader(clip.id)));
    },

    reorderTrack: (trackId, direction) =>
      commit(state => {
        const index = state.tracks.findIndex(track => track.id === trackId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= state.tracks.length) return null;
        // Only reorder within a kind, so video never sinks below audio.
        if (state.tracks[target].kind !== state.tracks[index].kind) return null;
        const tracks = [...state.tracks];
        [tracks[index], tracks[target]] = [tracks[target], tracks[index]];
        return { tracks };
      }),

    /* ---------------- markers ---------------- */

    addMarker: atUs =>
      commit(state => ({
        markers: [...state.markers, { id: uid('marker'), atUs: Math.max(0, Math.round(atUs ?? state.playheadUs)), label: '', color: '#f59e0b' }]
      })),

    updateMarker: (markerId, patch) =>
      commit(state => ({ markers: state.markers.map(marker => (marker.id === markerId ? { ...marker, ...patch } : marker)) })),

    removeMarker: markerId => commit(state => ({ markers: state.markers.filter(marker => marker.id !== markerId) })),

    /* ---------------- project ---------------- */

    updateProject: patch => commit(state => ({ project: { ...state.project, ...patch } })),
    setPlayhead: timeUs => set({ playheadUs: Math.max(0, timeUs) }),
    setPlaying: playing => set({ isPlaying: playing }),
    setZoom: pxPerSec => set({ pxPerSec: clamp(pxPerSec, 2, 800) }),
    toggleSnap: () => set(state => ({ snapEnabled: !state.snapEnabled })),
    toggleRipple: () => set(state => ({ rippleEnabled: !state.rippleEnabled })),
    setTool: tool => set({ tool }),
    setInPoint: timeUs => set({ inPointUs: timeUs }),
    setOutPoint: timeUs => set({ outPointUs: timeUs }),

    loadProject: data => {
      // Every clip id is about to be replaced, so the decoders keyed to the
      // old ones would sit in the pool until eviction pushed them out.
      void releaseAllReaders();
      set(state => ({
        project: normaliseProject(data.project),
        tracks: data.tracks,
        clips: (data.clips ?? []).map(normaliseClip),
        markers: data.markers ?? [],
        selectedClipIds: [],
        playheadUs: 0,
        past: [...state.past, snapshotOf(state)].slice(-MAX_HISTORY),
        future: []
      }));
    },

    resetProject: () => {
      void releaseAllReaders();
      set(state => ({
        project: DEFAULT_PROJECT,
        tracks: [makeTrack('video', 1), makeTrack('audio', 1)],
        clips: [],
        markers: [],
        selectedClipIds: [],
        playheadUs: 0,
        inPointUs: null,
        outPointUs: null,
        past: [...state.past, snapshotOf(state)].slice(-MAX_HISTORY),
        future: []
      }));
    },

    /* ---------------- history ---------------- */

    undo: () =>
      set(state => {
        const previous = state.past[state.past.length - 1];
        if (!previous) return {};
        return {
          ...previous,
          past: state.past.slice(0, -1),
          future: [snapshotOf(state), ...state.future].slice(0, MAX_HISTORY),
          selectedClipIds: state.selectedClipIds.filter(id => previous.clips.some(clip => clip.id === id))
        };
      }),

    redo: () =>
      set(state => {
        const next = state.future[0];
        if (!next) return {};
        return {
          ...next,
          past: [...state.past, snapshotOf(state)].slice(-MAX_HISTORY),
          future: state.future.slice(1),
          selectedClipIds: state.selectedClipIds.filter(id => next.clips.some(clip => clip.id === id))
        };
      })
  };
});

/** Non-reactive read, for the render loop which pulls state every frame. */
export const readEditorState = () => useEditor.getState();

/** Stable empty array so selectors returning "nothing" don't retrigger renders. */
const NO_CLIPS: Clip[] = [];

export const selectedClips = (state: EditorState): Clip[] =>
  state.selectedClipIds.length === 0 ? NO_CLIPS : state.clips.filter(clip => state.selectedClipIds.includes(clip.id));

export const primarySelectedClip = (state: EditorState): Clip | null =>
  state.selectedClipIds.length === 0 ? null : (state.clips.find(clip => clip.id === state.selectedClipIds[0]) ?? null);

export const serialiseProject = (state: EditorState): ProjectFile => ({
  version: 1,
  project: state.project,
  tracks: state.tracks,
  clips: state.clips,
  markers: state.markers,
  assetRefs: state.assets.map(asset => ({ id: asset.id, name: asset.name, size: asset.size, kind: asset.kind }))
});
