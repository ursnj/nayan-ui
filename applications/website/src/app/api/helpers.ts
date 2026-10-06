import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export function validateFileSize(file: File, maxBytes = MAX_FILE_SIZE): NextResponse | null {
  if (file.size > maxBytes) {
    const maxMB = (maxBytes / (1024 * 1024)).toFixed(0);
    return NextResponse.json(
      { error: `File too large. Maximum size is ${maxMB} MB.` },
      { status: 413 },
    );
  }
  return null;
}

export function validateFileSizes(files: File[], maxBytes = MAX_FILE_SIZE): NextResponse | null {
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > maxBytes) {
    const maxMB = (maxBytes / (1024 * 1024)).toFixed(0);
    return NextResponse.json(
      { error: `Total file size too large. Maximum is ${maxMB} MB.` },
      { status: 413 },
    );
  }
  return null;
}
