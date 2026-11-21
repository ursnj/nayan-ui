import { stopMediaStream } from '../native/mediaStream.web';
import { imageOptions } from './options';
import type { CameraPermission, ImagePickerOptions, ImagePickerResult, PickedImage } from './types';
const owned = new Set<string>();
let busy = false;
type PhotoSource = ImageBitmap | HTMLImageElement | HTMLCanvasElement;
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') return createImageBitmap(file);
  const uri = URL.createObjectURL(file),
    image = new Image();
  try {
    image.src = uri;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(uri);
  }
}
function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode selected image'))), type, quality)
  );
}
async function crop(image: PhotoSource, options: ReturnType<typeof imageOptions>): Promise<HTMLCanvasElement | null> {
  return new Promise((resolve, reject) => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.createElement('dialog');
    dialog.setAttribute('aria-label', 'Crop image');
    dialog.style.cssText = 'padding:16px;border:1px solid #888;border-radius:16px;background:Canvas;color:CanvasText;max-width:calc(100vw - 32px)';
    const title = document.createElement('p');
    title.textContent = 'Drag to position. Use the slider to zoom.';
    const canvas = document.createElement('canvas');
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'Crop preview; arrow keys move the image');
    canvas.style.cssText = 'display:block;touch-action:none;max-width:100%';
    const ratio = options.aspect ? options.aspect[0] / options.aspect[1] : 1;
    const w = Math.min(480, window.innerWidth - 64, Math.max(120, window.innerHeight - 230) * ratio),
      h = w / ratio;
    canvas.width = Math.round(w);
    canvas.height = Math.round(h);
    const context = canvas.getContext('2d');
    if (!context || typeof dialog.showModal !== 'function') {
      reject(new Error('Image cropping requires canvas and dialog support'));
      return;
    }
    const drawing: CanvasRenderingContext2D = context;
    const base = Math.max(w / image.width, h / image.height);
    let scale = base,
      x = (w - image.width * scale) / 2,
      y = (h - image.height * scale) / 2,
      point: { x: number; y: number } | undefined;
    const draw = () => {
      x = Math.min(0, Math.max(w - image.width * scale, x));
      y = Math.min(0, Math.max(h - image.height * scale, y));
      drawing.clearRect(0, 0, w, h);
      drawing.drawImage(image, x, y, image.width * scale, image.height * scale);
    };
    canvas.onpointerdown = (event) => {
      point = { x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
    };
    canvas.onpointermove = (event) => {
      if (!point) return;
      x += event.clientX - point.x;
      y += event.clientY - point.y;
      point = { x: event.clientX, y: event.clientY };
      draw();
    };
    canvas.onpointerup = canvas.onpointercancel = () => {
      point = undefined;
    };
    canvas.onkeydown = (event) => {
      const moves: Record<string, [number, number]> = { ArrowLeft: [10, 0], ArrowRight: [-10, 0], ArrowUp: [0, 10], ArrowDown: [0, -10] };
      const move = moves[event.key];
      if (move) {
        event.preventDefault();
        x += move[0];
        y += move[1];
        draw();
      }
    };
    const zoom = document.createElement('input');
    zoom.type = 'range';
    zoom.min = '1';
    zoom.max = '8';
    zoom.step = '0.01';
    zoom.value = '1';
    zoom.setAttribute('aria-label', 'Image zoom');
    zoom.style.width = '100%';
    zoom.oninput = () => {
      const next = base * Number(zoom.value);
      x = w / 2 - ((w / 2 - x) * next) / scale;
      y = h / 2 - ((h / 2 - y) * next) / scale;
      scale = next;
      draw();
    };
    let finished = false;
    function finish(value: HTMLCanvasElement | null) {
      if (finished) return;
      finished = true;
      dialog.close();
      dialog.remove();
      previous?.focus();
      resolve(value);
    }
    const cancel = document.createElement('button');
    cancel.textContent = 'Cancel';
    cancel.onclick = () => finish(null);
    const use = document.createElement('button');
    use.textContent = 'Use image';
    use.style.marginLeft = '16px';
    use.onclick = () => {
      const output = document.createElement('canvas');
      const factor = Math.min(1, options.maxDimension / Math.max(w / scale, h / scale));
      output.width = Math.max(1, Math.round((w / scale) * factor));
      output.height = Math.max(1, Math.round((h / scale) * factor));
      output.getContext('2d')!.drawImage(image, -x / scale, -y / scale, w / scale, h / scale, 0, 0, output.width, output.height);
      finish(output);
    };
    dialog.oncancel = (event) => {
      event.preventDefault();
      finish(null);
    };
    dialog.append(title, canvas, zoom, cancel, use);
    document.body.append(dialog);
    dialog.showModal();
    draw();
    canvas.focus();
  });
}

