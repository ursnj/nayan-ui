export interface ImagePickerOptions {
  /** Open the editor to crop, rotate, flip, apply a filter or adjust brightness. */
  allowsEditing?: boolean;
  /** Crop ratio; defaults to square. Editing supports a single image. */
  aspect?: readonly [number, number];
  quality?: number;
  format?: 'jpeg' | 'png';
  /** Maximum decoded/output dimension; default 4096, maximum 8192. */
  maxDimension?: number;
  multiple?: boolean;
  selectionLimit?: number;
  base64?: boolean;
}
export interface PickedImage {
  uri: string;
  width: number;
  height: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
  base64?: string;
}
export type ImagePickerResult = { canceled: true; assets: null } | { canceled: false; assets: PickedImage[] };
export interface CameraPermission {
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain: boolean;
}
