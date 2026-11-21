import { expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import * as engineComponents from '@nayan-ui/engine/components';
import enginePackage from '@nayan-ui/engine/package.json';
import { componentPreview } from '@/components/ui/EngineComponentDoc';
import { legacyComponentAlternatives } from '@/components/ui/previews/LegacyExamples';
import { componentReferences } from './component-reference';
import { moduleReferences } from './module-reference';

test('the reference covers the component exports and public engine entry points', () => {
  expect(Object.keys(engineComponents).sort()).toEqual(
    [...new Set(componentReferences.filter(({ module }) => module === 'components').map(({ symbol }) => symbol))].sort()
  );
  expect([...moduleReferences.map(({ entry }) => entry), '.', './components', './modules'].sort()).toEqual(Object.keys(enginePackage.exports).sort());

  const entries = [...componentReferences, ...moduleReferences];
  const paths = entries.map(({ path }) => path);
  expect(new Set(paths).size).toBe(paths.length);
  for (const path of paths.filter((path) => /^\/[^/]+$/.test(path))) {
    expect(existsSync(new URL(`../../app${path}`, import.meta.url))).toBe(false);
  }
});

test('the Code preview and its example pass the command to the engine renderer', () => {
  const preview = componentPreview('code');
  expect(preview?.render).toMatchObject({ props: { code: 'bun add @nayan-ui/engine' } });
  expect(preview?.source).toContain('code={"bun add @nayan-ui/engine"}');
});

test('each reference entry has valid example code for the built engine package', () => {
  const examples: [string, string][] = [];
  for (const { slug, symbol } of componentReferences) {
    const preview = componentPreview(slug);
    expect(preview?.render, slug).toBeTruthy();
    expect(preview?.source, slug).toContain(symbol);
    examples.push([`${slug}.tsx`, preview!.source]);
  }
  for (const [slug, alternative] of Object.entries(legacyComponentAlternatives)) {
    const preview = componentPreview(slug);
    expect(
      componentReferences.some((entry) => entry.slug === alternative),
      slug
    ).toBe(true);
    expect(preview?.render, slug).toBeTruthy();
    expect(preview?.source, slug).toContain('@nayan-ui/engine/components');
    examples.push([`legacy-${slug}.tsx`, preview!.source]);
  }
  for (const { entry, slug, code, filename } of moduleReferences) {
    if (!entry.includes('*') && entry !== './app.plugin.js') expect(code, slug).toContain(`@nayan-ui/engine/${entry.slice(2)}`);
    examples.push([filename ?? `${slug}.tsx`, code]);
  }

  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    allowJs: true,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
    types: []
  };
  const root = new URL('../../../', import.meta.url).pathname;
  const sources = new Map(examples.map(([file, code]) => [join(root, `reference-example-${file}`), code]));
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, ...args) => {
    const code = sources.get(name);
    return code === undefined ? getSourceFile(name, ...args) : ts.createSourceFile(name, code, ts.ScriptTarget.Latest, true);
  };
  const program = ts.createProgram([...sources.keys()], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  expect(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCurrentDirectory: () => root,
      getCanonicalFileName: (file) => file,
      getNewLine: () => '\n'
    })
  ).toBe('');
}, 15_000);
