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
