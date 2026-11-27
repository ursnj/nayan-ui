import { expect, test } from 'bun:test';
import { parseFrontMatter } from '../frontMatter';

test('JSON frontmatter retains structured metadata and the exact Markdown body', () => {
  const data = { title: 'A "quoted" title: 🌏', keywords: ['games', 'offline'], faqs: [{ question: 'Why?', answer: 'First\nSecond' }] };
  const content = '\n## Heading\n\nBody with --- inside.\n';
  expect(parseFrontMatter(`---\n${JSON.stringify(data, null, 2)}\n---\n${content}`)).toEqual({ data, content });
  expect(parseFrontMatter(`\uFEFF---\r\n${JSON.stringify(data)}\r\n---\r\n${content}`)).toEqual({ data, content });
});

test('plain Markdown and empty metadata are supported without modifying content', () => {
  const content = '# Heading\n\n---\nBody';
  expect(parseFrontMatter(content)).toEqual({ data: {}, content });
  expect(parseFrontMatter('---\n\n---\nBody')).toEqual({ data: {}, content: 'Body' });
  expect(parseFrontMatter('')).toEqual({ data: {}, content: '' });
});

test('invalid, unclosed and non-object metadata fail explicitly', () => {
  for (const metadata of ['null', '[]', '12', '"title"']) expect(() => parseFrontMatter(`---\n${metadata}\n---\nBody`)).toThrow('object');
  expect(() => parseFrontMatter('---\n{"title":')).toThrow('Unclosed');
  expect(() => parseFrontMatter('---\ntitle: YAML is unsupported\n---\nBody')).toThrow();
});
