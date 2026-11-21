'use client';

import { type CSSProperties, forwardRef, type Ref, useEffect, useImperativeHandle, useRef } from 'react';
import { resolveVideoSource, seekTime, validatePlayback } from './source';
import type { VideoOptions, VideoPlayerHandle, VideoSource, VideoStatus } from './types';

export interface VideoPlayerProps extends VideoOptions {
  source: VideoSource;
  style?: CSSProperties;
}

function Playback({
  uri,
  playerRef,
  style,
  controls = true,
  autoPlay = false,
  loop = false,
  muted = false,
  volume = 1,
  playbackRate = 1,
  contentFit = 'contain',
  accessibilityLabel,
  testID,
  onStatusChange,
  onProgress,
  onError
}: Omit<VideoPlayerProps, 'source'> & { uri: string; playerRef: Ref<VideoPlayerHandle> }) {
  validatePlayback(volume, playbackRate);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastStatus = useRef<VideoStatus | undefined>(undefined);
  const lastProgress = useRef(-Infinity);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.defaultPlaybackRate = playbackRate;
    video.playbackRate = playbackRate;
  }, [volume, playbackRate]);

  function status(value: VideoStatus) {
    if (lastStatus.current === value) return;
    lastStatus.current = value;
    onStatusChange?.(value);
  }

  function reportProgress(video: HTMLVideoElement, force = false) {
    if (!onProgress) return;
    const now = performance.now();
    if (!force && now - lastProgress.current < 250) return;
    lastProgress.current = now;
    onProgress({ currentTime: video.currentTime, duration: Number.isFinite(video.duration) ? video.duration : null });
  }

  useImperativeHandle(
    playerRef,
    () => ({
      play() {
        const video = videoRef.current;
        if (!video) return;
        void video.play().catch((error: DOMException) => {
          // A source replacement or pause can cancel a queued browser play request.
          if (videoRef.current === video && error.name !== 'AbortError') onError?.(error);
        });
      },
      pause: () => videoRef.current?.pause(),
      seek(seconds) {
        const position = seekTime(seconds);
        const video = videoRef.current;
        if (video) video.currentTime = position;
      }
    }),
    [onError]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const pauseWhenHidden = () => {
      if (document.hidden) video.pause();
    };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => {
      document.removeEventListener('visibilitychange', pauseWhenHidden);
      // Strict Mode also runs effect cleanup on an element that remains mounted.
      queueMicrotask(() => {
        if (video.isConnected) return;
        video.pause();
        video.removeAttribute('src');
        video.load();
      });
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={uri}
      controls={controls}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      playsInline
      preload="metadata"
      aria-label={accessibilityLabel}
      data-testid={testID}
      style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', backgroundColor: '#000', objectFit: contentFit, ...style }}
      onLoadStart={() => status('loading')}
      onLoadedData={({ currentTarget }) => {
        if (currentTarget.paused) status('ready');
      }}
      onPlaying={() => status('playing')}
      onPause={({ currentTarget }) => {
        status(currentTarget.ended ? 'ended' : 'paused');
        reportProgress(currentTarget, true);
      }}
      onWaiting={({ currentTarget }) => {
        if (!currentTarget.paused) status('buffering');
      }}
      onEnded={() => status('ended')}
      onDurationChange={onProgress ? ({ currentTarget }) => reportProgress(currentTarget, true) : undefined}
      onSeeked={onProgress ? ({ currentTarget }) => reportProgress(currentTarget, true) : undefined}
      onTimeUpdate={onProgress ? ({ currentTarget }) => reportProgress(currentTarget) : undefined}
      onError={({ currentTarget }) => {
        status('error');
        onError?.(new Error(currentTarget.error?.message || 'Unable to play this video'));
      }}
    />
  );
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(function VideoPlayer({ source, ...props }, ref) {
  const { uri } = resolveVideoSource(source);
  return <Playback key={uri} {...props} uri={uri} playerRef={ref} />;
});
