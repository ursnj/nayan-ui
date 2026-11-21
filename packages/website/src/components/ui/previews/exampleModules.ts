import * as React from 'react';
import * as jsx from 'react/jsx-runtime';
import * as components from '@nayan-ui/engine/components';

const values = { react: React, 'react/jsx-runtime': jsx, '@nayan-ui/engine/components': components };
const loaders = {
  '@nayan-ui/engine': () => import('@nayan-ui/engine'),
  '@nayan-ui/engine/animations': () => import('@nayan-ui/engine/animations'),
  '@nayan-ui/engine/drawing': () => import('@nayan-ui/engine/drawing'),
  '@nayan-ui/engine/games': () => import('@nayan-ui/engine/games'),
  '@nayan-ui/engine/icons/catalog': () => import('@nayan-ui/engine/icons/catalog'),
  '@nayan-ui/engine/markdown': () => import('@nayan-ui/engine/markdown'),
  '@nayan-ui/engine/video': () => import('@nayan-ui/engine/video')
};

export async function exampleModules(js: string) {
  const names = new Set(Array.from(js.matchAll(/\brequire\(["']([^"']+)["']\)/g), (match) => match[1]!));
  const imports = await Promise.all(
    Object.entries(loaders)
      .filter(([name]) => names.has(name))
      .map(async ([name, load]) => [name, await load()] as const)
  );
  return { ...values, ...Object.fromEntries(imports) };
}
