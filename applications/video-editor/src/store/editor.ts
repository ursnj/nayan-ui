import { create } from 'zustand';
import { makeMediaClip, makeTextClip, makeTrack } from '../lib/factories';
import { clamp, uid } from '../lib/utils';
import { releaseAllReaders, releaseAsset, releaseAssetsExcept, releaseReader } from '../media/library';
import {
  DEFAULT_BACKGROUND,
  DEFAULT_CHROMA,
  DEFAULT_COLOR,
  DEFAULT_CROP,
  DEFAULT_FIT,
  DEFAULT_TRANSFORM,
  US,
  clipEndUs,
  isMediaClip,
  isTextClip
} from '../types';
import type { Clip, MediaAsset, MediaFit, ProjectSettings, TextClip, Track, TrackKind, TransitionKind } from '../types';

/** Nothing shorter than this can be created by trimming or splitting. */
export const MIN_CLIP_US = 100_000;

const DEFAULT_PROJECT: ProjectSettings = {
  name: 'Untitled project',
  width: 1920,
  height: 1080,
  fps: 30,
  background: { ...DEFAULT_BACKGROUND }
};

interface Snapshot {
  project: ProjectSettings;
  tracks: Track[];
  clips: Clip[];
}

const cuttableAt = (clip: Clip, selectedClipIds: string[], at: number) => {
  if (clip.locked) return false;
  if (selectedClipIds.length > 0 && !selectedClipIds.includes(clip.id)) return false;
  return clip.startUs < at && clipEndUs(clip) > at && at - clip.startUs >= MIN_CLIP_US && clipEndUs(clip) - at >= MIN_CLIP_US;
};

/** The clips a split at `timeUs` would cut. */
export const splitTargetsAt = (clips: Clip[], selectedClipIds: string[], timeUs: number): Clip[] => {
  const at = Math.round(timeUs);
  return clips.filter(clip => cuttableAt(clip, selectedClipIds, at));
};

export const canSplitAt = (clips: Clip[], selectedClipIds: string[], timeUs: number): boolean => {
  const at = Math.round(timeUs);
  return clips.some(clip => cuttableAt(clip, selectedClipIds, at));
};

export interface EditorState extends Snapshot {
  assets: MediaAsset[];
  selectedClipIds: string[];
  playheadUs: number;
  isPlaying: boolean;
  pxPerSec: number;
  snapEnabled: boolean;
  rippleEnabled: boolean;
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
  setSelectionFit: (fit: MediaFit) => void;
  toggleSelectionFlip: (axis: 'h' | 'v') => void;
  moveClips: (moves: { clipId: string; startUs: number; trackId: string }[]) => void;
  nudgeSelection: (deltaUs: number) => void;
  shiftSelectionTrack: (direction: -1 | 1) => void;
  setClipEdge: (clipId: string, edge: 'start' | 'end', timeUs: number) => void;
  splitAt: (timeUs: number) => void;
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

  addTrack: (kind: TrackKind) => void;
  updateTrack: (trackId: string, patch: Partial<Track>) => void;
  removeTrack: (trackId: string) => void;
  reorderTrack: (trackId: string, direction: -1 | 1) => void;

  updateProject: (patch: Partial<ProjectSettings>) => void;
  setPlayhead: (timeUs: number) => void;
  setPlaying: (playing: boolean) => void;
  setZoom: (pxPerSec: number) => void;
  toggleSnap: () => void;
  toggleRipple: () => void;
  setInPoint: (timeUs: number | null) => void;
  setOutPoint: (timeUs: number | null) => void;

  loadProject: (data: ProjectFile, assets?: MediaAsset[]) => void;
  resetProject: () => void;

  undo: () => void;
  redo: () => void;
}

const INITIAL_TRACKS = [makeTrack('video', 1), makeTrack('audio', 1)];

// Memoised on array identity, which is exact here: the store replaces clips rather than mutating them.
let durationSource: Clip[] | null = null;
let durationValue = 0;

