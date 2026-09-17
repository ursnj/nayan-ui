import Link from 'next/link';
import { PILL_INTERACTIVE } from '@/design/system';

interface Props {
  type: string;
  tags: { sku: string; text: string }[];
}

/**
 * The tag links under a component page.
 *
 * These used to cycle through eight hues, which meant a row of tags was the
 * most colourful thing on a page whose actual subject was the component demo
 * above it. They are navigation, not status, so they are neutral now and take
 * the accent only on hover — the same treatment as every other link on the
 * site.
 *
 * No longer a client component: it was marked one but holds no state, and
 * these sit on all 76 component pages.
 */
const TagsList = (props: Props) => (
  <ul className="flex flex-row flex-wrap items-center gap-2">
    {props.tags.map(tag => (
      <li key={tag.sku}>
        <Link href={`/${props.type}/tags/${tag.sku}`} className={PILL_INTERACTIVE}>
          {tag.text}
        </Link>
      </li>
    ))}
  </ul>
);

export default TagsList;
