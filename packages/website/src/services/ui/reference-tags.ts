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
    description: 'Build React and React Native forms with text inputs, date pickers, validation controls, and keyboard handling.',
    guide:
      'Use NInput or NTextarea for free-form text, NSelect for a fixed set of options, and NDatePicker for dates. Use NRequired for the visible required indicator and keep validation rules in your application.',
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
    description: 'Find buttons, press handlers, and action controls for React and React Native.',
    guide:
      'Use NButton for a labeled command, NPress for a custom touch target, and NToggleButton for an action with a persistent pressed state. Use NButtonGroup when several labeled actions belong together.',
    slugs: ['action-item', 'button', 'button-group', 'menu-item', 'press', 'toggle-button', 'toolbar', 'clipboard', 'sharing']
  },
  {
    sku: 'feedback',
    text: 'Status and Feedback',
    description: 'Choose a loading indicator, status badge, alert, progress bar, or toast for your app.',
    guide:
      'Use a skeleton when you know the shape of loading content. Use a progress bar for measurable work and an alert when the message needs to stay visible beside the affected content.',
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
  {
    sku: 'overlays',
    text: 'Overlays',
    description: 'Choose between dialogs, sheets, menus, popovers, and tooltips with React and React Native examples.',
    guide:
      'Use a dialog for a decision that blocks the current task, a sheet for more room on mobile, and a popover for anchored content. Give icon-only triggers accessible labels.',
    slugs: ['confirm-alert', 'dialog', 'drawer', 'menu', 'popover', 'sheet', 'tooltip', 'use-drawer']
  },
  {
    sku: 'navigation',
    text: 'Navigation',
    description: 'Browse tabs, drawers, breadcrumbs, and links for organizing screens and related content.',
    guide:
      'Use tabs for sibling views, a drawer for destinations across the app, and breadcrumbs to show where a page sits in a hierarchy. Use links for destinations users can open directly.',
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
    description: 'Lay out cross-platform screens with containers, themed pages, safe areas, and native view interop.',
    guide:
      'Start with NTheme and NPage for a screen, then use NView to group and arrange the content. Use NPlatformView when a child needs the platform renderer.',
    slugs: [
      'card',
      'divider',
      'page',
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
    description: 'Find list, pagination, refresh, table, and scroll components for React and React Native.',
    guide:
      'Use NList for a long collection with stable item keys. Use NScrollView for a small set of mixed children and add refresh or pagination when the data source supports it.',
    slugs: ['carousel', 'infinite-scroll', 'list', 'list-box', 'pagination', 'refresh-control', 'scroll-shadow', 'scroll-view', 'table', 'tag-group']
  },
  {
    sku: 'text-content',
    text: 'Text and Content',
    description: 'Render text, code, keyboard shortcuts, links, and Markdown in Nayan UI.',
    guide:
      'Use NText for ordinary copy, NCode for code fragments, and NMarkdown for Markdown documents. Use linkification when URLs in plain text should become actionable links.',
    slugs: ['chip', 'code', 'kbd', 'link', 'linkify', 'markdown', 'markdown-view', 'text', 'tts']
  },
  {
    sku: 'visual-design',
    text: 'Visual Design',
    description: 'Explore shared themes, patterns, blur, and canvas drawing for cross-platform interfaces.',
    guide:
      'Set shared colors and tokens in NTheme before styling individual controls. Use NPattern for repeated decoration and DrawingCanvas when users need to draw or edit artwork.',
    slugs: ['blur', 'confetti', 'drawing', 'drawing-canvas', 'pattern', 'styles', 'theme', 'use-theme']
  },
  {
    sku: 'icon-libraries',
    text: 'Icon Libraries',
    description: 'Find named Lucide icon imports, custom icon paths, and icon catalogs for Nayan UI.',
    guide:
      'Import a named icon when you know the symbol at build time. Use the catalog for runtime icon lookup and the path entry point when you need raw geometry.',
    slugs: ['icon', 'icons', 'icon-catalog', 'icon-outlines', 'named-icons', 'icon-components', 'icon-paths']
  },
  {
    sku: 'images',
    text: 'Images',
    description: 'Display, select, capture, and edit images in React and React Native apps.',
    guide:
      'Use NImage for display, imagePicker for library selection or editing, and camera for a capture flow. Release temporary captures and picked images after upload.',
    slugs: ['assets', 'avatar', 'avatar-group', 'camera', 'capture', 'image', 'image-picker']
  },
  {
    sku: 'media',
    text: 'Media',
    description: 'Find APIs for audio playback, recording, text-to-speech, cameras, and video.',
    guide:
      'Use the audio module for playback, microphone for recording, and VideoPlayer for video. Request camera or microphone access at the point where the user starts capture.',
    slugs: ['audio', 'camera', 'capture', 'image-picker', 'microphone', 'tts', 'video', 'video-player']
  },
  {
    sku: 'motion',
    text: 'Motion',
    description: 'Browse entrance and playback animations, carousels, loading effects, and confetti.',
    guide:
      'Use AnimationView for transitions on existing content and a loading component for ongoing work. Keep important information available when motion is reduced or disabled.',
    slugs: ['animations', 'animation-view', 'carousel', 'confetti', 'loading', 'skeleton', 'skeleton-group']
  },
  {
    sku: 'game-development',
    text: 'Game Development',
    description: 'Find game surfaces, asset loading, audio, input controls, and runtime APIs for React and React Native.',
    guide:
      'Start with GameView to host the scene, use the games module for simulation and rendering, and load assets before play. Add game-specific input, audio, and haptics after the main loop works.',
    slugs: ['animations', 'assets', 'audio', 'core', 'game-view', 'games', 'haptics', 'joystick', 'keep-awake', 'wasm-runtime']
  },
  {
    sku: 'device-services',
    text: 'Device Services',
    description: 'Browse camera, document picker, contacts, location, permissions, and other platform APIs.',
    guide:
      'Check each module’s platform requirements before wiring the UI. Request access for the current user action, and let system pickers handle file access when selection is enough.',
    slugs: [
      'contacts',
      'camera',
      'capture',
      'clipboard',
      'device',
      'document-picker',
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
  {
    sku: 'data-storage',
    text: 'Data Storage',
    description: 'Choose between key-value storage, SQLite queries, app-private files, and document selection.',
    guide:
      'Use key-value storage for preferences, SQLite for queries across records, and files for larger binary data. Use documentPicker when the user needs to bring a file into the app.',
    slugs: ['assets', 'document-picker', 'files', 'network', 'sqlite', 'storage', 'uuid']
  },
  {
    sku: 'platform-integration',
    text: 'Platform Integration',
    description: 'Set up the engine runtime, Expo build options, styling, and platform view interop.',
    guide:
      'Choose the native engine features in the Expo config or platform build. Use the web runtime for browser deployments, and bridge platform-specific UI through NPlatformView.',
    slugs: [
      'core',
      'device',
      'expo-plugin',
      'keyboard',
      'package-metadata',
      'platform-view',
      'auth',
      'safe-area',
      'styles',
      'theme',
      'use-system-bars',
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
      const first = items.find(({ link }) => link.startsWith('/react/')) ?? items[0];
      return {
        ...taggedReference({ slug, path: first.link, title: first.title, description: first.description }, 'component', items),
        nativePath: items.find(({ link }) => link !== first.link && link.startsWith('/react-native/'))?.link
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

export const referenceTopics = topics
  .map(({ slugs: _slugs, ...topic }) => ({
    ...topic,
    entries: tagsBySku.get(topic.sku)?.entries ?? []
  }))
  .filter(({ entries }) => entries.length > 1);
export const findReferenceTopic = (sku: string) => referenceTopics.find((topic) => topic.sku === sku);
export const findReferenceTag = (sku: string) => tagsBySku.get(sku);
export const tagsForReference = (path: string) => (referencesByPath.get(path)?.tags ?? []).filter(({ sku }) => findReferenceTopic(sku));
