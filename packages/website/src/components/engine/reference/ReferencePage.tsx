import Link from 'next/link';
import { ArrowUpRight } from '@/design/Icons';
import { DocsIntro } from '@/design/Primitives';
import { BUTTON_SMALL, CARD_INTERACTIVE, H3 } from '@/design/system';
import Code from '@/components/helpers/Code';
import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import { EngineComponentExample } from '@/components/ui/EngineComponentDoc';
import { standaloneExamples } from '@/services/engine/component-examples';
import { componentReferences } from '@/services/engine/component-reference';
import { moduleReferences } from '@/services/engine/module-reference';

type Group = 'components' | 'modules';
type ReferenceEntry = (typeof componentReferences)[number] | (typeof moduleReferences)[number];

export const referenceGroups = {
  components: {
    title: 'Engine Components',
    description: 'Browse engine controls, layout primitives and hooks for React and React Native.',
    importPath: '@nayan-ui/engine/components',
    items: componentReferences
  },
  modules: {
    title: 'Engine Modules',
    description: 'Browse the engine’s focused entry points for games, drawing, media, storage and platform services.',
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
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <li key={item.path}>
              <Link href={item.path} className={`${CARD_INTERACTIVE} flex h-full flex-col p-4`}>
                <span className="flex items-start justify-between gap-2">
                  <span className={H3}>{item.title}</span>
                  <ArrowUpRight aria-hidden size={16} className="shrink-0 text-accent" />
                </span>
                <code className="mt-1 text-xs break-all text-accent">{'symbol' in item ? item.symbol : item.importPath}</code>
                <span className="mt-2 text-sm text-muted">{item.description}</span>
              </Link>
            </li>
          ))}
        </ul>
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
  const standalone = 'symbol' in entry && module ? (standaloneExamples[entry.slug] ?? module) : undefined;

  return (
    <Sidebar title={entry.title} reference={referenceNavigation(group)}>
      <DocsIntro lead={entry.description} />
      {'symbol' in entry ? (
        <>
          <p className="mb-6 text-sm text-muted">
            Engine API <code className="ml-1 font-semibold text-accent">{entry.symbol}</code>
            <span className="ml-2 break-all font-mono text-xs">{entry.importPath}</span>
          </p>
          {standalone ? (
            <SubHeader title="Usage" description={standalone.note}>
              <Code code={standalone.code} filename="Example.tsx" />
            </SubHeader>
          ) : (
            <EngineComponentExample slug={entry.slug} />
          )}
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
    </Sidebar>
  );
}
