export interface TemporaryFileOptions {
  /** Display filename; a unique prefix prevents concurrent writes from colliding. */
  fileName?: string;
  /** Browser Blob content type; native consumers can infer it from the filename. */
  mimeType?: string;
}

export interface FileInfo {
  name: string;
  /** Bytes on disk. */
  size: number;
  /** Milliseconds since the Unix epoch. */
  modifiedAt: number;
}

/** A private, persistent namespace for files owned by the app. */
export interface FileDirectory {
  write(name: string, bytes: ArrayBuffer | ArrayBufferView): Promise<void>;
  writeText(name: string, text: string): Promise<void>;
  /** Undefined when a file is missing. An empty file returns a zero-length buffer. */
  read(name: string): Promise<ArrayBuffer | undefined>;
  readText(name: string): Promise<string | undefined>;
  stat(name: string): Promise<FileInfo | undefined>;
  list(): Promise<FileInfo[]>;
  /** True if a file existed and was deleted. */
  remove(name: string): Promise<boolean>;
}

export const MAX_FILE_BYTES = 64 * 1024 * 1024;
