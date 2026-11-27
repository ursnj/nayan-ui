import { NText, NView } from 'nayan-ui/components';
import enginePackage from 'nayan-ui/package.json';
import Link from 'next/link';
import { DocsIntro } from '@/design/Primitives';
import { BUTTON_SMALL } from '@/design/system';
import Code from '@/components/helpers/Code';
import JsonLd from '@/components/helpers/JsonLd';
import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { EngineComponentExample } from '@/components/ui/ComponentExamples';
import { componentReferences } from '@/services/ui/component-reference';
import { moduleReferences } from '@/services/ui/module-reference';
import { tagsForReference } from '@/services/ui/reference-tags';
import { referenceEntrySchemas } from '@/services/ui/reference-entry';
import { REPO_URL } from '@/services/seo';
import ReferenceDirectory from './ReferenceDirectory';
import ComponentAttributes from './ComponentAttributes';
import PlatformPills from './PlatformPills';

type Group = 'components' | 'modules';
type ReferenceEntry = (typeof componentReferences)[number] | (typeof moduleReferences)[number];

export const referenceGroups = {
  components: {
    title: 'Nayan Components',
    description: 'Try controls, layout primitives and hooks in live previews, then copy engine code for React and React Native.',
    importPath: 'nayan-ui/components'
  },
  modules: {
    title: 'Nayan Modules',
    description:
      'Find focused imports and platform requirements for camera and document picking, sign-in, contacts, files, storage, games, and more.',
    importPath: 'nayan-ui/modules'
  }
};

const referenceSections = {
  components: [
    { title: 'Components', kind: 'components', items: componentReferences.filter(({ symbol }) => !symbol.startsWith('use')) },
    { title: 'Hooks', kind: 'hooks', items: componentReferences.filter(({ symbol }) => symbol.startsWith('use')) }
  ],
  modules: [{ title: 'Modules', kind: 'modules', items: moduleReferences }]
} as const;

function referenceNavigation(group: Group, currentPath?: string) {
  const { title, description } = referenceGroups[group];
  const href = `/${group}`;
  return {
    title,
    href,
    currentPath,
    items: [
      { title: 'Overview', description, link: href },
      ...(group === 'components' ? [
        { title: 'Hooks', description: 'Browse hook references.', link: '/components#hooks' },
        { title: 'React components', description: 'Browse the React component catalog.', link: '/react/components' },
        { title: 'React Native components', description: 'Browse the React Native component catalog.', link: '/react-native/components' }
      ] : []),
      { title: 'Tags', description: 'Browse components, hooks and modules by topic.', link: '/tags' },
      ...referenceSections[group].flatMap(({ title, items }) => [
        { title, description: '', link: '', isHeading: true },
        ...items.map(({ title, description, path }) => ({ title, description, link: path }))
      ])
    ]
  };
}

export function ReferenceIndex({ group }: { group: Group }) {
  const { title, description, importPath } = referenceGroups[group];
  const code =
    group === 'components'
      ? 'import { NAlert } from \'nayan-ui/components\';\n\nexport function SavedAlert() {\n  return <NAlert title="Saved" />;\n}'
      : "import { prepareUuid, uuid } from 'nayan-ui/modules';\n\nexport async function newId() {\n  await prepareUuid();\n  return uuid();\n}";

  return (
    <Sidebar title={title} reference={referenceNavigation(group)}>
      <DocsIntro lead={description} />
      {group === 'modules' && (
        <NText tag="p" className="mb-4 text-sm text-muted">
          These examples track nayan-ui {enginePackage.version}. Check the installed package version when using a new entry point.
        </NText>
      )}
      {referenceSections[group].map(({ title, kind, items }) => (
        <SubHeader title={title} key={kind}>
          <ReferenceDirectory
            kind={kind}
            items={items.map(({ title, description, path, platforms, ...item }) => ({
              title,
              description,
              path,
              platforms,
              api: 'symbol' in item ? item.symbol : item.importPath
            }))}
          />
        </SubHeader>
      ))}
      <SubHeader title="Package entry">
        <Code code={code} filename={importPath} />
      </SubHeader>
    </Sidebar>
  );
}

