/**
 * A minimal ZIP reader and writer, store-only.
 *
 * Written by hand rather than pulled in as a dependency because the job is
 * narrow: bundle a project file with its media and read it back. Nothing is
 * compressed, which is the right call rather than a shortcut — video, audio
 * and images are already compressed, so deflating them costs seconds of CPU
 * to save fractions of a percent.
 *
 * Both directions work in terms of `Blob` slices rather than byte arrays, so
 * bundling or opening a multi-gigabyte project never holds the media in JS
 * memory. The browser keeps it on disk and only streams what is asked for.
 */

/* ------------------------------------------------------------------ *
 * CRC-32
 * ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index++) {
    let value = index;
    for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[index] = value >>> 0;
  }
  return table;
})();

const crcUpdate = (crc: number, bytes: Uint8Array) => {
  let value = crc;
  for (const byte of bytes) value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  return value >>> 0;
};

/** Streams the blob so a large file is never materialised just to be checksummed. */
const crc32OfBlob = async (blob: Blob): Promise<number> => {
  const reader = blob.stream().getReader();
  let crc = 0xffffffff;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    crc = crcUpdate(crc, value);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

/* ------------------------------------------------------------------ *
 * Shared
 * ------------------------------------------------------------------ */

export interface ZipEntry {
  name: string;
  data: Blob;
}

/** ZIP without the zip64 extensions tops out here, per field. */
const MAX_SIZE = 0xffffffff;

const LOCAL_SIG = 0x04034b50;
const CENTRAL_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;
/** UTF-8 filenames. Anything else mangles non-ASCII media names. */
const FLAG_UTF8 = 0x0800;

export class ZipError extends Error {}

/* ------------------------------------------------------------------ *
 * Writing
 * ------------------------------------------------------------------ */

/**
 * Builds a ZIP from the given entries.
 *
 * Every entry is checksummed by streaming, then the archive is assembled from
 * header byte arrays interleaved with the *original* blobs — so the media is
 * referenced, never copied.
 */
export const writeZip = async (entries: ZipEntry[]): Promise<Blob> => {
  const encoder = new TextEncoder();
  const parts: BlobPart[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const size = entry.data.size;
    if (size > MAX_SIZE)
      throw new ZipError(
        `${entry.name} is larger than 4GB, which this archive format cannot hold.`,
      );

    const crc = await crc32OfBlob(entry.data);

    const local = new Uint8Array(30 + name.length);
    const view = new DataView(local.buffer);
    view.setUint32(0, LOCAL_SIG, true);
    view.setUint16(4, 20, true); // version needed
    view.setUint16(6, FLAG_UTF8, true);
    view.setUint16(8, 0, true); // stored
    view.setUint16(10, 0, true); // mod time
    view.setUint16(12, 0, true); // mod date
    view.setUint32(14, crc, true);
    view.setUint32(18, size, true); // compressed
    view.setUint32(22, size, true); // uncompressed
    view.setUint16(26, name.length, true);
    view.setUint16(28, 0, true); // extra
    local.set(name, 30);

    parts.push(local.buffer as ArrayBuffer, entry.data);

    const record = new Uint8Array(46 + name.length);
    const recordView = new DataView(record.buffer);
    recordView.setUint32(0, CENTRAL_SIG, true);
    recordView.setUint16(4, 20, true); // version made by
    recordView.setUint16(6, 20, true); // version needed
    recordView.setUint16(8, FLAG_UTF8, true);
    recordView.setUint16(10, 0, true); // stored
    recordView.setUint16(12, 0, true);
    recordView.setUint16(14, 0, true);
    recordView.setUint32(16, crc, true);
    recordView.setUint32(20, size, true);
    recordView.setUint32(24, size, true);
    recordView.setUint16(28, name.length, true);
    recordView.setUint16(30, 0, true); // extra
    recordView.setUint16(32, 0, true); // comment
    recordView.setUint16(34, 0, true); // disk
    recordView.setUint16(36, 0, true); // internal attrs
    recordView.setUint32(38, 0, true); // external attrs
    recordView.setUint32(42, offset, true);
    record.set(name, 46);
    central.push(record);

    offset += local.length + size;
    if (offset > MAX_SIZE)
      throw new ZipError("The project is larger than 4GB, which this archive format cannot hold.");
  }

  const centralSize = central.reduce((total, record) => total + record.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, EOCD_SIG, true);
  endView.setUint16(4, 0, true); // this disk
  endView.setUint16(6, 0, true); // disk with central directory
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true); // comment

  return new Blob(
    [...parts, ...central.map((record) => record.buffer as ArrayBuffer), end.buffer as ArrayBuffer],
    { type: "application/zip" },
  );
};

/* ------------------------------------------------------------------ *
 * Reading
 * ------------------------------------------------------------------ */

const bytesOf = async (blob: Blob) => new Uint8Array(await blob.arrayBuffer());

/**
 * Reads the central directory and returns each entry as a slice of the source.
 *
 * The slices are lazy: nothing is read off disk until something asks a blob
 * for its contents, so opening a large bundle costs only the directory.
 */
export const readZip = async (file: Blob): Promise<Map<string, Blob>> => {
  // The end record is last, but a trailing comment can push it back; 64KB is
  // the most a comment can be, so that bounds the search.
  const tailSize = Math.min(file.size, 0xffff + 22);
  const tail = await bytesOf(file.slice(file.size - tailSize));
  const tailView = new DataView(tail.buffer);

  let eocd = -1;
  for (let index = tail.length - 22; index >= 0; index--) {
    if (tailView.getUint32(index, true) === EOCD_SIG) {
      eocd = index;
      break;
    }
  }
  if (eocd < 0)
    throw new ZipError("This file is not a project bundle — no archive directory was found.");

  const count = tailView.getUint16(eocd + 10, true);
  const centralSize = tailView.getUint32(eocd + 12, true);
  const centralOffset = tailView.getUint32(eocd + 16, true);

  const central = await bytesOf(file.slice(centralOffset, centralOffset + centralSize));
  const centralView = new DataView(central.buffer);
  const decoder = new TextDecoder();
  const entries = new Map<string, Blob>();

  let cursor = 0;
  for (let index = 0; index < count; index++) {
    if (centralView.getUint32(cursor, true) !== CENTRAL_SIG)
      throw new ZipError("The project bundle is damaged — its directory is unreadable.");

    const method = centralView.getUint16(cursor + 10, true);
    const size = centralView.getUint32(cursor + 24, true);
    const nameLength = centralView.getUint16(cursor + 28, true);
    const extraLength = centralView.getUint16(cursor + 30, true);
    const commentLength = centralView.getUint16(cursor + 32, true);
    const localOffset = centralView.getUint32(cursor + 42, true);
    const name = decoder.decode(central.subarray(cursor + 46, cursor + 46 + nameLength));

    if (method !== 0)
      throw new ZipError(`"${name}" is compressed, and this reader only handles stored entries.`);

    // The local header repeats the name and may carry a different amount of
    // extra data, so the payload offset has to come from the local header
    // rather than being assumed from the central one.
    const localHeader = await bytesOf(file.slice(localOffset, localOffset + 30));
    const localView = new DataView(localHeader.buffer);
    if (localView.getUint32(0, true) !== LOCAL_SIG)
      throw new ZipError(`The entry "${name}" is damaged.`);
    const dataStart =
      localOffset + 30 + localView.getUint16(26, true) + localView.getUint16(28, true);

    entries.set(name, file.slice(dataStart, dataStart + size));
    cursor += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
};
