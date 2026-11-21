import Link from 'next/link';
import { DocsIntro } from '@/design/Primitives';
import { BUTTON_SMALL } from '@/design/system';
import Code from '@/components/helpers/Code';
import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { EngineComponentExample } from '@/components/ui/EngineComponentDoc';
import { componentReferences } from '@/services/engine/component-reference';
import { moduleReferences } from '@/services/engine/module-reference';
import { tagsForReference } from '@/services/engine/reference-tags';
import ReferenceDirectory from './ReferenceDirectory';

type Group = 'components' | 'modules';
type ReferenceEntry = (typeof componentReferences)[number] | (typeof moduleReferences)[number];

export const referenceGroups = {
  components: {
    title: 'Engine Components',
    description: 'Try controls, layout primitives and hooks in live previews, then copy engine code for React and React Native.',
    importPath: '@nayan-ui/engine/components',
    items: componentReferences
  },
  modules: {
    title: 'Engine Modules',
    description:
      'Import games, drawing, media, storage and platform services from their individual engine entry points. Each reference includes an example.',
    importPath: '@nayan-ui/engine/modules',
    items: moduleReferences
  }
};

function referenceNavigation(group: Group) {
  const { title, items } = referenceGroups[group];
  return {
    title,
    href: `/${group}`,
    items: [
      { title: 'Components', description: referenceGroups.components.description, link: '/components' },
      { title: 'Modules', description: referenceGroups.modules.description, link: '/modules' },
      { title: 'Tags', description: 'Browse components and modules by topic.', link: '/tags' },
      { title, description: '', link: '', isHeading: true },
      ...items.map((item) => ({ title: item.title, description: item.description, link: item.path }))
    ]
  };
}

export function ReferenceIndex({ group }: { group: Group }) {
  const { title, description, items, importPath } = referenceGroups[group];
  const code =
    group === 'components'
      ? 'import { NAlert } from \'@nayan-ui/engine/components\';\n\nexport function SavedAlert() {\n  return <NAlert title="Saved" />;\n}'
      : "import { prepareUuid, uuid } from '@nayan-ui/engine/modules';\n\nexport async function newId() {\n  await prepareUuid();\n  return uuid();\n}";

  return (
    <Sidebar title={title} reference={referenceNavigation(group)}>
      <DocsIntro lead={description} />
      <SubHeader title={group === 'components' ? 'Components and hooks' : 'Module entry points'}>
        <ReferenceDirectory
          kind={group}
          items={items.map(({ title, description, path, ...item }) => ({
            title,
            description,
            path,
            api: 'symbol' in item ? item.symbol : item.importPath
          }))}
        />
      </SubHeader>
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
    <Sidebar title={entry.title} reference={referenceNavigation(group)}>
      <DocsIntro lead={entry.description} />
      {'symbol' in entry ? (
        <>
          <p className="reference-api">
            Engine API <code className="ml-1 font-semibold text-accent">{entry.symbol}</code>
            <span className="ml-2 break-all font-mono text-xs">{entry.importPath}</span>
          </p>
          <EngineComponentExample slug={entry.slug} />
          {module && (
            <Link href={module.path} className="mb-4 block text-sm font-medium text-accent hover:underline">
              {module.title} module
            </Link>
          )}
          <div className="flex flex-wrap gap-2">
            <Link href="/game-engine/react" className={BUTTON_SMALL}>
              React setup
            </Link>
            <Link href="/game-engine/react-native" className={BUTTON_SMALL}>
              React Native setup
            </Link>
          </div>
        </>
      ) : (
        <>
          <SubHeader title="Usage" description={entry.note}>
            <Code code={entry.code} filename={entry.filename ?? entry.importPath} language={entry.filename?.endsWith('.js') ? 'javascript' : 'tsx'} />
          </SubHeader>
          {entry.guide ? (
            <Link href={entry.guide} className={BUTTON_SMALL}>
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