export function ReferencePage({ entry }: { entry: ReferenceEntry }) {
  const group = 'symbol' in entry ? 'components' : 'modules';
  const module = 'symbol' in entry ? moduleReferences.find(({ slug }) => slug === entry.module) : undefined;

  return (
    <Sidebar title={entry.title} beforeTitle={<PlatformPills platforms={entry.platforms} />} reference={referenceNavigation(group, entry.path)}>
      <JsonLd data={referenceEntrySchemas(entry)} />
      <DocsIntro lead={entry.description} />
      {'symbol' in entry ? (
        <>
          <NText tag="p" className="reference-api w-fit max-w-full [margin-bottom:0.75rem] [padding:0.75rem] [border-radius:0.65rem] [background:var(--surface-secondary)] text-muted [font-size:0.83rem]">
            Engine API <NText tag="code" className="ml-1 font-semibold text-accent">{entry.symbol}</NText>
            <NText tag="span" className="ml-2 break-all font-mono text-xs">{entry.importPath}</NText>
          </NText>
          <EngineComponentExample slug={entry.slug} path={entry.path} />
          {entry.slug === 'theme' && (
            <SubHeader title="Share a theme across platforms" id="shared-starter-theme">
              <NText tag="p" className="mb-3 text-sm text-muted">
                The starter defines its light and dark palettes in shared/src/theme.ts, persists the theme choice through nayan-ui/storage, and passes the same theme to NTheme in Expo and Vite. Browser layouts apply the matching data-theme attribute and generated CSS variables.
              </NText>
              <Link href={`${REPO_URL}/blob/main/templates/nayan-ui/shared/src/theme.ts`} className={BUTTON_SMALL}>View the full starter palette</Link>
            </SubHeader>
          )}
          <ComponentAttributes symbol={entry.symbol} />
          {module && (
            <Link href={module.path} className="mb-3 block text-sm font-medium text-accent hover:underline">
              {module.title} module
            </Link>
          )}
          <NView tag="div" className="mb-3 flex flex-wrap gap-3">
            <Link href="/react/installation" className={BUTTON_SMALL}>
              React setup
            </Link>
            <Link href="/react-native/installation" className={BUTTON_SMALL}>
              React Native setup
            </Link>
          </NView>
        </>
      ) : (
        <>
          {entry.details && (
            <SubHeader title="API notes" id="api-notes">
              <NView tag="ul" className="grid list-disc gap-2 pl-5 text-sm text-muted">
                {entry.details.map((detail) => <NText tag="li" key={detail}>{detail}</NText>)}
              </NView>
            </SubHeader>
          )}
          <SubHeader title="Examples" id="usage">
            <NView tag="div" className="grid min-w-0 gap-6">
              {[{ title: 'Quick start', code: entry.code, note: entry.note, filename: entry.filename }, ...entry.variations].map(
                ({ title, code, note, filename }) => (
                  <NView tag="section" key={title} className="grid min-w-0 gap-2" aria-label={title}>
                    <NText tag="h3" className="font-semibold">{title}</NText>
                    {note && <NText tag="p" className="text-sm text-muted">{note}</NText>}
                    <Code code={code} filename={filename ?? entry.importPath} language={filename?.endsWith('.js') ? 'javascript' : 'tsx'} />
                  </NView>
                )
              )}
            </NView>
          </SubHeader>
          {(entry.guide || entry.related) && (
            <NView tag="nav" aria-label="Related documentation" className="mb-3 flex flex-wrap gap-3">
              {entry.related?.map(({ label, href }) => <Link href={href} key={href} className={BUTTON_SMALL}>{label}</Link>)}
              {entry.guide && <Link href={entry.guide} className={BUTTON_SMALL}>Related guide</Link>}
            </NView>
          )}
        </>
      )}
      <SubHeader title="Tags">
        <TagsList tags={tagsForReference(entry.path)} />
      </SubHeader>
    </Sidebar>
  );
}
