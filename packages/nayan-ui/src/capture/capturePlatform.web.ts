import { stopMediaStream } from '../native/mediaStream.web';
import type { CapturedImage } from './types';

const owned = new Set<string>();
let busy = false;
export const capture = {
  async isAvailable(): Promise<boolean> {
    return typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getDisplayMedia === 'function';
  },
  async screen(): Promise<CapturedImage> {
    if (typeof navigator === 'undefined' || typeof navigator.mediaDevices?.getDisplayMedia !== 'function')
      throw new Error('Screen capture requires a supported browser over HTTPS or localhost');
    if (busy) throw new Error('A screen capture is already in progress');
    busy = true;
    let stream: MediaStream | undefined;
    let video: HTMLVideoElement | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      // Request directly in the originating gesture. Browsers always ask which display/tab to share.
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await Promise.race([
        video.play(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('Screen capture timed out')), 5000);
        })
      ]);
      const { videoWidth: width, videoHeight: height } = video;
      if (!width || !height || width * height > 12000000) throw new Error('Screen capture requires a frame up to 12 megapixels');
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Screen capture canvas is unavailable');
      context.drawImage(video, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((value) => (value ? resolve(value) : reject(new Error('Could not encode capture'))), 'image/png')
      );
      const uri = URL.createObjectURL(blob);
      owned.add(uri);
      return { uri, width, height, scale: 1 };
    } finally {
      if (timer) clearTimeout(timer);
      if (video) {
        video.pause();
        video.srcObject = null;
      }
      stopMediaStream(stream);
      busy = false;
    }
  },
  async release(uri: string): Promise<void> {
    if (typeof uri !== 'string' || !uri || uri.includes('\0')) throw new TypeError('A capture URI is required');
    if (owned.delete(uri)) URL.revokeObjectURL(uri);
    else if (!uri.startsWith('blob:')) throw new Error('Only engine capture object URLs can be released');
  }
};
