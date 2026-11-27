import { toolsSidebarItems, type SidebarItem } from './Utils';

const definitions = [
  {
    id: 'seo-tools',
    title: 'SEO Tools',
    description: 'Generate and validate sitemaps, test robots.txt, and check search and social metadata before publishing.',
    workflow: [
      { slug: 'sitemap-generator', text: 'Start with the canonical pages you want search engines to discover.' },
      { slug: 'sitemap-validator', text: 'Check the XML structure and listed URLs before submitting your sitemap.' },
      { slug: 'robots-validator', text: 'Check crawl rules against the URL paths you want crawlers to reach.' }
    ]
  },
  {
    id: 'ai-tools',
    title: 'AI Tools',
    description: 'Find command-line guides for reviewing pull requests and checking dependencies with the Nayan AI CLI.',
    workflow: [
      { slug: 'ai-code-reviewer', text: 'Review changes in a pull request and inspect the findings alongside the diff.' },
      { slug: 'ai-code-scanner', text: 'Check dependency findings separately so you can review proposed updates before merging.' }
    ]
  },
  {
    id: 'image-tools',
    title: 'Image Tools',
    description: 'Prepare images for the web with guides for cropping, resizing, compressing, and converting files.',
    workflow: [
      { slug: 'crop-image', text: 'Choose an aspect ratio that fits the intended placement.' },
      { slug: 'resize-image', text: 'Set pixel dimensions for the displayed slot and target screen density.' },
      { slug: 'compress-image', text: 'Check the result at its display size and compare the file size with the original.' }
    ]
  },
  {
    id: 'pdf-tools',
    title: 'PDF Tools',
    description: 'Find PDF guides for merging, splitting, compressing, extracting text, and converting documents.',
    workflow: [
      { slug: 'pdf-info', text: 'Check the document’s page count and metadata before processing it.' },
      { slug: 'organize-pdf', text: 'Review page order and remove pages you do not need before sharing.' },
      { slug: 'compress-pdf', text: 'Compare the output size and verify that text and images remain readable.' }
    ]
  },
  {
    id: 'json-tools',
    title: 'JSON Tools',
    description: 'Format and validate JSON, inspect nested values, and convert JSON to CSV, YAML, XML, or TypeScript.',
    workflow: [
      { slug: 'json-validator', text: 'Check syntax before comparing, converting, or formatting an API response.' },
      { slug: 'json-schema-validator', text: 'Check required fields and data types against an expected schema.' },
      { slug: 'json-diff', text: 'Compare two responses to find fields that changed or disappeared.' }
    ]
  },
  {
    id: 'xml-tools',
    title: 'XML Tools',
    description: 'Validate, format, and query XML and convert XML data to JSON, CSV, YAML, or spreadsheets.',
    workflow: [
      { slug: 'xml-validator', text: 'Check that the document is well formed before processing it.' },
      { slug: 'xpath-tester', text: 'Select the nodes you need and check the result, especially when namespaces are involved.' },
      { slug: 'xml-to-csv', text: 'Choose repeating elements for rows and check how nested values are represented.' }
    ]
  },
  {
    id: 'text-tools',
    title: 'Text Tools',
    description: 'Compare, count, sort, and transform text with guides for regular expressions, Markdown, and encoding.',
    workflow: [
      { slug: 'text-compare', text: 'Check the difference between the original and edited text.' },
      { slug: 'regex-tester', text: 'Try your pattern on representative matches and nonmatches before applying it.' },
      { slug: 'find-and-replace', text: 'Review the affected text and keep a copy of the original before bulk edits.' }
    ]
  },
  {
    id: 'developer-tools',
    title: 'Developer Tools',
    description: 'Look up common developer utilities for UUIDs, timestamps, JWT decoding, cron, and web assets.',
    workflow: [
      { slug: 'timestamp-converter', text: 'Check whether an API uses seconds or milliseconds, then confirm the timezone.' },
      { slug: 'jwt-decoder', text: 'Inspect a test token’s header and claims. Signature verification belongs in your application.' },
      { slug: 'cron-expression-parser', text: 'Review the interpreted schedule before configuring a recurring job.' }
    ]
  }
] as const;

const itemsByHeading = new Map<string, SidebarItem[]>();
let current: SidebarItem[] | undefined;
for (const item of toolsSidebarItems) {
  if ('isHeading' in item && item.isHeading) {
    current = [];
    itemsByHeading.set(item.title, current);
  } else if (item.link && 'tags' in item) {
    current?.push(item);
  }
}

export const toolTopics = definitions.map((topic) => ({
  ...topic,
  path: `/tools/topics/${topic.id}`,
  tools: itemsByHeading.get(topic.title) ?? []
}));

export const findToolTopic = (id: string) => toolTopics.find((topic) => topic.id === id);

const topicByTags = new Map<ReadonlyArray<{ sku: string; text: string }>, (typeof toolTopics)[number]>();
for (const topic of toolTopics) {
  for (const { tags } of topic.tools) {
    if (tags) topicByTags.set(tags, topic);
  }
}

export const toolTopicForTags = (tags: ReadonlyArray<{ sku: string; text: string }>) => topicByTags.get(tags);
