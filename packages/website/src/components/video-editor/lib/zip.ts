// The editor uses ordinary ZIP files so previously saved .nayanvid projects still open.
const LOCAL = 0x04034b50;
const CENTRAL = 0x02014b50;
const END = 0x06054b50;
const MAX_UINT32 = 0xffffffff;
const UTF8 = 0x0800;
const encode = new TextEncoder();
const decode = new TextDecoder();

const crcTable = Uint32Array.from({ length: 256 }, (_, byte) => {
  for (let bit = 0; bit < 8; bit++) byte = (byte >>> 1) ^ (byte & 1 ? 0xedb88320 : 0);
  return byte;
});

async function checksum(blob: Blob): Promise<number> {
  const reader = blob.stream().getReader();
  let crc = MAX_UINT32;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return (crc ^ MAX_UINT32) >>> 0;
      for (const byte of value) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 255]!;
    }
  } finally {
    reader.releaseLock();
  }
}

function header(size: number, signature: number) {
  const bytes = new Uint8Array(size);
  const fields = new DataView(bytes.buffer);
  fields.setUint32(0, signature, true);
  return { bytes, fields };
}

/** Media is typically compressed already, so store entries directly as Blob slices. */
export async function writeZip(entries: ReadonlyMap<string, Blob>): Promise<Blob> {
  if (entries.size >= 0xffff) throw new Error('Too many project files.');
  const contents: BlobPart[] = [];
  const directory: BlobPart[] = [];
  let offset = 0;
  let directorySize = 0;
  for (const [name, blob] of entries) {
    const filename = encode.encode(name);
    if (filename.length > 0xffff || offset + 30 + filename.length + blob.size >= MAX_UINT32) {
      throw new Error('The project exceeds the ZIP size limit.');
    }
    const crc = await checksum(blob);
    const local = header(30, LOCAL);
    local.fields.setUint16(4, 20, true);
    local.fields.setUint16(6, UTF8, true);
    local.fields.setUint16(12, 0x21, true); // 1980-01-01.
    local.fields.setUint32(14, crc, true);
    local.fields.setUint32(18, blob.size, true);
    local.fields.setUint32(22, blob.size, true);
    local.fields.setUint16(26, filename.length, true);
    contents.push(local.bytes, filename, blob);

    const central = header(46, CENTRAL);
    central.bytes.set(local.bytes.subarray(4, 30), 6);
    central.fields.setUint16(4, 20, true);
    central.fields.setUint32(42, offset, true);
    directory.push(central.bytes, filename);
    directorySize += 46 + filename.length;
    offset += 30 + filename.length + blob.size;
  }
  if (offset + directorySize + 22 >= MAX_UINT32) throw new Error('The project exceeds the ZIP size limit.');
  const end = header(22, END);
  end.fields.setUint16(8, entries.size, true);
  end.fields.setUint16(10, entries.size, true);
  end.fields.setUint32(12, directorySize, true);
  end.fields.setUint32(16, offset, true);
  return new Blob([...contents, ...directory, end.bytes], { type: 'application/zip' });
}

type Entry = {
  method: number;
  crc: number;
  size: number;
  compressed: number;
  offset: number;
};

export async function openZip(file: Blob): Promise<(name: string) => Promise<Blob | undefined>> {
  const tail = new DataView(await file.slice(Math.max(0, file.size - 65557)).arrayBuffer());
  let end = tail.byteLength - 22;
  while (end >= 0 && (tail.getUint32(end, true) !== END || end + 22 + tail.getUint16(end + 20, true) !== tail.byteLength)) end--;
  if (end < 0 || tail.getUint32(end + 4, true) !== 0) throw new Error('Invalid ZIP directory.');
  const count = tail.getUint16(end + 10, true);
  const size = tail.getUint32(end + 12, true);
  const offset = tail.getUint32(end + 16, true);
  if (
    count !== tail.getUint16(end + 8, true) ||
    count === 0xffff ||
    size > count * (46 + 3 * 0xffff) ||
    offset + size > file.size - tail.byteLength + end
  ) {
    throw new Error('Invalid ZIP directory bounds.');
  }
  const directory = new DataView(await file.slice(offset, offset + size).arrayBuffer());
  const entries = new Map<string, Entry>();
  let cursor = 0;
  for (let index = 0; index < count; index++) {
    if (cursor + 46 > size || directory.getUint32(cursor, true) !== CENTRAL) throw new Error('Invalid ZIP directory entry.');
    const length = directory.getUint16(cursor + 28, true);
    const next = cursor + 46 + length + directory.getUint16(cursor + 30, true) + directory.getUint16(cursor + 32, true);
    if (next > size || directory.getUint16(cursor + 34, true) !== 0 || directory.getUint16(cursor + 8, true) & 1) {
      throw new Error('Unsupported ZIP directory entry.');
    }
    const name = decode.decode(new Uint8Array(directory.buffer, cursor + 46, length));
    if (entries.has(name)) throw new Error('Duplicate ZIP entry name.');
    entries.set(name, {
      method: directory.getUint16(cursor + 10, true),
      crc: directory.getUint32(cursor + 16, true),
      compressed: directory.getUint32(cursor + 20, true),
      size: directory.getUint32(cursor + 24, true),
      offset: directory.getUint32(cursor + 42, true)
    });
    cursor = next;
  }

  return async (name) => {
    const entry = entries.get(name);
    if (!entry) return undefined;
    if (entry.offset + 30 > offset) throw new Error('Invalid ZIP entry position.');
    const local = new DataView(await file.slice(entry.offset, entry.offset + 30).arrayBuffer());
    if (local.getUint32(0, true) !== LOCAL) throw new Error('Invalid ZIP entry header.');
    const start = entry.offset + 30 + local.getUint16(26, true) + local.getUint16(28, true);
    if (start + entry.compressed > offset) throw new Error('Truncated ZIP entry.');
    let blob = file.slice(start, start + entry.compressed);
    if (entry.method === 8) {
      // JSZip used raw DEFLATE for projects saved by earlier releases.
      const reader = blob.stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
      const parts: BlobPart[] = [];
      let length = 0;
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          length += value.byteLength;
          if (length > entry.size) {
            await reader.cancel();
            throw new Error('ZIP entry exceeds its declared size.');
          }
          parts.push(value);
        }
      } finally {
        reader.releaseLock();
      }
      blob = new Blob(parts);
    } else if (entry.method !== 0) {
      throw new Error('Unsupported ZIP compression.');
    }
    if (blob.size !== entry.size || (await checksum(blob)) !== entry.crc) throw new Error('Damaged ZIP entry.');
    return blob;
  };
}
