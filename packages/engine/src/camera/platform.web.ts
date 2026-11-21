import { stopMediaStream } from '../native/mediaStream.web';
import { imagePicker, preparePhoto } from '../image-picker/imagePicker.web';
import { imageOptions } from '../image-picker/options';
import type { CameraPhoto, CameraPhotoOptions } from './types';

export const { release } = imagePicker;
let busy = false;

export function isAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof HTMLDialogElement !== 'undefined' &&
    typeof HTMLDialogElement.prototype.showModal === 'function'
  );
}

function preview(): Promise<HTMLCanvasElement | null> {
  return new Promise((resolve, reject) => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.createElement('dialog');
    dialog.setAttribute('aria-label', 'Camera');
    dialog.style.cssText = 'max-width:min(90vw,640px);padding:16px;color:CanvasText;background:Canvas';
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.style.cssText = 'display:block;width:100%;max-height:70vh;background:#111;margin-bottom:12px';
    const cancel = document.createElement('button');
    cancel.textContent = 'Cancel';
    const shutter = document.createElement('button');
    shutter.textContent = 'Take photo';
    shutter.disabled = true;
    shutter.style.marginInlineStart = '12px';
    let stream: MediaStream | undefined;
    let finished = false;

    function finish(photo: HTMLCanvasElement | null, error?: unknown) {
      if (finished) return;
      finished = true;
      stopMediaStream(stream);
      video.srcObject = null;
      dialog.close();
      dialog.remove();
      previous?.focus();
      if (error !== undefined) reject(error);
      else resolve(photo);
    }

    cancel.onclick = () => finish(null);
    dialog.oncancel = (event) => {
      event.preventDefault();
      finish(null);
    };
    shutter.onclick = () => {
      try {
        const frame = document.createElement('canvas');
        frame.width = video.videoWidth;
        frame.height = video.videoHeight;
        const context = frame.getContext('2d');
        if (!context || !frame.width || !frame.height) throw new Error('No camera frame is available');
        context.drawImage(video, 0, 0);
        finish(frame);
      } catch (error) {
        finish(null, error);
      }
    };
    dialog.append(video, cancel, shutter);
    document.body.append(dialog);
    try {
      dialog.showModal();
      void navigator.mediaDevices
        .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
        .then(async (opened) => {
          if (finished) {
            stopMediaStream(opened);
            return;
          }
          stream = opened;
          for (const track of stream.getVideoTracks()) {
            track.addEventListener('ended', () => finish(null, new Error('The camera stopped streaming')), { once: true });
          }
          video.srcObject = stream;
          await video.play();
          if (!finished) shutter.disabled = false;
        })
        .catch((error: unknown) => finish(null, error));
    } catch (error) {
      finish(null, error);
    }
  });
}

export async function takePhoto(supplied: CameraPhotoOptions = {}): Promise<CameraPhoto | null> {
  if (!isAvailable()) throw new Error('Camera capture requires a secure browser context with camera and dialog support');
  if (busy) throw new Error('The camera is already open');
  const options = imageOptions(supplied);
  busy = true;
  try {
    const frame = await preview();
    return frame && (await preparePhoto(frame, 'camera', options));
  } finally {
    busy = false;
  }
}
