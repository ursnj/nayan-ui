import { NText, NView } from 'nayan-ui/components';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DocsIntro } from '@/design/Primitives';
import { BUTTON_SMALL } from '@/design/system';
import Code from '@/components/helpers/Code';
import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { EngineComponentExample } from '@/components/ui/ComponentExamples';
import { componentReferences } from '@/services/nayan-ui/component-reference';
import { moduleReferences } from '@/services/nayan-ui/module-reference';
import { tagsForReference } from '@/services/nayan-ui/reference-tags';
import { buildPageMetadata } from '@/services/seo';
import ReferenceDirectory from './ReferenceDirectory';
import ComponentAttributes from './ComponentAttributes';

type Group = 'components' | 'modules';
type ReferenceEntry = (typeof componentReferences)[number] | (typeof moduleReferences)[number];

export function referenceRoute(entries: readonly ReferenceEntry[]) {
  type Props = { params: Promise<{ entry: string }> };
  async function getEntry({ params }: Props) {
    const { entry } = await params;
    return entries.find(({ slug }) => slug === entry) ?? notFound();
  }

  return {
    generateStaticParams: () => entries.map(({ slug }) => ({ entry: slug })),
    async generateMetadata(props: Props) {
      const entry = await getEntry(props);
      return buildPageMetadata({
        title: `${entry.title} · Engine Reference`,
        description: entry.description,
        path: entry.path,
        keywords: tagsForReference(entry.path).map(({ text }) => text).join(', ')
      });
    },
    async Page(props: Props) {
      return <ReferencePage entry={await getEntry(props)} />;
    }
  };
}

export const referenceGroups = {
  components: {
    title: 'Nayan Components',
    description: 'Try controls, layout primitives and hooks in live previews, then copy engine code for React and React Native.',
    importPath: 'nayan-ui/components'
  },
  modules: {
    title: 'Nayan Modules',
    description:
      'Import games, drawing, media, storage and platform services from their individual engine entry points. Each reference includes usage examples.',
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

function referenceNavigation(group: Group) {
  const { title, description } = referenceGroups[group];
  const href = `/${group}`;
  return {
    title,
    href,
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
    <Sidebar title={title} reference={referenceNavigation(group)} componentDocumentation={group === 'components'}>
      <DocsIntro lead={description} />
      {referenceSections[group].map(({ title, kind, items }) => (
        <SubHeader title={title} key={kind}>
          <ReferenceDirectory
            kind={kind}
            items={items.map(({ title, description, path, ...item }) => ({
              title,
              description,
              path,
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
    <Sidebar title={entry.title} reference={referenceNavigation(group)} componentDocumentation={group === 'components'}>
      <DocsIntro lead={entry.description} />
      {'symbol' in entry ? (
        <>
          <NText tag="p" className="reference-api">
            Engine API <NText tag="code" className="ml-1 font-semibold text-accent">{entry.symbol}</NText>
            <NText tag="span" className="ml-2 break-all font-mono text-xs">{entry.importPath}</NText>
          </NText>
          <EngineComponentExample slug={entry.slug} path={entry.path} />
          <ComponentAttributes symbol={entry.symbol} />
          {module && (
            <Link href={module.path} className="mb-3 block text-sm font-medium text-accent hover:underline">
              {module.title} module
            </Link>
          )}
          <NView tag="div" className="mb-3 flex flex-wrap gap-3">
            <Link href="/game-engine/react" className={BUTTON_SMALL}>
              React setup
            </Link>
            <Link href="/game-engine/react-native" className={BUTTON_SMALL}>
              React Native setup
            </Link>
          </NView>
        </>
      ) : (
        <>
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
          {entry.guide ? (
            <Link href={entry.guide} className={`${BUTTON_SMALL} mb-3`}>
              Related guide
            </Link>
          ) : null}
        </>
      )}
      <SubHeader title="Tags">
        <TagsList tags={tagsForReference(entry.path)} />
      </SubHeader>
    </Sidebar>
  );
}
