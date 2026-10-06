declare module "pdf-lib-encrypt" {
  import type * as pdfLib from "pdf-lib";

  export function configure(lib: typeof pdfLib): void;

  export function lock(
    pdfBytes: Uint8Array,
    password: string,
    opts?: { algo?: "aes256" | "rc4"; permissions?: number },
  ): Promise<Uint8Array>;

  export function unlockInPlace(
    pdfDoc: pdfLib.PDFDocument,
    password: string,
  ): Promise<boolean>;
}
