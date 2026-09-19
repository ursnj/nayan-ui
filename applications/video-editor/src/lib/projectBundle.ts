import { getAssetFile, loadAsset, releaseAllReaders } from '../media/library';
import { bundleEntryFor } from '../store/editor';
import type { ProjectFile } from '../store/editor';
import type { MediaAsset } from '../types';
import { readZip, writeZip } from './zip';

/**
 * A project and its media as a single portable file.
 *
 * The alternative — a JSON file that names the media and asks you to find it
 * again — could not work here at all: every import mints a new asset id, so a
 * reopened project could never be relinked to anything. Keeping the media
 * inside the file also means a project survives being moved between machines,
 * which is the whole point of saving one.
 *
 * The container is an ordinary uncompressed zip, so it can be opened in
 * Finder or Explorer and the media pulled out by hand.
 */

export const BUNDLE_EXTENSION = 'nayanproj';
const MANIFEST = 'project.json';

export class BundleError extends Error {}

/** Packs the project and every imported file into one blob. */
export const writeBundle = async (project: ProjectFile): Promise<Blob> => {
  const entries = [{ name: MANIFEST, data: new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }) }];

  for (const ref of project.assetRefs) {
    const file = getAssetFile(ref.id);
    // An asset with no file behind it should be impossible, but writing a
    // bundle that silently omits media would be worse than saying so.
    if (!file) throw new BundleError(`"${ref.name}" is no longer available, so the project cannot be bundled.`);
    entries.push({ name: ref.entry, data: file });
  }

  return writeZip(entries);
};

export interface OpenedBundle {
  project: ProjectFile;
  assets: MediaAsset[];
  /** Media named in the manifest that the archive turned out not to contain. */
  missing: string[];
}

/**
 * Unpacks a bundle, restoring each asset under the id its clips expect.
 *
 * Media that fails to decode is reported rather than thrown on: one unreadable
 * file should cost you that clip, not the entire project.
 */
export const readBundle = async (file: Blob): Promise<OpenedBundle> => {
  const entries = await readZip(file);

  const manifest = entries.get(MANIFEST);
  if (!manifest) throw new BundleError('This file is not a Nayan UI Video Editor project — it has no project.json inside.');

  let project: ProjectFile;
  try {
    project = JSON.parse(await manifest.text()) as ProjectFile;
  } catch {
    throw new BundleError('The project inside this bundle is unreadable.');
  }
  if (project.version !== 1 || !Array.isArray(project.clips)) throw new BundleError('This bundle was written by an unrecognised version.');

  // The decoders from the previous project are keyed by its clip ids, which
  // are about to be replaced wholesale.
  await releaseAllReaders();

  const assets: MediaAsset[] = [];
  const missing: string[] = [];

  for (const ref of project.assetRefs ?? []) {
    // Fall back to the conventional path so a bundle hand-edited without the
    // `entry` field still opens.
    const data = entries.get(ref.entry) ?? entries.get(bundleEntryFor(ref.id, ref.name));
    if (!data) {
      missing.push(ref.name);
      continue;
    }
    try {
      assets.push(await loadAsset(new File([data], ref.name, { type: ref.type }), ref.id));
    } catch {
      missing.push(ref.name);
    }
  }

  return { project, assets, missing };
};
