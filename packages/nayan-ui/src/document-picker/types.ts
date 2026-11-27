export interface DocumentPickerOptions {
  /** MIME types such as application/pdf or image/*. Defaults to accepting every file type. */
  type?: string | readonly string[];
  multiple?: boolean;
  /** Copy into app-owned cache on iOS and Android. Defaults to true. */
  copyToCacheDirectory?: boolean;
  /** Include a data URL alongside the browser file and blob URI. Defaults to false. */
  base64?: boolean;
}

export interface DocumentPickerAsset {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
  lastModified: number;
  file?: File;
  base64?: string;
}

export interface DocumentPickerSuccessResult {
  canceled: false;
  assets: DocumentPickerAsset[];
  output?: FileList;
}

export interface DocumentPickerCanceledResult {
  canceled: true;
  assets: null;
  output?: null;
}

export type DocumentPickerResult = DocumentPickerSuccessResult | DocumentPickerCanceledResult;
