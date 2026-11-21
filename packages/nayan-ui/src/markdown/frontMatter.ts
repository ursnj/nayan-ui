export interface FrontMatter {
  data: Record<string, unknown>;
  content: string;
}

/** Read JSON frontmatter; YAML, executable tags and implicit scalar coercion are not supported. */
export function parseFrontMatter(source: string): FrontMatter {
  const text = source.replace(/^\uFEFF/, '');
  const opening = /^---[\t ]*\r?\n/.exec(text);
  if (!opening) return { data: {}, content: text };
  const remainder = text.slice(opening[0].length);
  const closing = /^---[\t ]*(?:\r?\n|$)/m.exec(remainder);
  if (!closing) throw new Error('Unclosed JSON frontmatter');
  const metadata = remainder.slice(0, closing.index).trim();
  const data: unknown = metadata ? JSON.parse(metadata) : {};
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('JSON frontmatter must be an object');
  return { data: data as Record<string, unknown>, content: remainder.slice(closing.index + closing[0].length) };
}
