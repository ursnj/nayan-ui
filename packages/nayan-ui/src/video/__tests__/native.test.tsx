import { act, createRef } from 'react';
import { afterAll, expect, mock, test } from 'bun:test';
import { installReactTestEnvironment } from '../../__tests__/dom';
import type { VideoPlayerHandle, VideoProgress, VideoStatus } from '../types';

type NativeProps = { configuration: string; onVideoEvent?: (event: { nativeEvent: Record<string, unknown> }) => void };
let latest: NativeProps;
const resolveAssetSource = mock((_asset: number) => ({ uri: 'file:///clip.mp4' }));
const requireNativeComponent = mock((_name: string) => (props: NativeProps) => {
  latest = props;
  return null;
});
mock.module('react-native', () => ({
  Image: { resolveAssetSource },
  StyleSheet: { create: (styles: unknown) => styles },
  UIManager: { hasViewManagerConfig: () => true },
  requireNativeComponent
}));
const { VideoPlayer } = await import('../VideoPlayer');
const dom = await installReactTestEnvironment();
afterAll(() => dom.cleanup());

test('native video resolves assets and resets imperative commands when the source changes', async () => {
  const container = document.createElement('div');
  const root = dom.createRoot(container);
  const player = createRef<VideoPlayerHandle>();
  const progress = mock((_progress: VideoProgress) => {});
  const status = mock((_status: VideoStatus) => {});
  const error = mock((_error: Error) => {});
  const config = () => JSON.parse(latest.configuration);
  try {
    await act(() =>
      root.render(
        <VideoPlayer
          ref={player}
          source={14}
          controls={false}
          muted
          volume={0.3}
          playbackRate={1.5}
          onProgress={progress}
          onStatusChange={status}
          onError={error}
        />
      )
    );
    expect(resolveAssetSource).toHaveBeenCalledWith(14);
    expect(requireNativeComponent).toHaveBeenCalledWith('NayanEngineVideo');
    expect(config()).toMatchObject({
      uri: 'file:///clip.mp4',
      controls: false,
      muted: true,
      volume: 0.3,
      playbackRate: 1.5,
      progress: true,
      events: true,
      playRevision: 0,
      seekRevision: 0
    });
    await act(() => {
      player.current!.play();
      player.current!.seek(5);
      player.current!.pause();
    });
    expect(config()).toMatchObject({ playRevision: 2, seekRevision: 1, playing: false, position: 5 });
    expect(() => player.current!.seek(Infinity)).toThrow(RangeError);

    const emit = (nativeEvent: Record<string, unknown>) => latest.onVideoEvent!({ nativeEvent });
    emit({ type: 'status', status: 'ready' });
    emit({ type: 'progress', currentTime: 5, duration: null });
    emit({ type: 'error', message: 'Decoder failed' });
    expect(status.mock.calls.flat()).toEqual(['ready', 'error']);
    expect(progress).toHaveBeenCalledWith({ currentTime: 5, duration: null });
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ message: 'Decoder failed' }));

    await act(() => root.render(<VideoPlayer ref={player} source={{ uri: 'https://example.test/other', mimeType: 'video/webm' }} />));
    expect(config()).toMatchObject({
      mimeType: 'video/webm',
      controls: true,
      events: false,
      progress: false,
      playRevision: 0,
      seekRevision: 0,
      position: 0
    });
    expect(latest.onVideoEvent).toBeUndefined();
    expect(requireNativeComponent).toHaveBeenCalledTimes(1);
  } finally {
    await act(() => root.unmount());
  }
});
