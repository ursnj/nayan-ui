'use client';

import { NCard } from '@nayan-ui/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Sidebar from '@/helpers/Sidebar';
import { getMenuItem, getSidebarItems } from '@/services/Utils';

const Components = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);
  const sidebarItems = getSidebarItems(pathname);

  return (
    <Sidebar title={component.title}>
      <div className="mb-5 leading-relaxed">{component.description}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {sidebarItems
          .filter((item: any) => item.isComponent)
          .map(item => {
            const Icon = item.icon as any;
            return (
              <Link href={item.link} key={item.link}>
                <NCard className="p-3 h-full">
                  <div className="flex flex-row items-center mb-1">
                    <Icon className="w-4 h-4 inline mr-3 text-accent" />
                    <div className="text-base font-medium">{item.title}</div>
                  </div>
                  <div className="text-sm line-clamp-6">{item.description}</div>
                </NCard>
              </Link>
            );
          })}
      </div>
    </Sidebar>
  );
};

export default Components;
