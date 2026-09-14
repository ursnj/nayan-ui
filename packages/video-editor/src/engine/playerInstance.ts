import { readEditorState, timelineDurationUs, useEditor } from '../store/editor';
import { US } from '../types';
import { Player } from './player';

/**
 * One editor per page, so the player is a module singleton. This keeps the
 * transport controls, the timeline and the preview canvas talking to the same
 * instance without threading a context through every component.
 *
 * The player pulls scene state on demand rather than receiving it as props, so
 * edits made while playing show up on the very next frame.
 */
export const player = new Player({
  getScene: () => {
    const state = readEditorState();
    return { project: state.project, tracks: state.tracks, clips: state.clips };
  },
  getDurationUs: () => {
    const state = readEditorState();
    // Playback stops at the out point when a range is marked.
    return state.outPointUs ?? timelineDurationUs(state.clips);
  },
  // Written straight to the store rather than through an action: this fires
  // every animation frame and must not create an undo entry.
  onTime: timeUs => useEditor.setState({ playheadUs: timeUs }),
  onEnded: () => useEditor.setState({ isPlaying: false })
});

export const togglePlayback = async () => {
  const state = readEditorState();
  if (player.isPlaying) {
    player.pause();
    useEditor.setState({ isPlaying: false });
    return;
  }
  if (timelineDurationUs(state.clips) <= 0) return;
  useEditor.setState({ isPlaying: true });
  // Playing with a marked range starts from the in point when outside it.
  const from = state.inPointUs !== null && state.playheadUs < state.inPointUs ? state.inPointUs : state.playheadUs;
  await player.play(from);
};

export const pausePlayback = () => {
  player.pause();
  useEditor.setState({ isPlaying: false });
};

export const seekTo = (timeUs: number) => {
  const duration = timelineDurationUs(readEditorState().clips);
  const clamped = Math.max(0, Math.min(timeUs, duration));
  useEditor.setState({ playheadUs: clamped, isPlaying: false });
  void player.seek(clamped);
};

/** Steps whole project frames; used by the arrow keys and transport buttons. */
export const stepFrames = (frames: number) => {
  const state = readEditorState();
  const frameUs = US / Math.max(1, state.project.fps);
  seekTo(Math.round((state.playheadUs + frames * frameUs) / frameUs) * frameUs);
};
