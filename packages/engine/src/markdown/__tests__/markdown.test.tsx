import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'bun:test';

const { NMarkdown } = await import('@nayan-ui/engine/markdown');

test('the shared server binding preserves semantic content and escapes raw HTML', () => {
  const markup = renderToStaticMarkup(
    NMarkdown({
      source: '## A heading\n\nA **bold** word and [link](https://example.org).\n\n<script>alert(1)</script>\n\n[unsafe](javascript:alert%281%29)'
    })
  );
  expect(markup).toContain('<h2');
  expect(markup).toContain('<strong');
  expect(markup).toContain('href="https://example.org"');
  expect(markup).toContain('&lt;script&gt;');
  expect(markup).not.toContain('<script>');
  expect(markup).not.toContain('href="javascript:');
});

test('the browser Markdown entry excludes the Rust loader, server I/O and game runtime', async () => {
  const result = await Bun.build({
    entrypoints: ['virtual:markdown'],
    target: 'browser',
    format: 'esm',
    minify: true,
    external: ['react', 'react/jsx-runtime'],
    plugins: [
      {
        name: 'markdown-consumer',
        setup(build) {
          build.onResolve({ filter: /^virtual:markdown$/ }, () => ({ path: 'entry.ts', namespace: 'markdown-test' }));
          build.onLoad({ filter: /.*/, namespace: 'markdown-test' }, () => ({
            contents: 'export { NMarkdown } from "@nayan-ui/engine/markdown";',
            loader: 'ts',
            resolveDir: import.meta.dir
          }));
        }
      }
    ]
  });
  expect(result.success).toBe(true);
  const js = await result.outputs[0]!.text();
  for (const marker of ['node:fs', 'readFileSync', 'parse_markdown', '.wasm', 'react-native', 'react-reconciler', 'class World'])
    expect(js).not.toContain(marker);
});
