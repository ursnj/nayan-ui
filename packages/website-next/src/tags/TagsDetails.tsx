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
          <NCard className="p-3 h-full group hover:shadow-lg transition-all duration-300">
            <div className="flex flex-row items-center mb-1">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3 shadow-sm group-hover:scale-110 transition-transform">
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="text-base font-medium">{component.title}</div>
            </div>
            <div className="text-sm line-clamp-5 text-muted">{component.description}</div>
          </NCard>
        </Link>
      </div>
    </Sidebar>
  );
};

export default TagDetails;
