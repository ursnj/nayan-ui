import * as React from 'react';
import * as jsx from 'react/jsx-runtime';
import * as components from 'nayan-ui/components';

const values = { react: React, 'react/jsx-runtime': jsx, 'nayan-ui/components': components };
const loaders = {
  'nayan-ui': () => import('nayan-ui'),
  'nayan-ui/animations': () => import('nayan-ui/animations'),
  'nayan-ui/drawing': () => import('nayan-ui/drawing'),
  'nayan-ui/games': () => import('nayan-ui/games'),
  'nayan-ui/icons/catalog': () => import('nayan-ui/icons/catalog'),
  'nayan-ui/markdown': () => import('nayan-ui/markdown'),
  'nayan-ui/video': () => import('nayan-ui/video')
};

export async function exampleModules(js: string) {
  const names = new Set(Array.from(js.matchAll(/\brequire\(["']([^"']+)["']\)/g), (match) => match[1]!));
  const legacyEntries = [...names]
    .filter((name) => name === '@nayan-ui/engine' || name.startsWith('@nayan-ui/engine/'))
    .map((name) => [name, name.replace('@nayan-ui/engine', 'nayan-ui')] as const);
  for (const [, name] of legacyEntries) names.add(name);
  const imports = await Promise.all(
    Object.entries(loaders)
      .filter(([name]) => names.has(name))
      .map(async ([name, load]) => [name, await load()] as const)
  );
  const modules: Record<string, unknown> = { ...values, ...Object.fromEntries(imports) };
  for (const [legacy, name] of legacyEntries) {
    if (Object.hasOwn(modules, name)) modules[legacy] = modules[name];
  }
  return modules;
}
