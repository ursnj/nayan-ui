'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getSidebarItems } from '@/services/Utils';

interface Props {
  title?: string;
  children: ReactNode;
}

const Sidebar = (props: Props) => {
  const pathname = usePathname();
  const sidebarItems = getSidebarItems(pathname);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="hidden sm:block col-span-12 sm:col-span-4 md:col-span-3 lg:col-span-3">
          <div className="sticky top-[70px] h-[calc(100vh-82px)] overflow-y-auto pr-2">
            {sidebarItems.map(item => {
              const Icon = item.icon as any;
              return (
                <div key={item.link}>
                  {!item.isHeading && (
                    <Link href={item.link}>
                      <div
                        className={`cursor-pointer hover:bg-default rounded-lg p-2 px-3 flex items-center text-sm ${pathname === item.link ? 'text-accent bg-accent/5 font-medium' : ''}`}>
                        <Icon className="w-4 h-4 inline mr-3" />
                        <span>{item.title}</span>
                      </div>
                    </Link>
                  )}
                  {!!item.isHeading && <div className="text-sm font-semibold text-muted uppercase tracking-wide p-2 pt-4">{item.title}</div>}
                </div>
              );
            })}
          </div>
        </div>
        <div className="content col-span-12 sm:col-span-8 md:col-span-9 lg:col-span-9">
          {props.title && <h1 className="text-2xl font-bold mb-6">{props.title}</h1>}
          <div>{props.children}</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
