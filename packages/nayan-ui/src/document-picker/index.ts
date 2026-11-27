import { getDocumentAsync, isAvailable, release } from './platform';

export { getDocumentAsync };
export type {
  DocumentPickerAsset,
  DocumentPickerCanceledResult,
  DocumentPickerOptions,
  DocumentPickerResult,
  DocumentPickerSuccessResult
} from './types';

export const documentPicker = { getDocumentAsync, isAvailable, release };
