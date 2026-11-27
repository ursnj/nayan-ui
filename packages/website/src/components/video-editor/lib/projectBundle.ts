import { openZip, writeZip } from "./zip";
import { getAssetFile, loadAsset } from "../media/library";
import type { MediaAsset } from "../types";
import type { ProjectFile } from "../store/editor";

/** Extension (no dot) for a saved project — a zip of project.json plus its media. */
export const BUNDLE_EXTENSION = "nayanvid";

const PROJECT_ENTRY = "project.json";

export class BundleError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "BundleError";
  }
}

/** Bundles a project and every asset it references into one downloadable zip. */
export const writeBundle = async (data: ProjectFile): Promise<Blob> => {
  const entries = new Map([[PROJECT_ENTRY, new Blob([JSON.stringify(data)])]]);

  for (const ref of data.assetRefs) {
    const file = getAssetFile(ref.id);
    if (!file) continue; // Reconstructed on open as a "missing" asset — see readBundle.
    entries.set(ref.entry, file);
  }

  try {
    return await writeZip(entries);
  } catch (error) {
    throw new BundleError("The project could not be bundled.", { cause: error });
  }
};

export interface ReadBundleResult {
  project: ProjectFile;
  assets: MediaAsset[];
  /** Display names of referenced media that couldn't be restored. */
  missing: string[];
}

/** The reverse of `writeBundle`: unpacks a project and re-registers its media. */
export const readBundle = async (file: File): Promise<ReadBundleResult> => {
  let readEntry: Awaited<ReturnType<typeof openZip>>;
  try {
    readEntry = await openZip(file);
  } catch (error) {
    throw new BundleError("That file isn't a valid project bundle.", { cause: error });
  }

  let projectEntry: Blob | undefined;
  let data: ProjectFile | undefined;
  try {
    projectEntry = await readEntry(PROJECT_ENTRY);
    if (projectEntry) data = JSON.parse(await projectEntry.text()) as ProjectFile;
  } catch (error) {
    throw new BundleError("The project inside that file is corrupted.", { cause: error });
  }
  if (!data) throw new BundleError("That file doesn't contain a project.");

  if (data.version !== 1) {
    throw new BundleError("That project was saved by a newer, incompatible version of the editor.");
  }

  const assets: MediaAsset[] = [];
  const missing: string[] = [];

  for (const ref of data.assetRefs ?? []) {
    try {
      const blob = await readEntry(ref.entry);
      if (!blob) {
        missing.push(ref.name);
        continue;
      }
      const restored = new File([blob], ref.name, { type: ref.type });
      // Reuses the original id so clips referencing it by assetId still resolve.
      assets.push(await loadAsset(restored, ref.id));
    } catch {
      missing.push(ref.name);
    }
  }

  return { project: data, assets, missing };
};
