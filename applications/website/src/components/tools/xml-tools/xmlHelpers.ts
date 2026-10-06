/** Parse an XML string using the browser's DOMParser. Returns the document or throws. */
export const parseXml = (input: string): Document => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, "application/xml");
  const err = doc.querySelector("parsererror");
  if (err) throw new Error(err.textContent?.replace(/\n/g, " ").trim() || "Invalid XML");
  return doc;
};

/** Escape special XML characters. */
export const escXml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Convert an XML element tree to a plain JS object (recursive). Attributes become `@name` keys. */
export const xmlToObject = (node: Element): any => {
  const children = Array.from(node.children);
  const attributes = Array.from(node.attributes);

  if (children.length === 0) {
    const text = node.textContent || "";
    if (attributes.length === 0) return text;
    const leaf: Record<string, any> = {};
    for (const attr of attributes) leaf[`@${attr.name}`] = attr.value;
    if (text) leaf["#text"] = text;
    return leaf;
  }

  const tagCounts: Record<string, number> = {};
  for (const child of children) {
    tagCounts[child.tagName] = (tagCounts[child.tagName] || 0) + 1;
  }
  const result: Record<string, any> = {};
  for (const attr of attributes) result[`@${attr.name}`] = attr.value;
  for (const child of children) {
    const val = xmlToObject(child);
    if (tagCounts[child.tagName] > 1) {
      if (!result[child.tagName]) result[child.tagName] = [];
      result[child.tagName].push(val);
    } else {
      result[child.tagName] = val;
    }
  }
  return result;
};

/** Serialize an XML document back to a formatted string. */
export const serializeXml = (doc: Document): string => {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
};

/**
 * Replace CDATA sections with placeholders so formatting/minifying never rewrites their
 * literal contents, and return a function that restores the originals afterwards.
 */
const protectCdata = (xml: string): { protected: string; restore: (s: string) => string } => {
  const sections: string[] = [];
  const marker = (i: number) => `\u0000CDATA${i}\u0000`;
  const protectedXml = xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, (match) => {
    sections.push(match);
    return marker(sections.length - 1);
  });
  return {
    protected: protectedXml,
    restore: (s: string) => s.replace(/\u0000CDATA(\d+)\u0000/g, (_, i) => sections[Number(i)]),
  };
};

/** Format XML with indentation. */
export const formatXml = (xml: string, indent: number): string => {
  const PADDING = " ".repeat(indent);
  const { protected: guarded, restore } = protectCdata(xml);
  let formatted = "";
  let depth = 0;
  const lines = guarded
    .replace(/(>)\s*(<)/g, "$1\n$2")
    .split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("</")) {
      depth--;
    }
    formatted += PADDING.repeat(Math.max(depth, 0)) + line + "\n";

    if (line.startsWith("<") && !line.startsWith("</") && !line.startsWith("<?") && !line.endsWith("/>") && !/<\/[^>]+>$/.test(line)) {
      depth++;
    }
  }

  return restore(formatted.trimEnd());
};

/** Minify XML by removing whitespace-only text between tags, without touching attribute or text content. */
export const minifyXml = (xml: string): string => {
  const { protected: guarded, restore } = protectCdata(xml);
  return restore(guarded.replace(/>\s+</g, "><").trim());
};

/** Sanitize an arbitrary string into a valid XML tag name. */
export const sanitizeXmlTag = (name: string): string => {
  const cleaned = name.replace(/[^a-zA-Z0-9_-]/g, "_");
  return /^[0-9]/.test(cleaned) || cleaned === "" ? `_${cleaned}` : cleaned;
};

/**
 * Serialize a plain JS value (object/array/primitive) to an XML fragment under `tag`.
 * Array values are rendered as repeated sibling elements named after their parent key.
 */
export const objectToXml = (data: any, tag: string, indent = ""): string => {
  const safeTag = sanitizeXmlTag(tag);
  if (data === null || data === undefined) return `${indent}<${safeTag} />`;
  if (typeof data !== "object") {
    const text = String(data);
    return text === "" ? `${indent}<${safeTag} />` : `${indent}<${safeTag}>${escXml(text)}</${safeTag}>`;
  }
  if (Array.isArray(data)) {
    if (data.length === 0) return `${indent}<${safeTag} />`;
    return data.map((item) => objectToXml(item, tag, indent)).join("\n");
  }
  const entries = Object.entries(data);
  if (entries.length === 0) return `${indent}<${safeTag} />`;
  const children = entries
    .map(([key, val]) =>
      Array.isArray(val)
        ? val.map((item) => objectToXml(item, key, indent + "  ")).join("\n")
        : objectToXml(val, key, indent + "  "),
    )
    .join("\n");
  return `${indent}<${safeTag}>\n${children}\n${indent}</${safeTag}>`;
};

/** Serialize a root JS value to a complete XML document, wrapping top-level arrays in `rootTag` with `<item>` children. */
export const objectToXmlDocument = (data: any, rootTag: string): string => {
  const safeRoot = sanitizeXmlTag(rootTag);
  if (Array.isArray(data)) {
    const children = data.map((item) => objectToXml(item, "item", "  ")).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<${safeRoot}>\n${children}\n</${safeRoot}>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${objectToXml(data, rootTag, "")}`;
};
