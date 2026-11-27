import { expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as engineComponents from 'nayan-ui/components';
import enginePackage from 'nayan-ui/package.json';
import { componentPreview } from '@/components/ui/ComponentExamples';
import { additionalExample } from '@/components/ui/previews/AdditionalExamples';
import { componentReferences, legacyComponentAlternatives } from './component-reference';
import { moduleReferences } from './module-reference';
import componentAttributes from './component-attributes.json';

test('the reference covers the component exports and public engine entry points', () => {
  expect(Object.keys(engineComponents).sort()).toEqual(
    [...new Set(componentReferences.filter(({ module }) => module === 'components').map(({ symbol }) => symbol))].sort()
  );
  expect([...moduleReferences.map(({ entry }) => entry), '.', './components', './modules'].sort()).toEqual(Object.keys(enginePackage.exports).sort());

  const entries = [...componentReferences, ...moduleReferences];
  const paths = entries.map(({ path }) => path);
  expect(new Set(paths).size).toBe(paths.length);
  expect(componentReferences.every(({ path, slug }) => path === `/components/${slug}`)).toBe(true);
  expect(moduleReferences.every(({ path, slug }) => path === `/modules/${slug}`)).toBe(true);
  const legacyEntries = entries.filter(({ slug }) => slug !== 'games');
  expect(new Set(legacyEntries.map(({ slug }) => slug)).size).toBe(legacyEntries.length);
  for (const { slug } of legacyEntries) {
    expect(existsSync(new URL(`../../app/${slug}`, import.meta.url)), slug).toBe(false);
  }
});

test('the Code preview and its example pass the command to the engine renderer', () => {
  const preview = componentPreview('code');
  expect(preview?.render).toMatchObject({ props: { code: 'bun add nayan-ui' } });
  expect(preview?.source).toContain('code={"bun add nayan-ui"}');
});

test('the Icon previews use named icons in their live views and editable examples', () => {
  const preview = componentPreview('icon');
  expect(preview?.render).toMatchObject({ props: { name: 'circle-check' } });
  for (const example of [preview, additionalExample('icon')]) {
    expect(example?.source).toContain('<NIcon name={"circle-check"}');
    expect(example?.source).not.toContain('paths=');
  }
});

test('every component reference has public attributes, methods or a hook return value', () => {
  const { attributes, components } = componentAttributes;
  expect(Object.keys(components).sort()).toEqual([...new Set(componentReferences.map(({ symbol }) => symbol))].sort());
  for (const [name, api] of Object.entries(components)) {
    const ids = [...api.props, ...api.methods, ...api.value];
    expect(ids.length, name).toBeGreaterThan(0);
    expect(ids.every((id) => attributes[id]?.type), name).toBe(true);
  }
  const imageProps = components.NImage.props.map((id) => attributes[id]?.name);
  expect(components.NButton.props.map((id) => attributes[id]?.name)).toEqual([
    'disabled', 'className', 'isOutline', 'isLoading', 'loadingText', 'leftIcon', 'rightIcon', 'children', 'onPress'
  ]);
  expect(components.NInput.props.map((id) => attributes[id]).find((prop) => prop?.name === 'type')).toMatchObject({
    type: 'string',
    required: false
  });
  expect(imageProps).toContain('fallbackSource');
  expect(imageProps).toContain('onLoad');
  expect(components.GameView.props.some((id) => attributes[id]?.name === 'source' && attributes[id]?.required)).toBe(true);
  expect(componentAttributes.native.VideoPlayer.props.some((id) =>
    attributes[id]?.name === 'source' && attributes[id]?.type.includes('number')
  )).toBe(true);
});

test('buttons and alerts render the documented content slots in browser HTML', async () => {
  const engine = new URL('../../../../nayan-ui/', import.meta.url);
  const browser = await import(new URL(enginePackage.exports['./components'].browser.default, engine).href) as typeof engineComponents;
  const render = (node: ReactElement) => renderToStaticMarkup(createElement(browser.NPlatformView, null, node));
  const pending = render(createElement(browser.NButton, { isLoading: true, loadingText: 'Saving' }, 'Save'));
  expect(pending).toContain('disabled=""');
  expect(pending).toContain('aria-busy="true"');
  expect(pending).toContain('>Saving</button>');

  const button = render(createElement(browser.NButton, {
    leftIcon: createElement('span', null, 'Before'),
    rightIcon: createElement('span', null, 'After')
  }, 'Continue'));
  expect(button).toContain('<span>Before</span>Continue<span>After</span>');

  const alert = render(createElement(browser.NAlert, {
    type: 'success',
    title: 'Saved',
    message: 'Your draft was saved.',
    onClose() {},
    actions: createElement('span', null, 'Undo'),
    titleClassName: 'custom-title'
  }));
  expect(alert).toContain('custom-title');
  expect(alert).toContain('aria-label="Dismiss saved alert"');
  expect(alert).toContain('>Undo</span>');
  expect(alert.split('Your draft was saved.')).toHaveLength(2);
});

test('each reference entry has valid example code for the built engine package', () => {
  const examples: [string, string][] = [];
  for (const { slug, symbol } of componentReferences) {
    const preview = componentPreview(slug);
    expect(preview?.render, slug).toBeTruthy();
    expect(preview?.source, slug).toContain(symbol);
    examples.push([`${slug}.tsx`, preview!.source]);
    const additional = additionalExample(slug);
    expect(additional?.render, slug).toBeTruthy();
    expect(additional?.source, slug).toContain(symbol);
    expect(additional?.source, slug).not.toBe(preview!.source);
    examples.push([`${slug}-additional.tsx`, additional!.source]);
  }
  for (const [slug, alternative] of Object.entries(legacyComponentAlternatives)) {
    const preview = componentPreview(slug);
    expect(
      componentReferences.some((entry) => entry.slug === alternative),
      slug
    ).toBe(true);
    expect(preview?.render, slug).toBeTruthy();
    expect(preview?.source, slug).toContain('nayan-ui/components');
    examples.push([`legacy-${slug}.tsx`, preview!.source]);
    const additional = additionalExample(slug);
    expect(additional?.render, slug).toBeTruthy();
    expect(additional?.source, slug).not.toBe(preview!.source);
    examples.push([`legacy-${slug}-additional.tsx`, additional!.source]);
  }
  for (const { entry, slug, code, filename, variations } of moduleReferences) {
    if (!entry.includes('*') && entry !== './app.plugin.js') expect(code, slug).toContain(`nayan-ui/${entry.slice(2)}`);
    examples.push([filename ?? `${slug}.tsx`, code]);
    expect(variations.length, slug).toBeGreaterThan(0);
    for (const [index, variation] of variations.entries()) {
      expect(variation.code, slug).not.toBe(code);
      examples.push([`${slug}-variation-${index + 1}-${variation.filename ?? 'Example.tsx'}`, variation.code]);
    }
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
