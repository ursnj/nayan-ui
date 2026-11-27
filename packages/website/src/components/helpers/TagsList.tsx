import { NView } from 'nayan-ui/components';
import Link from 'next/link';
import { PILL_INTERACTIVE } from '@/design/system';
import { toolTopicForTags } from '@/services/tool-topics';

interface Props {
  type?: 'tools';
  tags: readonly { sku: string; text: string }[];
}

const TagsList = ({ type, tags }: Props) => {
  const topic = type === 'tools' ? toolTopicForTags(tags) : undefined;
  const links =
    type === 'tools'
      ? topic
        ? [{ href: topic.path, text: topic.title }]
        : []
      : tags.map(({ sku, text }) => ({ href: `/tags/${encodeURIComponent(sku)}`, text }));
  if (!links.length) return null;
  return (
    <NView tag="ul" className="flex flex-row flex-wrap items-center gap-2">
      {links.map(({ href, text }) => (
        <NView tag="li" key={href}>
          <Link href={href} prefetch={false} className={PILL_INTERACTIVE}>
            {text}
          </Link>
        </NView>
      ))}
    </NView>
  );
};

export default TagsList;
