import { NView, NText } from 'nayan-ui/components';
import Link from 'next/link';
import { DocsIntro } from '@/design/Primitives';
import { ArrowRight, Boxes, Code2 } from '@/design/Icons';
import { ACCENT_SOFT, CARD, H4_CARD } from '@/design/system';
import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { referenceTopics, taggedComponents, taggedModules, type TaggedReference } from '@/services/ui/reference-tags';

const tagNavigation = {
  title: 'Tags',
  href: '/tags',
  items: [
    { title: 'Tags', description: 'Browse by topic.', link: '/tags' },
    { title: 'Nayan Components', description: 'Component and hook reference.', link: '/components' },
    { title: 'Nayan Modules', description: 'Engine module reference.', link: '/modules' }
  ]
};

function TagEntries({ entries, showTags = false }: { entries: readonly TaggedReference[]; showTags?: boolean }) {
  return (
    <NView tag="ul" className={showTags ? 'space-y-3' : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'}>
      {entries.map(({ path, title, description, kind, tags, nativePath }) => {
        const Icon = kind === 'component' ? Code2 : Boxes;
        return (
          <NView tag="li" key={path} className={`${CARD} p-4`}>
            <Link href={path} className="group flex items-center gap-3">
              <NText tag="span" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${ACCENT_SOFT}`}>
                <Icon aria-hidden size={16} />
              </NText>
              <NText tag="span" className={`${H4_CARD} group-hover:text-accent`}>{title}</NText>
              <ArrowRight aria-hidden className="ml-auto shrink-0 text-muted group-hover:text-accent" size={16} />
            </Link>
            {showTags ? (
              <NView tag="div" className="mt-3">
                <TagsList tags={tags} />
              </NView>
            ) : (
              <>
                <NText tag="p" className="mt-2 text-sm text-muted">{description}</NText>
                <NText tag="p" className="mt-3 text-xs font-medium text-muted">{kind === 'component' ? 'Component' : 'Module'}</NText>
              </>
            )}
            {nativePath && (
              <Link href={nativePath} className="mt-3 inline-block text-sm text-accent hover:underline">
                React Native docs
              </Link>
            )}
          </NView>
        );
      })}
    </NView>
  );
}

export function TagResults({ title, entries }: { title: string; entries: readonly TaggedReference[] }) {
  return (
    <Sidebar title={title} reference={tagNavigation}>
      <TagEntries entries={entries} />
    </Sidebar>
  );
}

export default function Tags() {
  return (
    <Sidebar title="Tags" reference={tagNavigation}>
      <DocsIntro lead="Browse React and React Native components and engine modules by topic." />
      <SubHeader title="Topics">
        <TagsList tags={referenceTopics} />
      </SubHeader>
      <SubHeader title="Components">
        <TagEntries entries={taggedComponents} showTags />
      </SubHeader>
      <SubHeader title="Modules">
        <TagEntries entries={taggedModules} showTags />
      </SubHeader>
    </Sidebar>
  );
}
