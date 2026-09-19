'use client';

import { useState } from 'react';
import { NCard, NInfiniteScroll, NLoading } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const InfiniteScroll = () => {
  const [items, setItems] = useState(new Array(20).fill(''));
  const [isFetching, setIsFetching] = useState(false);

  const fetchNextPage = () => {
    setIsFetching(true);
    setTimeout(() => {
      setItems(prev => [...prev, ...new Array(20).fill('')]);
      setIsFetching(false);
    }, 2000);
  };

  return (
    <ComponentWrapper code={code}>
      <NInfiniteScroll
        next={() => !isFetching && fetchNextPage()}
        hasMore={true}
        loader={<NLoading />}
        dataLength={items.length}
        scrollThreshold={0.99}>
        {items.map((_item: any, index: number) => (
          <NCard key={index} className="p-3 mb-3">
            Item {index}
          </NCard>
        ))}
      </NInfiniteScroll>
    </ComponentWrapper>
  );
};

export default InfiniteScroll;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { NCard, NInfiniteScroll, NLoading } from '@nayan-ui/react';

const InfiniteScroll = () => {
  const [items, setItems] = useState(new Array(20).fill(''));
  const [isFetching, setIsFetching] = useState(false);

  const fetchNextPage = () => {
    setIsFetching(true);
    setTimeout(() => {
      setItems(prev => [...prev, ...new Array(20).fill('')]);
      setIsFetching(false);
    }, 2000);
  };

  return (
    <div>
      <NInfiniteScroll
        next={() => !isFetching && fetchNextPage()}
        hasMore={true}
        loader={<NLoading />}
        dataLength={items.length}
        scrollThreshold={0.99}>
        {items.map((_item: any, index: number) => (
          <NCard key={index} className="p-3 mb-3">
            Item {index}
          </NCard>
        ))}
      </NInfiniteScroll>
    </div>
  );
};

export default InfiniteScroll;`;

export const infiniteScrollAttributes = [
  { name: 'next', type: 'function', default: 'Required', details: 'Function to load next set of data.' },
  { name: 'hasMore', type: 'boolean', default: 'Required', details: 'Whether there is more data to load.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Content to display in the scroll container.' },
  { name: 'loader', type: 'React.ReactNode', default: 'Required', details: 'Loading indicator component.' },
  { name: 'scrollThreshold', type: 'number | string', default: 'Optional', details: 'Threshold for triggering next load.' },
  { name: 'endMessage', type: 'React.ReactNode', default: 'Optional', details: 'Message to show when no more data.' },
  { name: 'style', type: 'CSSProperties', default: 'Optional', details: 'Custom styles for the container.' },
  { name: 'height', type: 'number | string', default: 'Optional', details: 'Height of the scroll container.' },
  { name: 'scrollableTarget', type: 'HTMLElement | string | null', default: 'Optional', details: 'Target element for scrolling.' },
  { name: 'hasChildren', type: 'boolean', default: 'Optional', details: 'Whether container has children.' },
  { name: 'inverse', type: 'boolean', default: 'Optional', details: 'Whether to use inverse scrolling.' },
  { name: 'pullDownToRefresh', type: 'boolean', default: 'Optional', details: 'Enable pull to refresh functionality.' },
  { name: 'pullDownToRefreshContent', type: 'React.ReactNode', default: 'Optional', details: 'Content for pull to refresh.' },
  { name: 'releaseToRefreshContent', type: 'React.ReactNode', default: 'Optional', details: 'Content for release to refresh.' },
  { name: 'pullDownToRefreshThreshold', type: 'number', default: 'Optional', details: 'Threshold for pull to refresh.' },
  { name: 'refreshFunction', type: 'function', default: 'Optional', details: 'Function to call on refresh.' },
  { name: 'onScroll', type: '(e: Event) => any', default: 'Optional', details: 'Scroll event handler.' },
  { name: 'dataLength', type: 'number', default: 'Required', details: 'Length of current data array.' },
  { name: 'initialScrollY', type: 'number', default: 'Optional', details: 'Initial scroll position.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'aria-label', type: 'string', default: 'Optional', details: 'ARIA label for accessibility.' }
];
