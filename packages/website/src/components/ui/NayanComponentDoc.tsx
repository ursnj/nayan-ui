import Link from 'next/link';
import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { DocsIntro } from '@/design/Primitives';
import ComponentAttributes from '@/components/nayan-reference/ComponentAttributes';
import { getMenuItem } from '@/services/Utils';
import { findComponentReference, legacyComponentAlternatives } from '@/services/nayan-ui/component-reference';
import { tagsForReference } from '@/services/nayan-ui/reference-tags';
import { EngineComponentExample } from './ComponentExamples';

export default function NayanComponentDoc({ path }: { path: string }) {
  const item = getMenuItem(path);
  const slug = path.substring(path.lastIndexOf('/') + 1);
  const alternative = legacyComponentAlternatives[slug as keyof typeof legacyComponentAlternatives];
  const reference = findComponentReference(alternative ?? (slug === 'avatar' ? 'image' : slug));
  const native = path.startsWith('/react-native/');
  const quickstart = native ? '/game-engine/react-native' : '/game-engine/react';
  const tags = tagsForReference(path);

  return (
    <Sidebar title={item?.title ?? 'Components'} componentDocumentation>
      {item?.description && <DocsIntro lead={item.description} />}
      <EngineComponentExample slug={slug} path={path} />
      {reference && (
        <>
          <ComponentAttributes symbol={reference.symbol} platform={native ? 'native' : 'web'} />
          <Link href={reference.path} className="mb-3 block text-accent hover:underline">
            Engine reference for {reference.title}
          </Link>
        </>
      )}
      <Link href={quickstart} className="mb-3 block text-accent hover:underline">
        Set up engine components
      </Link>
      {tags.length > 0 && (
        <SubHeader title="Tags">
          <TagsList tags={tags} />
        </SubHeader>
      )}
    </Sidebar>
  );
}
