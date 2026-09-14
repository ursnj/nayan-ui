import { create } from 'zustand';
import { clamp, uid } from '../lib/utils';
import { releaseAsset, releaseReader } from '../media/library';
import { DEFAULT_FILTERS, DEFAULT_TRANSFORM, US, clipEndUs, isMediaClip } from '../types';
import type { Clip, MediaAsset, MediaClip, ProjectSettings, TextClip, Track, TrackKind } from '../types';

/** Nothing shorter than this can be created by trimming or splitting. */
export const MIN_CLIP_US = 100_000;

const DEFAULT_PROJECT: ProjectSettings = {
  name: 'Untitled project',
  width: 1920,
  height: 1080,
  fps: 30,
  backgroundColor: '#000000'
};

/** The undoable slice of state. Playhead and zoom are deliberately excluded. */
interface Snapshot {
  project: ProjectSettings;
  tracks: Track[];
  clips: Clip[];
}

interface EditorState extends Snapshot {
  assets: MediaAsset[];
  selectedClipId: string | null;
  playheadUs: number;
  isPlaying: boolean;
  pxPerSec: number;
  snapEnabled: boolean;
  past: Snapshot[];
  future: Snapshot[];
  /** True while a pointer drag is in flight; suppresses per-move history entries. */
  interacting: boolean;

  beginInteraction: () => void;
  endInteraction: () => void;

  addAsset: (asset: MediaAsset) => void;
  updateAsset: (assetId: string, patch: Partial<MediaAsset>) => void;
  removeAsset: (assetId: string) => void;

  addClipFromAsset: (assetId: string, atUs?: number, preferredTrackId?: string) => string | null;
  addTextClip: (atUs?: number) => string | null;
  /** `Partial<Clip>` distributes over the union, so this accepts either shape. */
  updateClip: (clipId: string, patch: Partial<Clip>) => void;
  moveClip: (clipId: string, startUs: number, trackId: string) => void;
  setClipEdge: (clipId: string, edge: 'start' | 'end', timeUs: number) => void;
  splitAtPlayhead: () => void;
  duplicateClip: (clipId: string) => void;
  deleteClip: (clipId: string) => void;
  selectClip: (clipId: string | null) => void;

  addTrack: (kind: TrackKind) => void;
  updateTrack: (trackId: string, patch: Partial<Track>) => void;
  removeTrack: (trackId: string) => void;

  updateProject: (patch: Partial<ProjectSettings>) => void;
  setPlayhead: (timeUs: number) => void;
  setPlaying: (playing: boolean) => void;
  setZoom: (pxPerSec: number) => void;
  toggleSnap: () => void;

  undo: () => void;
  redo: () => void;
}

const makeTrack = (kind: TrackKind, index: number): Track => ({
  id: uid('track'),
  kind,
  name: `${kind === 'video' ? 'Video' : 'Audio'} ${index}`,
  muted: false,
  hidden: false,
  locked: false
});

const INITIAL_TRACKS = [makeTrack('video', 1), makeTrack('audio', 1)];

/** Timeline length, i.e. the end of the last clip. */
export const timelineDurationUs = (clips: Clip[]) => clips.reduce((end, clip) => Math.max(end, clipEndUs(clip)), 0);

/** Source material still available after the clip's in-point, in timeline time. */
const availableSourceUs = (clip: MediaClip, asset: MediaAsset | undefined) => {
  if (!asset || clip.kind === 'image') return Number.POSITIVE_INFINITY;
  return Math.max(0, (asset.durationUs - clip.inUs) / clip.speed);
};

const overlaps = (a: Clip, startUs: number, endUs: number) => a.startUs < endUs && clipEndUs(a) > startUs;

