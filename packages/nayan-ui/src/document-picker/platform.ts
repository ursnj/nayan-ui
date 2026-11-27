import { appServicesAvailable, requestAppService } from '../native/appServices';
import type { DocumentPickerOptions, DocumentPickerResult } from './types';

export async function isAvailable(): Promise<boolean> {
  if (!appServicesAvailable()) return false;
  try {
    return await requestAppService({ action: 'document.available' });
  } catch {
    return false;
  }
}

export function getDocumentAsync(options: DocumentPickerOptions = {}): Promise<DocumentPickerResult> {
  return requestAppService({ action: 'document.pick', options });
}

/** Release an app-owned cached copy. */
export async function release(uri: string): Promise<void> {
  await requestAppService({ action: 'document.release', uri });
}
