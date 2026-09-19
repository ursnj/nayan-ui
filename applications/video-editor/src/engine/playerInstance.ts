import { readEditorState, timelineDurationUs, useEditor } from '../store/editor';
import { US } from '../types';
import { Player } from './player';

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
  getLoopStartUs: () => readEditorState().inPointUs ?? 0,
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
