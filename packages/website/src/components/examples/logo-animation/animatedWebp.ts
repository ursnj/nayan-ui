// RIFF animation container layout: https://www.rfc-editor.org/rfc/rfc9649.html
const text = new TextEncoder();
const decoder = new TextDecoder();

function chunk(name: string, parts: Uint8Array<ArrayBuffer>[]): Uint8Array<ArrayBuffer> {
  const length = parts.reduce((size, part) => size + part.byteLength, 0);
  const bytes = new Uint8Array(8 + length + (length & 1));
  bytes.set(text.encode(name));
  new DataView(bytes.buffer).setUint32(4, length, true);
  let offset = 8;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.byteLength;
  }
  return bytes;
}

function write24(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 255;
  bytes[offset + 1] = (value >> 8) & 255;
  bytes[offset + 2] = (value >> 16) & 255;
}

export async function animatedWebp(frames: Blob[], width: number, height: number, fps: number): Promise<ArrayBuffer> {
  const header = new Uint8Array(10);
  header[0] = 2; // Animation.
  write24(header, 4, width - 1);
  write24(header, 7, height - 1);
  const animation: Uint8Array<ArrayBuffer>[] = [];
  for (const [index, frame] of frames.entries()) {
    const bytes = new Uint8Array(await frame.arrayBuffer());
    if (decoder.decode(bytes.subarray(0, 4)) !== 'RIFF' || decoder.decode(bytes.subarray(8, 12)) !== 'WEBP') {
      throw new Error('Animated WebP export requires browser support for WebP encoding.');
    }
    const view = new DataView(bytes.buffer);
    const image: Uint8Array<ArrayBuffer>[] = [];
    let hasImage = false;
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const type = decoder.decode(bytes.subarray(offset, offset + 4));
      const size = view.getUint32(offset + 4, true);
      const end = offset + 8 + size + (size & 1);
      if (end > bytes.length) throw new Error('The encoded WebP frame is incomplete.');
      if (type === 'ALPH' || (type === 'VP8L' && size >= 5 && bytes[offset + 12]! & 16)) header[0] |= 16;
      if (type === 'ALPH' || type === 'VP8L' || type === 'VP8 ') image.push(bytes.subarray(offset, end));
      if (type === 'VP8L' || type === 'VP8 ') hasImage = true;
      offset = end;
    }
    if (!hasImage) throw new Error('The encoded WebP frame has no image.');
    const frameHeader = new Uint8Array(16);
    write24(frameHeader, 6, width - 1);
    write24(frameHeader, 9, height - 1);
    write24(frameHeader, 12, Math.round(((index + 1) * 1000) / fps) - Math.round((index * 1000) / fps));
    frameHeader[15] = 2; // Each captured frame replaces the previous frame.
    animation.push(chunk('ANMF', [frameHeader, ...image]));
  }
  return chunk('RIFF', [text.encode('WEBP'), chunk('VP8X', [header]), chunk('ANIM', [new Uint8Array(6)]), ...animation]).buffer;
}
