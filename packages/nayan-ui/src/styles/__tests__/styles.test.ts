import { expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildStyles, compileUtilities, developStyles } from '../index';

test('engine utilities preserve responsive, state, arbitrary-value and theme classes without Tailwind', () => {
  const result = compileUtilities([
    'p-3',
    'space-y-3',
    'rounded-full',
    'list-disc',
    'sm:grid-cols-2',
    'grid-flow-col',
    'auto-cols-[100px_140px]',
    'auto-rows-fr',
    'hover:bg-accent/20',
    'min-[900px]:h-[68px]',
    'w-[calc(100%-32px)]'
  ]);
  expect(result.unsupported).toEqual([]);
  for (const value of [
    'padding:12px',
    'margin-bottom:12px',
    ':not(:last-child)',
    '9999px',
    'list-style-type:disc',
    'min-width:640px',
    'grid-auto-flow:column',
    'grid-auto-columns:100px 140px',
    'grid-auto-rows:minmax(0,1fr)',
    'min-width:900px',
    'height:68px',
    'var(--accent)',
    'calc(100%-32px)'
  ])
    expect(result.css).toContain(value);
});

test.each([[true], [false]])('the engine produces matching CSS and Rust rules with CSS lowering set to %s', async (lowerCss) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'nayan-styles-'));
  try {
    await writeFile(path.join(directory, 'package.json'), '{}');
    if (lowerCss) {
      const dependency = createRequire(import.meta.url).resolve('lightningcss');
      const packageRoot = path.resolve(path.dirname(dependency), '..');
      await mkdir(path.join(directory, 'node_modules'));
      await symlink(packageRoot, path.join(directory, 'node_modules', 'lightningcss'), 'dir');
    }
    await mkdir(path.join(directory, 'src'));
    await writeFile(
      path.join(directory, 'src/page.tsx'),
      'export const Page = () => <NView className="p-3 space-y-3 sm:grid-cols-2 hover:bg-accent/20" />;'
    );
    await writeFile(path.join(directory, 'theme.css'), ':root{--accent:#6f3ef4}.surface{border-radius:14px}');
    const options = {
      root: directory,
      source: 'theme.css',
      content: ['src'],
      output: 'public/engine/styles.json',
      cssOutput: 'src/engine.css',
      manifest: 'src/engine-styles.ts',
      lowerCss
    };
    await buildStyles(options);
    const json = await readFile(path.join(directory, options.output), 'utf8');
    const css = await readFile(path.join(directory, options.cssOutput), 'utf8');
    const manifest = await readFile(path.join(directory, options.manifest), 'utf8');
    expect(css).not.toContain('@import "tailwindcss"');
    expect(css).toMatch(/padding:\s*12px/);
    const sheet = JSON.parse(json);
    expect(
      sheet.rules.some((r: { parts: { tests: string[][] }[] }) => r.parts.some((p) => p.tests.some((t) => t[0] === 'class' && t[1] === 'p-3')))
    ).toBe(true);
    expect(sheet.rules.some((r: { media: string[] }) => r.media.some((m) => m.includes('640px')))).toBe(true);
    expect(manifest).toContain('?v=');
    await buildStyles(options);
    expect(await readFile(path.join(directory, options.output), 'utf8')).toBe(json);
    expect(await readFile(path.join(directory, options.manifest), 'utf8')).toBe(manifest);
    await expect(developStyles(options, [process.execPath, '-e', 'process.exit(0)'])).resolves.toBe(0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
