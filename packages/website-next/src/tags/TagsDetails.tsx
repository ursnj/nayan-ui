'use client';

import { NCard } from '@nayan-ui/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Sidebar from '@/helpers/Sidebar';
import { getMenuItemByTag } from '@/services/Utils';

interface Props {
  tag: string;
}

const TagDetails = ({ tag }: Props) => {
  const pathname = usePathname();
  const component: any = getMenuItemByTag(tag, pathname);
  const tagItem = component.tags.find((t: any) => t.sku === tag);
  const Icon = component.icon;

  return (
    <Sidebar title={tagItem.text}>
      <div className="mb-5 leading-relaxed">{component.description}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2.5">
        <Link href={component.link} key={component.link}>
          <NCard className="p-3 h-full">
            <div className="flex flex-row items-center mb-1">
              <Icon className="w-4 h-4 inline mr-3 text-accent" />
              <div className="text-base font-medium">{component.title}</div>
            </div>
            <div className="text-sm line-clamp-5">{component.description}</div>
          </NCard>
        </Link>
      </div>
    </Sidebar>
  );
};

export default TagDetails;
