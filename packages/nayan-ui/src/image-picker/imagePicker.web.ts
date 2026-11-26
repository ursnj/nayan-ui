import colorMatrices from '../../native/image-picker/rust/color-matrices.json';
import { stopMediaStream } from '../native/mediaStream.web';
import { imageOptions } from './options';
import type { CameraPermission, ImagePickerOptions, ImagePickerResult, PickedImage } from './types';
const owned = new Set<string>();
let busy = false;
type PhotoSource = ImageBitmap | HTMLImageElement | HTMLCanvasElement;
const colorPresets = ['Original', 'Black and white', 'Sepia', 'Vivid'] as const;

function applyColor(drawing: CanvasRenderingContext2D, preset: number, brightness: number) {
  if (preset === 0 && brightness === 1) return;
  const matrix = colorMatrices[preset]!;
  const { width, height } = drawing.canvas;
  // A large export only needs one strip of pixels in JavaScript at a time.
  for (let top = 0; top < height; top += 64) {
    const pixels = drawing.getImageData(0, top, width, Math.min(64, height - top));
    const { data } = pixels;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]!,
        g = data[i + 1]!,
        b = data[i + 2]!;
      for (let channel = 0; channel < 3; channel++) {
        const offset = channel * 3;
        data[i + channel] = (matrix[offset]! * r + matrix[offset + 1]! * g + matrix[offset + 2]! * b) * brightness;
      }
    }
    drawing.putImageData(pixels, 0, top);
  }
}
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
async function editPhoto(image: PhotoSource, options: ReturnType<typeof imageOptions>): Promise<HTMLCanvasElement | null> {
  return new Promise((resolve, reject) => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.createElement('dialog');
    dialog.setAttribute('aria-label', 'Edit image');
    dialog.style.cssText =
      'padding:16px;border:1px solid #888;border-radius:16px;background:Canvas;color:CanvasText;max-width:calc(100vw - 32px);box-sizing:border-box';
    const title = document.createElement('p');
    title.textContent = 'Drag to position. Use the slider to zoom.';
    const canvas = document.createElement('canvas');
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'Crop preview; arrow keys move the image');
    canvas.style.cssText = 'display:block;touch-action:none;max-width:100%;height:auto;margin:auto';
    const ratio = options.aspect ? options.aspect[0] / options.aspect[1] : 1;
    const availableHeight = Math.min(480, Math.max(120, window.innerHeight - 320));
    canvas.width = Math.max(1, Math.round(Math.min(480, window.innerWidth - 64, availableHeight * ratio)));
    canvas.height = Math.max(1, Math.round(Math.min(availableHeight, canvas.width / ratio)));
    const { width: w, height: h } = canvas;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context || typeof dialog.showModal !== 'function') {
      reject(new Error('Image cropping requires canvas and dialog support'));
      return;
    }
    let turns = 0;
    let flipped = false;
    let preset = 0;
    let brightness = 1;
    let imageWidth = image.width;
    let imageHeight = image.height;
    let base = 1;
    let scale = 1;
    let x = 0;
    let y = 0;
    let point: { x: number; y: number } | undefined;
    const paint = (drawing: CanvasRenderingContext2D) => {
      drawing.save();
      drawing.translate(x + (imageWidth * scale) / 2, y + (imageHeight * scale) / 2);
      drawing.scale(flipped ? -1 : 1, 1);
      drawing.rotate((turns * Math.PI) / 2);
      drawing.drawImage(image, (-image.width * scale) / 2, (-image.height * scale) / 2, image.width * scale, image.height * scale);
      drawing.restore();
    };
    const draw = () => {
      x = Math.min(0, Math.max(w - imageWidth * scale, x));
      y = Math.min(0, Math.max(h - imageHeight * scale, y));
      context.clearRect(0, 0, w, h);
      paint(context);
      applyColor(context, preset, brightness);
    };
    canvas.onpointerdown = (event) => {
      point = { x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
    };
    canvas.onpointermove = (event) => {
      if (!point) return;
      const bounds = canvas.getBoundingClientRect();
      x += ((event.clientX - point.x) * w) / bounds.width;
      y += ((event.clientY - point.y) * h) / bounds.height;
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
    const resetCrop = () => {
      imageWidth = turns % 2 ? image.height : image.width;
      imageHeight = turns % 2 ? image.width : image.height;
      base = Math.max(w / imageWidth, h / imageHeight);
      scale = base;
      x = (w - imageWidth * scale) / 2;
      y = (h - imageHeight * scale) / 2;
      zoom.value = '1';
      draw();
    };
    const button = (label: string, action: () => void) => {
      const element = document.createElement('button');
      element.type = 'button';
      element.textContent = label;
      element.onclick = action;
      return element;
    };
    const tools = document.createElement('div');
    tools.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 16px';
    tools.append(
      button('Rotate right', () => {
        turns = (turns + (flipped ? 3 : 1)) % 4;
        resetCrop();
      }),
      button('Flip horizontally', () => {
        flipped = !flipped;
        x = w - x - imageWidth * scale;
        draw();
      }),
      button('Reset', () => {
        turns = 0;
        flipped = false;
        preset = filter.selectedIndex = 0;
        brightness = 1;
        brightnessSlider.value = '1';
        resetCrop();
      })
    );
    const adjustmentRow = document.createElement('div');
    adjustmentRow.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:0 0 16px';
    const filter = document.createElement('select');
    for (const label of colorPresets) {
      const option = document.createElement('option');
      option.textContent = label;
      filter.append(option);
    }
    filter.onchange = () => {
      preset = filter.selectedIndex;
      draw();
    };
    const filterLabel = document.createElement('label');
    filterLabel.append('Filter ', filter);
    const brightnessSlider = document.createElement('input');
    brightnessSlider.type = 'range';
    brightnessSlider.min = '0.5';
    brightnessSlider.max = '1.5';
    brightnessSlider.step = '0.01';
    brightnessSlider.value = '1';
    brightnessSlider.style.cssText = 'max-width:110px;vertical-align:middle';
    brightnessSlider.oninput = () => {
      brightness = Number(brightnessSlider.value);
      draw();
    };
    const brightnessLabel = document.createElement('label');
    brightnessLabel.append('Brightness ', brightnessSlider);
    adjustmentRow.append(filterLabel, brightnessLabel);
    let finished = false;
    function finish(value: HTMLCanvasElement | null, error?: Error) {
      if (finished) return;
      finished = true;
      dialog.close();
      dialog.remove();
      previous?.focus();
      if (error) reject(error);
      else resolve(value);
    }
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;justify-content:flex-end;gap:8px';
    const use = button('Use image', () => {
      const output = document.createElement('canvas');
      const factor = Math.min(1, options.maxDimension / Math.max(w / scale, h / scale));
      output.width = Math.max(1, Math.round((w / scale) * factor));
      output.height = Math.max(1, Math.round((h / scale) * factor));
      const drawing = output.getContext('2d', { willReadFrequently: preset !== 0 || brightness !== 1 });
      if (!drawing) {
        finish(null, new Error('Could not render edited image'));
        return;
      }
      try {
        drawing.scale(output.width / w, output.height / h);
        paint(drawing);
        applyColor(drawing, preset, brightness);
        finish(output);
      } catch (error) {
        finish(null, error instanceof Error ? error : new Error(String(error)));
      }
    });
    actions.append(
      button('Cancel', () => finish(null)),
      use
    );
    dialog.oncancel = (event) => {
      event.preventDefault();
      finish(null);
    };
    dialog.append(title, canvas, zoom, tools, adjustmentRow, actions);
    document.body.append(dialog);
    try {
      dialog.showModal();
      resetCrop();
      canvas.focus();
    } catch (error) {
      finish(null, error instanceof Error ? error : new Error(String(error)));
    }
  });
}

/** Shared browser image encoding and ownership for the picker and camera. */
export async function preparePhoto(image: PhotoSource, name: string, options: ReturnType<typeof imageOptions>): Promise<PickedImage | null> {
  if (!(image.width > 0 && image.height > 0)) throw new Error('Selected image has invalid dimensions');
  let canvas: HTMLCanvasElement | null;
  if (options.allowsEditing) {
    canvas = await editPhoto(image, options);
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
