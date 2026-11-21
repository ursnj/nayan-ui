'use client';

import { forwardRef, type Ref, useImperativeHandle, useMemo, useState } from 'react';
import {
  type HostComponent,
  Image,
  requireNativeComponent,
  type StyleProp,
  StyleSheet,
  UIManager,
  type ViewProps,
  type ViewStyle
} from 'react-native';
import { resolveVideoSource, seekTime, validatePlayback } from './source';
import type { VideoOptions, VideoPlayerHandle, VideoSource, VideoStatus } from './types';

export interface VideoPlayerProps extends VideoOptions {
  /** A URI or a React Native bundled asset returned by require(). */
  source: VideoSource | number;
  style?: StyleProp<ViewStyle>;
}

type VideoEvent =
  { type: 'status'; status: VideoStatus } | { type: 'progress'; currentTime: number; duration: number | null } | { type: 'error'; message: string };

type NativeVideoProps = ViewProps & { configuration: string; onVideoEvent?: (event: { nativeEvent: VideoEvent }) => void };
let nativeVideo: HostComponent<NativeVideoProps> | undefined;

function videoView() {
  if (!nativeVideo) {
    if (!UIManager.hasViewManagerConfig('NayanEngineVideo'))
      throw new Error('VideoPlayer requires a native app build with the video feature enabled');
    nativeVideo = requireNativeComponent<NativeVideoProps>('NayanEngineVideo');
  }
  return nativeVideo;
}

const styles = StyleSheet.create({ player: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' } });

function Playback({
  uri,
  mimeType,
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
}: Omit<VideoPlayerProps, 'source'> & { uri: string; mimeType?: string; playerRef: Ref<VideoPlayerHandle> }) {
  validatePlayback(volume, playbackRate);
  const NativeVideo = videoView();
  const [commands, setCommands] = useState({ playRevision: 0, playing: false, seekRevision: 0, position: 0 });
  useImperativeHandle(
    playerRef,
    () => ({
      play: () => setCommands((value) => ({ ...value, playRevision: value.playRevision + 1, playing: true })),
      pause: () => setCommands((value) => ({ ...value, playRevision: value.playRevision + 1, playing: false })),
      seek(seconds) {
        const position = seekTime(seconds);
        setCommands((value) => ({ ...value, seekRevision: value.seekRevision + 1, position }));
      }
    }),
    []
  );
  const progress = !!onProgress;
  const events = progress || !!onStatusChange || !!onError;
  const configuration = useMemo(
    () => JSON.stringify({ uri, mimeType, controls, autoPlay, loop, muted, volume, playbackRate, contentFit, progress, events, ...commands }),
    [uri, mimeType, controls, autoPlay, loop, muted, volume, playbackRate, contentFit, progress, events, commands]
  );

  return (
    <NativeVideo
      style={[styles.player, style]}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      configuration={configuration}
      onVideoEvent={
        events
          ? ({ nativeEvent }) => {
              switch (nativeEvent.type) {
                case 'status':
                  onStatusChange?.(nativeEvent.status);
                  break;
                case 'progress':
                  onProgress?.({ currentTime: nativeEvent.currentTime, duration: nativeEvent.duration });
                  break;
                case 'error':
                  onStatusChange?.('error');
                  onError?.(new Error(nativeEvent.message));
                  break;
              }
            }
          : undefined
      }
    />
  );
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(function VideoPlayer({ source, ...props }, ref) {
  const { uri, mimeType } = resolveVideoSource(typeof source === 'number' ? Image.resolveAssetSource(source) : source);
  return <Playback key={`${uri}\0${mimeType ?? ''}`} {...props} uri={uri} mimeType={mimeType} playerRef={ref} />;
});
