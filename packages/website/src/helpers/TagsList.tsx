'use client';

import Link from 'next/link';

const tagColorCycle = [
  'bg-blue-500/12 text-blue-700 dark:text-blue-300 border-blue-500/25',
  'bg-purple-500/12 text-purple-700 dark:text-purple-300 border-purple-500/25',
  'bg-pink-500/12 text-pink-700 dark:text-pink-300 border-pink-500/25',
  'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
  'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25',
  'bg-cyan-500/12 text-cyan-700 dark:text-cyan-300 border-cyan-500/25',
  'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 border-indigo-500/25',
  'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/25'
];

interface Props {
  type: string;
  tags: { sku: string; text: string }[];
}

const TagsList = (props: Props) => {
  return (
    <div className="video-tags mb-3">
      <div className="flex flex-row flex-wrap items-center gap-2">
        {props.tags.map((tag, i) => (
          <Link href={`/${props.type}/tags/${tag.sku}`} key={tag.sku}>
            <span
              className={`inline-block px-3 py-1 text-xs font-medium rounded-full border transition-all hover:shadow-sm ${tagColorCycle[i % tagColorCycle.length]}`}>
              {tag.text}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TagsList;
