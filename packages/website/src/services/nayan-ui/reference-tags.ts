import { reactNativeSidebarItems, reactSidebarItems, type SidebarItem } from '../Utils';
import { componentReferences } from './component-reference';
import { moduleReferences } from './module-reference';

export type ReferenceTag = { sku: string; text: string };

type Reference = { slug: string; path: string; title: string; description: string };

export type TaggedReference = Reference & {
  kind: 'component' | 'module';
  tags: ReferenceTag[];
  nativePath?: string;
};

const topics = [
  {
    sku: 'forms',
    text: 'Forms',
    slugs: [
      'button',
      'checkbox',
      'input',
      'input-otp',
      'number-field',
      'radio',
      'radio-group',
      'required',
      'search-field',
      'select',
      'slider',
      'switch',
      'textarea',
      'date-picker',
      'date-range-picker',
      'time-field',
      'checkbox-group',
      'switch-group',
      'keyboard',
      'use-keyboard'
    ]
  },
  {
    sku: 'actions',
    text: 'Actions',
    slugs: ['action-item', 'button', 'button-group', 'menu-item', 'press', 'toggle-button', 'toolbar', 'clipboard', 'sharing']
  },
  {
    sku: 'feedback',
    text: 'Status and Feedback',
    slugs: [
      'alert',
      'badge',
      'confirm-alert',
      'empty-state',
      'loading',
      'meter',
      'progress',
      'progress-circle',
      'skeleton',
      'skeleton-group',
      'toast',
      'toast-host',
      'haptics',
      'review'
    ]
  },
  { sku: 'overlays', text: 'Overlays', slugs: ['confirm-alert', 'dialog', 'drawer', 'menu', 'popover', 'sheet', 'tooltip', 'use-drawer'] },
  {
    sku: 'navigation',
    text: 'Navigation',
    slugs: [
      'accordion',
      'breadcrumbs',
      'carousel',
      'drawer',
      'link',
      'linkify',
      'menu',
      'menu-item',
      'pagination',
      'tabs',
      'tabs-content',
      'use-drawer'
    ]
  },
  {
    sku: 'layouts',
    text: 'Layout',
    slugs: [
      'card',
      'divider',
      'platform-view',
      'safe-area',
      'safe-area-listener',
      'safe-area-provider',
      'theme',
      'use-safe-area-frame',
      'use-safe-area-insets',
      'view'
    ]
  },
  {
    sku: 'lists-and-scrolling',
    text: 'Lists and Scrolling',
    slugs: ['carousel', 'infinite-scroll', 'list', 'list-box', 'pagination', 'refresh-control', 'scroll-shadow', 'scroll-view', 'table', 'tag-group']
  },
  { sku: 'text-content', text: 'Text and Content', slugs: ['chip', 'code', 'kbd', 'link', 'linkify', 'markdown', 'markdown-view', 'text', 'tts'] },
  {
    sku: 'visual-design',
    text: 'Visual Design',
    slugs: ['blur', 'confetti', 'drawing', 'drawing-canvas', 'pattern', 'styles', 'theme', 'use-theme']
  },
  {
    sku: 'icon-libraries',
    text: 'Icon Libraries',
    slugs: ['icon', 'icons', 'icon-catalog', 'icon-outlines', 'named-icons', 'icon-components', 'icon-paths']
  },
  { sku: 'images', text: 'Images', slugs: ['assets', 'avatar', 'avatar-group', 'camera', 'capture', 'image', 'image-picker'] },
  { sku: 'media', text: 'Media', slugs: ['audio', 'camera', 'capture', 'image-picker', 'microphone', 'tts', 'video', 'video-player'] },
  { sku: 'motion', text: 'Motion', slugs: ['animations', 'animation-view', 'carousel', 'confetti', 'loading', 'skeleton', 'skeleton-group'] },
  {
    sku: 'game-development',
    text: 'Game Development',
    slugs: ['animations', 'assets', 'audio', 'core', 'game-view', 'games', 'haptics', 'joystick', 'keep-awake', 'wasm-runtime']
  },
  {
    sku: 'device-services',
    text: 'Device Services',
    slugs: [
      'camera',
      'capture',
      'clipboard',
      'device',
      'haptics',
      'image-picker',
      'keep-awake',
      'location',
      'microphone',
      'network',
      'permissions',
      'review',
      'sharing'
    ]
  },
  { sku: 'data-storage', text: 'Data Storage', slugs: ['assets', 'files', 'network', 'sqlite', 'storage', 'uuid'] },
  {
    sku: 'platform-integration',
    text: 'Platform Integration',
    slugs: [
      'core',
      'device',
      'expo-plugin',
      'keyboard',
      'package-metadata',
      'platform-view',
      'safe-area',
      'styles',
      'theme',
      'wasm-runtime',
      'web'
    ]
  }
];

const legacyBySlug = new Map<string, SidebarItem[]>();
for (const item of [...reactSidebarItems, ...reactNativeSidebarItems]) {
  if (!item.tags?.length) continue;
  const slug = item.link.slice(item.link.lastIndexOf('/') + 1);
  const entries = legacyBySlug.get(slug) ?? [];
  entries.push(item);
  legacyBySlug.set(slug, entries);
}

function taggedReference(
  { slug, path, title, description }: Reference,
  kind: TaggedReference['kind'],
  legacy: readonly SidebarItem[] = []
): TaggedReference {
  const categoryTags = topics.filter(({ slugs }) => slugs.includes(slug)).map(({ sku, text }) => ({ sku, text }));
  const tags = [{ sku: slug, text: title }, ...categoryTags, ...legacy.flatMap(({ tags }) => tags ?? [])];
  return {
    slug,
    path,
    title,
    description,
    kind,
    tags: [...new Map(tags.map((tag) => [tag.sku, tag])).values()]
  };
}

const currentSlugs = new Set<string>(componentReferences.map(({ slug }) => slug));

export const taggedComponents = [
  ...componentReferences.map((entry) => taggedReference(entry, 'component', legacyBySlug.get(entry.slug))),
  ...[...legacyBySlug]
    .filter(([slug]) => !currentSlugs.has(slug))
    .map(([slug, items]) => {
      const [first, second] = items;
      return {
        ...taggedReference({ slug, path: first.link, title: first.title, description: first.description }, 'component', items),
        nativePath: second?.link
      };
    })
].sort((first, second) => first.title.localeCompare(second.title));

export const taggedModules = moduleReferences.map((entry) => taggedReference(entry, 'module'));

const referencesByPath = new Map<string, TaggedReference>();
const tagsBySku = new Map<string, ReferenceTag & { entries: TaggedReference[] }>();

for (const entry of [...taggedComponents, ...taggedModules]) {
  referencesByPath.set(entry.path, entry);
  if (entry.kind === 'component') {
    for (const legacy of legacyBySlug.get(entry.slug) ?? []) referencesByPath.set(legacy.link, entry);
  }
  for (const tag of entry.tags) {
    const existing = tagsBySku.get(tag.sku);
    if (existing) existing.entries.push(entry);
    else tagsBySku.set(tag.sku, { ...tag, entries: [entry] });
  }
}

export const referenceTopics = topics.map(({ sku, text }) => ({ sku, text }));
export const referenceTags = [...tagsBySku.values()];
export const findReferenceTag = (sku: string) => tagsBySku.get(sku);
export const tagsForReference = (path: string) => referencesByPath.get(path)?.tags ?? [];
