import { readEditorState, timelineDurationUs, useEditor } from '../store/editor';
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
  getDurationUs: () => timelineDurationUs(readEditorState().clips),
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
  await player.play(state.playheadUs);
};

export const seekTo = (timeUs: number) => {
  const duration = timelineDurationUs(readEditorState().clips);
  const clamped = Math.max(0, Math.min(timeUs, duration));
  useEditor.setState({ playheadUs: clamped, isPlaying: false });
  void player.seek(clamped);
};

/** Steps one project frame; used by the arrow keys and the transport buttons. */
export const stepFrames = (frames: number) => {
  const state = readEditorState();
  const frameUs = 1_000_000 / Math.max(1, state.project.fps);
  seekTo(state.playheadUs + frames * frameUs);
};