/**
 * Track order is also layer order: `tracks[0]` is the topmost row in the
 * timeline and the last thing the compositor draws. Video tracks come first,
 * audio tracks after them.
 *
 * Finds the lowest free layer, so a new import lands on the main track rather
 * than floating above whatever is already there.
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
  clips: state.clips
});

const MAX_HISTORY = 60;

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
      return {
        ...patch,
        past: [...state.past, snapshotOf(state)].slice(-MAX_HISTORY),
        future: []
      };
    });

  return {
    project: DEFAULT_PROJECT,
    tracks: INITIAL_TRACKS,
    clips: [],
    assets: [],
    selectedClipId: null,
    playheadUs: 0,
    isPlaying: false,
    pxPerSec: 60,
    snapEnabled: true,
    past: [],
    future: [],
    interacting: false,

    beginInteraction: () =>
      set(state => (state.interacting ? {} : { past: [...state.past, snapshotOf(state)].slice(-MAX_HISTORY), future: [], interacting: true })),

    endInteraction: () => set({ interacting: false }),

    addAsset: asset => set(state => ({ assets: [...state.assets, asset] })),

    updateAsset: (assetId, patch) =>
      set(state => ({
        assets: state.assets.map(asset => (asset.id === assetId ? { ...asset, ...patch } : asset))
      })),

    removeAsset: assetId => {
      const affected = get().clips.filter(clip => isMediaClip(clip) && clip.assetId === assetId);
      commit(state => ({
        assets: state.assets.filter(asset => asset.id !== assetId),
        clips: state.clips.filter(clip => !(isMediaClip(clip) && clip.assetId === assetId)),
        selectedClipId: affected.some(clip => clip.id === state.selectedClipId) ? null : state.selectedClipId
      }));
      void Promise.all(affected.map(clip => releaseReader(clip.id))).then(() => releaseAsset(assetId));
    },

    addClipFromAsset: (assetId, atUs, preferredTrackId) => {
      const state = get();
      const asset = state.assets.find(entry => entry.id === assetId);
      if (!asset) return null;

      const kind: TrackKind = asset.kind === 'audio' ? 'audio' : 'video';
      const startUs = Math.max(0, Math.round(atUs ?? state.playheadUs));
      const durationUs = Math.max(MIN_CLIP_US, asset.durationUs || 5 * US);

      let tracks = state.tracks;
      // A drop targets a specific row; honour it when the clip fits there.
      const preferred = tracks.find(entry => entry.id === preferredTrackId);
      const preferredIsUsable =
        preferred &&
        preferred.kind === kind &&
        !preferred.locked &&
        !state.clips.some(clip => clip.trackId === preferred.id && clip.startUs < startUs + durationUs && clipEndUs(clip) > startUs);

      let track = preferredIsUsable ? preferred : findFreeTrack(tracks, state.clips, kind, startUs, durationUs);
      if (!track) {
        const count = tracks.filter(entry => entry.kind === kind).length + 1;
        track = makeTrack(kind, count);
        tracks = insertTrack(tracks, track);
      }

      const clip: MediaClip = {
        id: uid('clip'),
        trackId: track.id,
        kind: asset.kind,
        assetId: asset.id,
        name: asset.name,
        startUs,
        durationUs,
        inUs: 0,
        speed: 1,
        volume: 1,
        muted: false,
        opacity: 1,
        fadeInUs: 0,
        fadeOutUs: 0,
        transform: { ...DEFAULT_TRANSFORM },
        filters: { ...DEFAULT_FILTERS }
      };

      commit(current => ({
        tracks,
        clips: [...current.clips, clip],
        selectedClipId: clip.id
      }));
      return clip.id;
    },

    addTextClip: atUs => {
      const state = get();
      const startUs = Math.max(0, Math.round(atUs ?? state.playheadUs));
      const durationUs = 3 * US;

      let tracks = state.tracks;
      let track = findFreeTrack(tracks, state.clips, 'video', startUs, durationUs);
      if (!track) {
        const count = tracks.filter(entry => entry.kind === 'video').length + 1;
        track = makeTrack('video', count);
        tracks = insertTrack(tracks, track);
      }

      const clip: TextClip = {
        id: uid('clip'),
        trackId: track.id,
        kind: 'text',
        name: 'Text',
        startUs,
        durationUs,
        opacity: 1,
        fadeInUs: 0,
        fadeOutUs: 0,
        text: 'Your text here',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 0.08,
        color: '#ffffff',
        backgroundColor: 'transparent',
        strokeColor: '#000000',
        strokeWidth: 0,
        align: 'center',
        bold: true,
        italic: false,
        x: 0,
        y: 0.3
      };

      commit(current => ({
        tracks,
        clips: [...current.clips, clip],
        selectedClipId: clip.id
      }));
      return clip.id;
    },

    updateClip: (clipId, patch) =>
      commit(state => ({
        clips: state.clips.map(clip => (clip.id === clipId ? ({ ...clip, ...patch } as Clip) : clip))
      })),

    moveClip: (clipId, startUs, trackId) =>
      commit(state => {
        const clip = state.clips.find(entry => entry.id === clipId);
        if (!clip) return null;
        const track = state.tracks.find(entry => entry.id === trackId);
        if (!track || track.locked) return null;
        // Audio-only clips can't live on a video track, and vice versa.
        const wanted: TrackKind = clip.kind === 'audio' ? 'audio' : 'video';
        if (track.kind !== wanted) return null;

        return {
          clips: state.clips.map(entry => (entry.id === clipId ? { ...entry, startUs: Math.max(0, Math.round(startUs)), trackId } : entry))
        };
      }),

    setClipEdge: (clipId, edge, timeUs) =>
      commit(state => {
        const clip = state.clips.find(entry => entry.id === clipId);
        if (!clip) return null;
        const asset = isMediaClip(clip) ? state.assets.find(entry => entry.id === clip.assetId) : undefined;
        const endUs = clipEndUs(clip);

        if (edge === 'start') {
          // Dragging the left edge also moves the in-point, so the visible
          // frames stay put instead of sliding.
          const headroomUs = isMediaClip(clip) && clip.kind !== 'image' ? clip.inUs / clip.speed : Number.POSITIVE_INFINITY;
          const lowerBound = Math.max(0, clip.startUs - headroomUs);
          const newStart = clamp(Math.round(timeUs), lowerBound, endUs - MIN_CLIP_US);
          const deltaUs = newStart - clip.startUs;

          const updated: Clip = isMediaClip(clip)
            ? {
                ...clip,
                startUs: newStart,
                durationUs: endUs - newStart,
                inUs: clip.kind === 'image' ? clip.inUs : Math.max(0, clip.inUs + deltaUs * clip.speed)
              }
            : { ...clip, startUs: newStart, durationUs: endUs - newStart };

          return { clips: state.clips.map(entry => (entry.id === clipId ? updated : entry)) };
        }

        const maxDurationUs = isMediaClip(clip) ? availableSourceUs(clip, asset) : Number.POSITIVE_INFINITY;
        const newEnd = clamp(Math.round(timeUs), clip.startUs + MIN_CLIP_US, clip.startUs + maxDurationUs);
        return {
          clips: state.clips.map(entry => (entry.id === clipId ? { ...entry, durationUs: newEnd - clip.startUs } : entry))
        };
      }),

    splitAtPlayhead: () =>
      commit(state => {
        const at = state.playheadUs;
        const clip =
          state.clips.find(entry => entry.id === state.selectedClipId && entry.startUs < at && clipEndUs(entry) > at) ??
          state.clips.find(entry => entry.startUs < at && clipEndUs(entry) > at);
        if (!clip) return null;
        if (at - clip.startUs < MIN_CLIP_US || clipEndUs(clip) - at < MIN_CLIP_US) return null;

        const leftDuration = at - clip.startUs;
        const rightDuration = clipEndUs(clip) - at;

        // Each half keeps only the fade on its own outer edge.
        const left: Clip = {
          ...clip,
          durationUs: leftDuration,
          fadeOutUs: Math.min(clip.fadeOutUs, leftDuration)
        };
        const right: Clip = {
          ...clip,
          id: uid('clip'),
          startUs: at,
          durationUs: rightDuration,
          fadeInUs: Math.min(clip.fadeInUs, rightDuration),
          ...(isMediaClip(clip) ? { inUs: clip.inUs + leftDuration * clip.speed } : {})
        } as Clip;

        return {
          clips: [...state.clips.filter(entry => entry.id !== clip.id), left, right],
          selectedClipId: right.id
        };
      }),

    duplicateClip: clipId =>
      commit(state => {
        const clip = state.clips.find(entry => entry.id === clipId);
        if (!clip) return null;
        const copy: Clip = { ...clip, id: uid('clip'), startUs: clipEndUs(clip) };
        return { clips: [...state.clips, copy], selectedClipId: copy.id };
      }),

    deleteClip: clipId => {
      commit(state => ({
        clips: state.clips.filter(clip => clip.id !== clipId),
        selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId
      }));
      void releaseReader(clipId);
    },

    selectClip: clipId => set({ selectedClipId: clipId }),

    addTrack: kind =>
      commit(state => {
        const count = state.tracks.filter(track => track.kind === kind).length + 1;
        return { tracks: insertTrack(state.tracks, makeTrack(kind, count)) };
      }),

    updateTrack: (trackId, patch) =>
      set(state => ({
        tracks: state.tracks.map(track => (track.id === trackId ? { ...track, ...patch } : track))
      })),

    removeTrack: trackId => {
      const doomed = get().clips.filter(clip => clip.trackId === trackId);
      commit(state => {
        // Never leave the timeline without a track of each kind.
        const track = state.tracks.find(entry => entry.id === trackId);
        if (!track) return null;
        if (state.tracks.filter(entry => entry.kind === track.kind).length <= 1) return null;
        return {
          tracks: state.tracks.filter(entry => entry.id !== trackId),
          clips: state.clips.filter(clip => clip.trackId !== trackId),
          selectedClipId: doomed.some(clip => clip.id === state.selectedClipId) ? null : state.selectedClipId
        };
      });
      void Promise.all(doomed.map(clip => releaseReader(clip.id)));
    },

    updateProject: patch => commit(state => ({ project: { ...state.project, ...patch } })),

    setPlayhead: timeUs => set({ playheadUs: Math.max(0, timeUs) }),

    setPlaying: playing => set({ isPlaying: playing }),

    setZoom: pxPerSec => set({ pxPerSec: clamp(pxPerSec, 4, 600) }),

    toggleSnap: () => set(state => ({ snapEnabled: !state.snapEnabled })),

    undo: () =>
      set(state => {
        const previous = state.past[state.past.length - 1];
        if (!previous) return {};
        return {
          ...previous,
          past: state.past.slice(0, -1),
          future: [snapshotOf(state), ...state.future].slice(0, MAX_HISTORY),
          selectedClipId: previous.clips.some(clip => clip.id === state.selectedClipId) ? state.selectedClipId : null
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
          selectedClipId: next.clips.some(clip => clip.id === state.selectedClipId) ? state.selectedClipId : null
        };
      })
  };
});

/** Non-reactive read, for the render loop which pulls state every frame. */
export const readEditorState = () => useEditor.getState();
