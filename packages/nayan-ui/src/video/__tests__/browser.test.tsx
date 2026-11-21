import { act, createRef, StrictMode } from 'react';
import { afterAll, beforeEach, expect, mock, spyOn, test } from 'bun:test';
import { installReactTestEnvironment } from '../../__tests__/dom';
import type { VideoPlayerHandle, VideoProgress, VideoStatus } from '../types';
import { VideoPlayer } from '../VideoPlayer.web';

const dom = await installReactTestEnvironment();
afterAll(() => dom.cleanup());
let container: HTMLDivElement;
let root: ReturnType<typeof dom.createRoot>;
beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = dom.createRoot(container);
});

function mediaEvent(video: HTMLVideoElement, name: string) {
  video.dispatchEvent(new Event(name));
}

test('browser video reports playback state, throttles progress and publishes seeks immediately', async () => {
  const progress = mock((_progress: VideoProgress) => {});
  const status = mock((_status: VideoStatus) => {});
  const error = mock((_error: Error) => {});
  const ref = createRef<VideoPlayerHandle>();
  let now = 100;
  const clock = spyOn(performance, 'now').mockImplementation(() => now);
  try {
    await act(() =>
      root.render(
        <VideoPlayer
          ref={ref}
          source="https://example.test/video.mp4"
          volume={0.4}
          playbackRate={1.25}
          onProgress={progress}
          onStatusChange={status}
          onError={error}
        />
      )
    );
    const video = container.querySelector('video')!;
    expect(video.controls).toBe(true);
    expect(video.preload).toBe('metadata');
    expect(video.hasAttribute('playsinline')).toBe(true);
    expect(video.volume).toBe(0.4);
    expect(video.playbackRate).toBe(1.25);

    Object.defineProperty(video, 'paused', { configurable: true, value: true });
    Object.defineProperty(video, 'duration', { configurable: true, value: Infinity });
    await act(() => {
      mediaEvent(video, 'loadstart');
      mediaEvent(video, 'loadeddata');
      mediaEvent(video, 'loadeddata');
      mediaEvent(video, 'waiting');
      mediaEvent(video, 'durationchange');
    });
    expect(progress).toHaveBeenCalledWith({ currentTime: 0, duration: null });

    Object.defineProperty(video, 'paused', { configurable: true, value: false });
    Object.defineProperty(video, 'duration', { configurable: true, value: 30 });
    await act(() => {
      mediaEvent(video, 'playing');
      mediaEvent(video, 'playing');
      mediaEvent(video, 'waiting');
      video.currentTime = 2;
      mediaEvent(video, 'timeupdate');
      now += 250;
      mediaEvent(video, 'timeupdate');
      mediaEvent(video, 'timeupdate');
      ref.current!.seek(10);
      mediaEvent(video, 'seeked');
    });
    expect(progress.mock.calls).toEqual([
      [{ currentTime: 0, duration: null }],
      [{ currentTime: 2, duration: 30 }],
      [{ currentTime: 10, duration: 30 }]
    ]);
    expect(() => ref.current!.seek(-1)).toThrow(RangeError);
    expect(() => ref.current!.seek(NaN)).toThrow(RangeError);

    Object.defineProperty(video, 'ended', { configurable: true, value: true });
    await act(() => {
      mediaEvent(video, 'pause');
      mediaEvent(video, 'ended');
      mediaEvent(video, 'error');
    });
    expect(status.mock.calls.flat()).toEqual(['loading', 'ready', 'playing', 'buffering', 'ended', 'error']);
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ message: 'Unable to play this video' }));
  } finally {
    clock.mockRestore();
    await act(() => root.unmount());
    container.remove();
  }
});

test('replacement releases the old media, ignores its queued play failure and pauses the current video when hidden', async () => {
  const ref = createRef<VideoPlayerHandle>();
  const onError = mock((_error: Error) => {});
  const play = Promise.withResolvers<void>();
  const report = (source: string) => (
    <StrictMode>
      <VideoPlayer source={source} ref={ref} accessibilityLabel="Clip" onError={onError} />
    </StrictMode>
  );
  try {
    await act(() => root.render(report('https://example.test/first.mp4')));
    const first = container.querySelector('video')!;
    const firstPause = spyOn(first, 'pause').mockImplementation(() => {});
    const firstLoad = spyOn(first, 'load').mockImplementation(() => {});
    spyOn(first, 'play').mockImplementation(() => play.promise);
    ref.current!.play();
    expect(first.getAttribute('src')).toEndWith('/first.mp4');

    await act(() => root.render(report('https://example.test/second.mp4')));
    const second = container.querySelector('video')!;
    expect(second).not.toBe(first);
    expect(firstPause).toHaveBeenCalledTimes(1);
    expect(firstLoad).toHaveBeenCalledTimes(1);
    expect(first.hasAttribute('src')).toBe(false);
    expect(second.getAttribute('aria-label')).toBe('Clip');
    play.reject(new Error('old source failed'));
    await Promise.resolve();
    expect(onError).not.toHaveBeenCalled();

    const pause = spyOn(second, 'pause').mockImplementation(() => {});
    spyOn(second, 'play')
      .mockRejectedValueOnce(new DOMException('cancelled', 'AbortError'))
      .mockRejectedValueOnce(new DOMException('permission required', 'NotAllowedError'));
    ref.current!.play();
    await Promise.resolve();
    expect(onError).not.toHaveBeenCalled();
    ref.current!.play();
    await Promise.resolve();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ name: 'NotAllowedError' }));
    ref.current!.pause();
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(pause).toHaveBeenCalledTimes(2);

    await act(() => root.unmount());
    document.dispatchEvent(new Event('visibilitychange'));
    expect(pause).toHaveBeenCalledTimes(3);
    expect(ref.current).toBeNull();
  } finally {
    Reflect.deleteProperty(document, 'hidden');
    await act(() => root.unmount());
    container.remove();
  }
});
