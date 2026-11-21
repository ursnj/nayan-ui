import { crc32, deflateSync } from 'node:zlib';

function chunk(name: string, data: Uint8Array): Buffer {
  const result = Buffer.alloc(data.byteLength + 12);
  result.writeUInt32BE(data.byteLength, 0);
  result.write(name, 4, 'ascii');
  result.set(data, 8);
  result.writeUInt32BE(crc32(result.subarray(4, 8 + data.byteLength)), 8 + data.byteLength);
  return result;
}

function paeth(left: number, above: number, corner: number): number {
  const estimate = left + above - corner;
  const dl = Math.abs(estimate - left);
  const da = Math.abs(estimate - above);
  const dc = Math.abs(estimate - corner);
  return dl <= da && dl <= dc ? left : da <= dc ? above : corner;
}

const predictors = [() => 0, (left: number) => left, (_left: number, up: number) => up, (left: number, up: number) => (left + up) >> 1, paeth];

/** Re-encode an opaque RGBA banner as RGB PNG using adaptive scanline filters. */
export function compactPng(pixels: Uint8ClampedArray, width: number, height: number): Buffer | undefined {
  const stride = width * 3;
  const rgb = new Uint8Array(stride * height);
  for (let pixel = 0, channel = 0; pixel < pixels.length; pixel += 4) {
    if (pixels[pixel + 3] !== 255) return undefined;
    rgb[channel++] = pixels[pixel]!;
    rgb[channel++] = pixels[pixel + 1]!;
    rgb[channel++] = pixels[pixel + 2]!;
  }

  const filtered = new Uint8Array((stride + 1) * height);
  const candidate = new Uint8Array(stride);
  for (let row = 0; row < height; row++) {
    const start = row * stride;
    const destination = row * (stride + 1);
    let best = Infinity;
    for (const [filter, predict] of predictors.entries()) {
      let score = 0;
      for (let x = 0; x < stride; x++) {
        const offset = start + x;
        const left = x >= 3 ? rgb[offset - 3]! : 0;
        const up = row ? rgb[offset - stride]! : 0;
        const corner = row && x >= 3 ? rgb[offset - stride - 3]! : 0;
        const sample = (rgb[offset]! - predict(left, up, corner)) & 255;
        candidate[x] = sample;
        score += Math.min(sample, 256 - sample);
      }
      if (score < best) {
        best = score;
        filtered[destination] = filter;
        filtered.set(candidate, destination + 1);
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Eight bits per channel.
  ihdr[9] = 2; // RGB without alpha.
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(filtered, { level: 9 })),
    chunk('IEND', new Uint8Array())
  ]);
}