/** Shared browser image encoding and ownership for the picker and camera. */
export async function preparePhoto(image: PhotoSource, name: string, options: ReturnType<typeof imageOptions>): Promise<PickedImage | null> {
  if (!(image.width > 0 && image.height > 0)) throw new Error('Selected image has invalid dimensions');
  let canvas: HTMLCanvasElement | null;
  if (options.allowsEditing) {
    canvas = await crop(image, options);
  } else {
    canvas = document.createElement('canvas');
    const scale = Math.min(1, options.maxDimension / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
  }
  if (!canvas) return null;

  const mimeType = `image/${options.format}`;
  const blob = await encode(canvas, mimeType, options.quality);
  const base64 = options.base64
    ? await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]!);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      })
    : undefined;
  const uri = URL.createObjectURL(blob);
  owned.add(uri);
  return {
    uri,
    width: canvas.width,
    height: canvas.height,
    fileName: (name.replace(/\.[^.]+$/, '') || 'image') + (options.format === 'png' ? '.png' : '.jpg'),
    mimeType,
    fileSize: blob.size,
    ...(base64 !== undefined && { base64 })
  };
}

async function choose(camera: boolean, supplied: ImagePickerOptions): Promise<ImagePickerResult> {
  const options = imageOptions(supplied);
  if (!imagePicker.isAvailable()) throw new Error('Image picking is unavailable during server rendering');
  if (busy) throw new Error('An image picker is already open');
  if (camera && options.multiple) throw new TypeError('Camera capture supports one image');
  busy = true;
  try {
    const selected = await new Promise<File[]>((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = !!options.multiple;
      if (camera) input.setAttribute('capture', 'environment');
      input.style.display = 'none';
      document.body.append(input);
      let timer: ReturnType<typeof setTimeout> | undefined,
        done = false;
      const finish = () => {
        if (done) return;
        done = true;
        if (timer) clearTimeout(timer);
        window.removeEventListener('focus', focus);
        const files = [...(input.files ?? [])];
        input.remove();
        resolve(files);
      };
      const focus = () => {
        timer = setTimeout(finish, 500);
      };
      input.onchange = input.oncancel = finish;
      window.addEventListener('focus', focus, { once: true });
      try {
        input.click();
      } catch (error) {
        window.removeEventListener('focus', focus);
        input.remove();
        reject(error);
      }
    });
    if (!selected.length) return { canceled: true, assets: null };
    if (selected.length > (options.multiple ? options.selectionLimit : 1)) throw new RangeError('Too many selected images');
    const assets: PickedImage[] = [];
    try {
      for (const file of selected) {
        if ((file.type && !file.type.startsWith('image/')) || file.size > 64 * 1024 * 1024) throw new Error('Select an image up to 64 MiB');
        const image = await decode(file);
        try {
          const asset = await preparePhoto(image, file.name, options);
          if (!asset) {
            for (const asset of assets) await imagePicker.release(asset.uri);
            return { canceled: true, assets: null };
          }
          assets.push(asset);
        } finally {
          if ('close' in image) image.close();
        }
      }
      return { canceled: false, assets };
    } catch (error) {
      for (const asset of assets) await imagePicker.release(asset.uri);
      throw error;
    }
  } finally {
    busy = false;
  }
}
export const imagePicker = {
  isAvailable: () => typeof document !== 'undefined' && typeof HTMLInputElement !== 'undefined',
  async getCameraPermission(): Promise<CameraPermission> {
    if (typeof navigator === 'undefined') return { status: 'undetermined', canAskAgain: false };
    try {
      const value = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return { status: value.state === 'prompt' ? 'undetermined' : value.state, canAskAgain: value.state !== 'denied' };
    } catch {
      return { status: 'undetermined', canAskAgain: true };
    }
  },
  async requestCameraPermission(): Promise<CameraPermission> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia)
      throw new Error('Camera permission is unavailable in this browser');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stopMediaStream(stream);
      return { status: 'granted', canAskAgain: true };
    } catch (error) {
      if (error instanceof DOMException && ['NotAllowedError', 'SecurityError'].includes(error.name)) return { status: 'denied', canAskAgain: false };
      throw error;
    }
  },
  pickFromLibrary: (options: ImagePickerOptions = {}) => choose(false, options),
  launchCamera: (options: ImagePickerOptions = {}) => choose(true, options),
  async release(uri: string): Promise<void> {
    if (owned.delete(uri)) URL.revokeObjectURL(uri);
    else if (!uri.startsWith('blob:')) throw new TypeError('Only owned image URLs can be released');
  }
};
