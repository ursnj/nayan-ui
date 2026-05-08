'use client';

import { NBadge } from '@nayan-ui/react';
import Link from 'next/link';

interface Props {
  type: string;
  tags: { sku: string; text: string }[];
}

const TagsList = (props: Props) => {
  return (
    <div className="video-tags mb-3">
      <div className="flex flex-row flex-wrap items-center">
        {props.tags.map(tag => (
          <Link href={`/${props.type}/tags/${tag.sku}`} key={tag.sku} className="mr-3 mb-3 rounded-full">
            <NBadge className="text-foreground bg-surface border border-default py-1">{tag.text}</NBadge>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TagsList;