export const timelineDurationUs = (clips: Clip[]) => {
  if (clips === durationSource) return durationValue;
  durationSource = clips;
  durationValue = clips.reduce((end, clip) => Math.max(end, clipEndUs(clip)), 0);
  return durationValue;
};

/** Source material still available after the clip's in-point, in timeline time. */
const availableSourceUs = (clip: Clip, assets: MediaAsset[]) => {
  if (!isMediaClip(clip) || clip.kind === 'image') return Number.POSITIVE_INFINITY;
  const asset = assets.find(entry => entry.id === clip.assetId);
  if (!asset) return Number.POSITIVE_INFINITY;
  return Math.max(0, (asset.durationUs - clip.inUs) / clip.speed);
};

const overlaps = (clip: Clip, startUs: number, endUs: number) => clip.startUs < endUs && clipEndUs(clip) > startUs;

const findFreeTrack = (tracks: Track[], clips: Clip[], kind: TrackKind, startUs: number, durationUs: number): Track | null => {
  const endUs = startUs + durationUs;
  const candidates = tracks.filter(track => track.kind === kind && !track.locked).toReversed();
  for (const track of candidates) {
    const busy = clips.some(clip => clip.trackId === track.id && overlaps(clip, startUs, endUs));
    if (!busy) return track;
  }
  return null;
};

const insertTrack = (tracks: Track[], track: Track, clips: Clip[] = [], underTitles = false): Track[] => {
  if (track.kind !== 'video') return [...tracks, track];
  if (!underTitles) return [track, ...tracks];

  const titleTrackIds = new Set(clips.filter(isTextClip).map(clip => clip.trackId));
  let index = 0;
  while (index < tracks.length && tracks[index].kind === 'video' && titleTrackIds.has(tracks[index].id)) index++;
  return [...tracks.slice(0, index), track, ...tracks.slice(index)];
};

const snapshotOf = (state: Snapshot): Snapshot => ({
  project: state.project,
  tracks: state.tracks,
  clips: state.clips
});

const MAX_HISTORY = 80;

export interface ProjectFile {
  version: 1;
  project: ProjectSettings;
  tracks: Track[];
  clips: Clip[];
  assetRefs: { id: string; name: string; size: number; kind: string; entry: string; type: string }[];
}

// Project JSON from older builds may lack fields the model needs; a missing background throws every frame.

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
    filter: clip.filter ?? null
  };
  // Pre-fit files were all drawn contained, which is what `DEFAULT_FIT` is.
  return isMediaClip(base) ? { ...base, fit: base.fit ?? DEFAULT_FIT, chromaKey: { ...DEFAULT_CHROMA, ...base.chromaKey } } : base;
};

const selectedSet = (state: EditorState) => new Set(state.selectedClipIds);

const expandGroups = (clips: Clip[], ids: string[]): string[] => {
  const wanted = new Set(ids);
  const groups = new Set(clips.filter(clip => wanted.has(clip.id) && clip.groupId).map(clip => clip.groupId));
  if (groups.size === 0) return ids;
  const expanded = new Set(ids);
  for (const clip of clips) {
    if (clip.groupId && groups.has(clip.groupId)) expanded.add(clip.id);
  }
  return [...expanded];
};

