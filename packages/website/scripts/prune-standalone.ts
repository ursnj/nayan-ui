import { readdir, rm } from 'node:fs/promises';

// Next traces its optional image optimizer even with images.unoptimized enabled.
const modules = new URL('../.next/standalone/node_modules/', import.meta.url);
const images = new URL('@img/', modules);
const nativePackages = await readdir(images).catch((error: NodeJS.ErrnoException) => {
  if (error.code === 'ENOENT') return [];
  throw error;
});
await Promise.all([
  rm(new URL('sharp/', modules), { recursive: true, force: true }),
  ...nativePackages.filter((name) => name.startsWith('sharp-')).map((name) => rm(new URL(name, images), { recursive: true, force: true }))
]);
