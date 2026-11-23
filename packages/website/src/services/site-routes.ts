const pageAliases = [
  ...['/disclosure', '/components/disclosure'].map((source) => ({ source, destination: '/react/disclosure' })),
  ...['/blur-target', '/components/blur-target'].map((source) => ({ source, destination: '/blur' })),
  ...['/close-button', '/components/close-button'].map((source) => ({ source, destination: '/press' })),
  ...['/components-root', '/components/components-root'].map((source) => ({ source, destination: '/theme' })),
  ...['', '/components', '/react-native'].flatMap((prefix) =>
    ['calendar', 'date-field'].map((slug) => ({ source: `${prefix}/${slug}`, destination: '/components/date-picker' }))
  ),
  { source: '/nayan-components', destination: '/components' },
  { source: '/games/play-with-tua', destination: '/games/talking-tua' },
  { source: '/nayan-games/play-with-tua', destination: '/games/talking-tua' }
];

const sectionAliases = [
  { source: '/examples', destination: '/game-engine/examples' },
  { source: '/engine/playground', destination: '/playground' },
  { source: '/nayan-game-engine/playground', destination: '/playground' },
  { source: '/engine', destination: '/game-engine' },
  { source: '/nayan-game-engine', destination: '/game-engine' },
  { source: '/nayan-modules', destination: '/modules' },
  { source: '/nayan-playground', destination: '/playground' },
  { source: '/nayan-video-editor', destination: '/video-editor' },
  { source: '/nayan-games', destination: '/games' }
];

export const pageRewrites = [
  ...pageAliases,
  ...sectionAliases.map(({ source, destination }) => ({
    source: `${source}/:path*`,
    destination: `${destination}/:path*`
  }))
];

// Navigation renders the same active section on the server and at the visitor's original URL.
export function resolvePagePath(pathname: string): string {
  const path = pathname.replace(/\/+$/, '') || '/';
  const page = pageAliases.find(({ source }) => source === path);
  if (page) return page.destination;
  const section = sectionAliases.find(({ source }) => path === source || path.startsWith(`${source}/`));
  return section ? section.destination + path.slice(section.source.length) : path;
}
