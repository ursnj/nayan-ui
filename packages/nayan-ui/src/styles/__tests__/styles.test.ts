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
    'w-[calc(100%-32px)]',
    '@[600px]:w-24',
    'group-hover/tooltip:block',
    '[&>*]:max-w-full',
    'aria-expanded:text-indigo-600',
    'backdrop:bg-black/50',
    'from-indigo-500/[0.07]'
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
    'calc(100%-32px)',
    '@container (min-width:600px)',
    '.group\\/tooltip:hover',
    '>*{max-width:100%',
    '[aria-expanded=true]',
    '::backdrop',
    ' 7%,transparent)'
  ])
    expect(result.css).toContain(value);
});

test('utility recipes produce a browser manifest without CSS files and exclude browser-only rules from Rust', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'nayan-style-recipes-'));
  try {
    await writeFile(path.join(directory, 'page.tsx'), '<NView className="@[600px]:w-24 [&>*]:max-w-full" />');
    await writeFile(
      path.join(directory, 'theme.ts'),
      `export default {
        rules: [
          { selector: '.card', utilities: 'p-3 bg-surface' },
          { selector: '.card:hover', utilities: 'opacity-50', browserOnly: true }
        ],
        keyframes: { fade: { from: 'opacity-50', to: 'opacity-100' } }
      };`
    );
    const options = {
      root: directory,
      recipeFiles: ['theme.ts'],
      content: ['page.tsx'],
      output: 'styles.json',
      manifest: 'styles.ts',
      lowerCss: false
    };
    await buildStyles(options);
    const manifest = await readFile(path.join(directory, 'styles.ts'), 'utf8');
    const sheet = await readFile(path.join(directory, 'styles.json'), 'utf8');
    expect(manifest).toContain('.card{padding:12px;background-color:var(--surface);}');
    expect(manifest).toContain('.card:hover{opacity:0.5;}');
    expect(manifest).toContain('@keyframes fade{from{opacity:0.5;}to{opacity:1;}}');
    expect(manifest).toContain('@container (min-width:600px)');
    expect(sheet).toContain('["class","[&>*]:max-w-full"]');
    expect(sheet).toContain('["class","card"]');
    expect(sheet).not.toContain('["class","@[600px]:w-24"]');
    const cardRules = JSON.parse(sheet).rules.filter((rule: { parts: { tests: string[][] }[] }) =>
      rule.parts.some(({ tests }) => tests.some(([type, value]) => type === 'class' && value === 'card'))
    );
    expect(cardRules).toHaveLength(1);
    await buildStyles(options);
    expect(await readFile(path.join(directory, 'styles.ts'), 'utf8')).toBe(manifest);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
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