export const useEditor = create<EditorState>((set, get) => {
  const commit = (mutate: (state: EditorState) => Partial<EditorState> | null) =>
    set(state => {
      const patch = mutate(state);
      if (!patch) return {};
      if (state.interacting) return patch;
      return { ...patch, past: [...state.past, snapshotOf(state)].slice(-MAX_HISTORY), future: [] };
    });

  const placeClip = (
    state: EditorState,
    kind: TrackKind,
    startUs: number,
    durationUs: number,
    preferredTrackId?: string,
    content: 'media' | 'text' = 'media'
  ) => {
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
      tracks = insertTrack(tracks, track, state.clips, content === 'media');
    }
    return { tracks, track };
  };

  return {
    project: DEFAULT_PROJECT,
    tracks: INITIAL_TRACKS,
    clips: [],
    assets: [],
    selectedClipIds: [],
    playheadUs: 0,
    isPlaying: false,
    pxPerSec: 60,
    snapEnabled: true,
    rippleEnabled: false,
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
      const { tracks, track } = placeClip(state, 'video', startUs, 3 * US, undefined, 'text');
      const clip = makeTextClip(track.id, startUs, preset);
      commit(current => ({ tracks, clips: [...current.clips, clip], selectedClipIds: [clip.id] }));
      return clip.id;
    },

    /* ---------------- editing ---------------- */

    updateClip: (clipId, patch) =>
      commit(state => ({ clips: state.clips.map(clip => (clip.id === clipId ? ({ ...clip, ...patch } as Clip) : clip)) })),

    updateSelectedClips: patch =>
      commit(state => {
        const selected = selectedSet(state);
        return { clips: state.clips.map(clip => (selected.has(clip.id) ? ({ ...clip, ...patch } as Clip) : clip)) };
      }),

    setSelectionFit: fit =>
      commit(state => {
        const selected = selectedSet(state);
        return {
          clips: state.clips.map(clip =>
            selected.has(clip.id) && isMediaClip(clip) && clip.kind !== 'audio'
              ? { ...clip, fit, transform: { ...clip.transform, x: 0, y: 0, scale: 1 } }
              : clip
          )
        };
      }),

    toggleSelectionFlip: axis =>
      commit(state => {
        const key = axis === 'h' ? 'flipH' : 'flipV';
        const selected = selectedSet(state);
        const targets = new Set(state.clips.filter(clip => selected.has(clip.id) && clip.kind !== 'audio').map(clip => clip.id));
        if (targets.size === 0) return null;
        const next = !state.clips.every(clip => !targets.has(clip.id) || clip.transform[key]);
        return {
          clips: state.clips.map(clip => (targets.has(clip.id) ? { ...clip, transform: { ...clip.transform, [key]: next } } : clip))
        };
      }),

    /** Moves a set of clips together: clamping them one by one would shear a multi-clip drag apart. */
    moveClips: moves =>
      commit(state => {
        const trackById = new Map(state.tracks.map(track => [track.id, track]));
        const clipById = new Map(state.clips.map(clip => [clip.id, clip]));
        const resolved: { clipId: string; startUs: number; trackId: string }[] = [];

        for (const move of moves) {
          const clip = clipById.get(move.clipId);
          if (!clip || clip.locked) return null;
          const target = trackById.get(move.trackId);
          if (!target || target.locked) return null;
          const wanted: TrackKind = clip.kind === 'audio' ? 'audio' : 'video';
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

    nudgeSelection: deltaUs => {
      const state = get();
      const selected = selectedSet(state);
      const targets = state.clips.filter(clip => selected.has(clip.id) && !clip.locked);
      if (targets.length === 0) return;

      let earliest = Number.POSITIVE_INFINITY;
      for (const clip of targets) earliest = Math.min(earliest, clip.startUs);
      const delta = Math.max(deltaUs, -earliest);
      if (delta === 0) return;

      get().moveClips(targets.map(clip => ({ clipId: clip.id, startUs: clip.startUs + delta, trackId: clip.trackId })));
    },

    shiftSelectionTrack: direction => {
      const state = get();
      const selected = selectedSet(state);
      const targets = state.clips.filter(clip => selected.has(clip.id) && !clip.locked);
      if (targets.length === 0) return;

      const moves: { clipId: string; startUs: number; trackId: string }[] = [];
      for (const clip of targets) {
        const from = state.tracks.findIndex(track => track.id === clip.trackId);
        if (from < 0) return;
        const wanted: TrackKind = clip.kind === 'audio' ? 'audio' : 'video';

        let target: Track | null = null;
        for (let index = from + direction; index >= 0 && index < state.tracks.length; index += direction) {
          const candidate = state.tracks[index];
          if (candidate.kind === wanted && !candidate.locked) {
            target = candidate;
            break;
          }
        }
        if (!target) return;
        moves.push({ clipId: clip.id, startUs: clip.startUs, trackId: target.id });
      }

      get().moveClips(moves);
    },

    setClipEdge: (clipId, edge, timeUs) =>
      commit(state => {
        const clip = state.clips.find(entry => entry.id === clipId);
        if (!clip || clip.locked) return null;
        const endUs = clipEndUs(clip);

        if (edge === 'start') {
          const headroomUs = isMediaClip(clip) && clip.kind !== 'image' ? clip.inUs / clip.speed : Number.POSITIVE_INFINITY;
          const lowerBound = Math.max(0, clip.startUs - headroomUs);
          const newStart = clamp(Math.round(timeUs), lowerBound, endUs - MIN_CLIP_US);
          const deltaUs = newStart - clip.startUs;
          const newDuration = endUs - newStart;

          const updated: Clip = {
            ...clip,
            startUs: newStart,
            durationUs: newDuration,
            ...(isMediaClip(clip) && clip.kind !== 'image' ? { inUs: Math.max(0, clip.inUs + deltaUs * clip.speed) } : {})
          } as Clip;

          return { clips: state.clips.map(entry => (entry.id === clipId ? updated : entry)) };
        }

        const maxDurationUs = availableSourceUs(clip, state.assets);
        const newEnd = clamp(Math.round(timeUs), clip.startUs + MIN_CLIP_US, clip.startUs + maxDurationUs);
        const newDuration = newEnd - clip.startUs;
        const updated: Clip = { ...clip, durationUs: newDuration };
        return { clips: state.clips.map(entry => (entry.id === clipId ? updated : entry)) };
      }),

    splitAt: timeUs =>
      commit(state => {
        const at = Math.round(timeUs);
        const cuttable = splitTargetsAt(state.clips, state.selectedClipIds, at);
        if (cuttable.length === 0) return null;

        const removed = new Set(cuttable.map(clip => clip.id));
        const created: Clip[] = [];

        for (const clip of cuttable) {
          const leftDuration = at - clip.startUs;
          const rightDuration = clipEndUs(clip) - at;

          created.push({
            ...clip,
            durationUs: leftDuration,
            fadeOutUs: Math.min(clip.fadeOutUs, leftDuration)
          } as Clip);

          created.push({
            ...clip,
            id: uid('clip'),
            startUs: at,
            durationUs: rightDuration,
            fadeInUs: Math.min(clip.fadeInUs, rightDuration),
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

    /* ---------------- project ---------------- */

    updateProject: patch => commit(state => ({ project: { ...state.project, ...patch } })),
    setPlayhead: timeUs => set({ playheadUs: Math.max(0, timeUs) }),
    setPlaying: playing => set({ isPlaying: playing }),
    setZoom: pxPerSec => set({ pxPerSec: clamp(pxPerSec, 2, 800) }),
    toggleSnap: () => set(state => ({ snapEnabled: !state.snapEnabled })),
    toggleRipple: () => set(state => ({ rippleEnabled: !state.rippleEnabled })),
    setInPoint: timeUs => set({ inPointUs: timeUs }),
    setOutPoint: timeUs => set({ outPointUs: timeUs }),

    loadProject: (data, assets) => {
      void releaseAllReaders();
      if (assets) void releaseAssetsExcept(assets.map(asset => asset.id));
      set(state => ({
        project: normaliseProject(data.project),
        tracks: data.tracks,
        clips: (data.clips ?? []).map(normaliseClip),
        assets: assets ?? state.assets,
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

export const primarySelectedClip = (state: EditorState): Clip | null =>
  state.selectedClipIds.length === 0 ? null : (state.clips.find(clip => clip.id === state.selectedClipIds[0]) ?? null);

export const serialiseProject = (state: EditorState): ProjectFile => ({
  version: 1,
  project: state.project,
  tracks: state.tracks,
  clips: state.clips,
  assetRefs: state.assets.map(asset => ({
    id: asset.id,
    name: asset.name,
    size: asset.size,
    kind: asset.kind,
    entry: bundleEntryFor(asset.id, asset.name),
    type: asset.type
  }))
});

export const bundleEntryFor = (assetId: string, name: string) => `media/${assetId}-${name.replace(/[/\\:*?"<>|]+/g, '_')}`;
