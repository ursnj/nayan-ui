import React, { CSSProperties, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { ThresholdUnits, parseThreshold, throttle } from './Utils';

type Fn = () => any;

export interface NInfiniteScrollProps {
  next: Fn;
  hasMore: boolean;
  children: ReactNode;
  loader: ReactNode;
  scrollThreshold?: number | string;
  endMessage?: ReactNode;
  style?: CSSProperties;
  height?: number | string;
  scrollableTarget?: HTMLElement | string | null;
  hasChildren?: boolean;
  inverse?: boolean;
  pullDownToRefresh?: boolean;
  pullDownToRefreshContent?: ReactNode;
  releaseToRefreshContent?: ReactNode;
  pullDownToRefreshThreshold?: number;
  refreshFunction?: Fn;
  onScroll?: (e: Event) => any;
  dataLength: number;
  initialScrollY?: number;
  className?: string;
  'aria-label'?: string;
}

export const NInfiniteScroll: React.FC<NInfiniteScrollProps> = ({
  next,
  hasMore,
  children,
  loader,
  scrollThreshold = 0.8,
  endMessage,
  style = {},
  height,
  scrollableTarget,
  hasChildren,
  inverse = false,
  pullDownToRefresh = false,
  pullDownToRefreshContent,
  releaseToRefreshContent,
  pullDownToRefreshThreshold = 100,
  refreshFunction,
  onScroll,
  dataLength,
  initialScrollY,
  className = '',
  'aria-label': ariaLabel = 'Infinite Scroll Region'
}) => {
  const [showLoader, setShowLoader] = useState(false);
  const [pullToRefreshThresholdBreached, setPullToRefreshThresholdBreached] = useState(false);
  const [prevDataLength, setPrevDataLength] = useState<number | undefined>(dataLength);
  const infScrollRef = useRef<HTMLDivElement>(null);
  const pullDownRef = useRef<HTMLDivElement>(null);
  const scrollableNode = useRef<HTMLElement | Window | null>(null);
  const lastScrollTop = useRef(0);
  const actionTriggered = useRef(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const dragging = useRef(false);
  const maxPullDownDistance = useRef(0);

  // Get scrollable target
  const getScrollableTarget = useCallback(() => {
    if (scrollableTarget instanceof HTMLElement) return scrollableTarget;
    if (typeof scrollableTarget === 'string') {
      return document.getElementById(scrollableTarget);
    }
    return window;
  }, [scrollableTarget]);

  // Pull to refresh handlers
  const onStart = useCallback((evt: TouchEvent | MouseEvent) => {
    if (lastScrollTop.current) return;
    dragging.current = true;
    if ('touches' in evt) {
      startY.current = evt.touches[0].pageY;
    } else {
      startY.current = evt.pageY;
    }
    currentY.current = startY.current;
    if (infScrollRef.current) {
      infScrollRef.current.style.willChange = 'transform';
      infScrollRef.current.style.transition = `transform 0.2s cubic-bezier(0,0,0.31,1)`;
    }
  }, []);

  const onMove = useCallback(
    (evt: TouchEvent | MouseEvent) => {
      if (!dragging.current) return;
      if ('touches' in evt) {
        currentY.current = evt.touches[0].pageY;
      } else {
        currentY.current = evt.pageY;
      }
      if (currentY.current < startY.current) return;
      if (currentY.current - startY.current >= pullDownToRefreshThreshold) {
        setPullToRefreshThresholdBreached(true);
      }
      if (currentY.current - startY.current > maxPullDownDistance.current * 1.5) return;
      if (infScrollRef.current) {
        infScrollRef.current.style.overflow = 'visible';
        infScrollRef.current.style.transform = `translate3d(0px, ${currentY.current - startY.current}px, 0px)`;
      }
    },
    [pullDownToRefreshThreshold]
  );

  const onEnd = useCallback(() => {
    startY.current = 0;
    currentY.current = 0;
    dragging.current = false;
    if (pullToRefreshThresholdBreached) {
      refreshFunction && refreshFunction();
      setPullToRefreshThresholdBreached(false);
    }
    requestAnimationFrame(() => {
      if (infScrollRef.current) {
        infScrollRef.current.style.overflow = 'auto';
        infScrollRef.current.style.transform = 'none';
        infScrollRef.current.style.willChange = 'unset';
      }
    });
  }, [pullToRefreshThresholdBreached, refreshFunction]);

  // Scroll threshold helpers
  const isElementAtTop = (target: HTMLElement, thresholdVal: string | number = 0.8) => {
    const clientHeight = target === document.body || target === document.documentElement ? window.screen.availHeight : target.clientHeight;
    const threshold = parseThreshold(thresholdVal);
    if (threshold.unit === ThresholdUnits.Pixel) {
      return target.scrollTop <= threshold.value + clientHeight - target.scrollHeight + 1;
    }
    return target.scrollTop <= threshold.value / 100 + clientHeight - target.scrollHeight + 1;
  };

  const isElementAtBottom = (target: HTMLElement, thresholdVal: string | number = 0.8) => {
    const clientHeight = target === document.body || target === document.documentElement ? window.screen.availHeight : target.clientHeight;
    const threshold = parseThreshold(thresholdVal);
    if (threshold.unit === ThresholdUnits.Pixel) {
      return target.scrollTop + clientHeight >= target.scrollHeight - threshold.value;
    }
    return target.scrollTop + clientHeight >= (threshold.value / 100) * target.scrollHeight;
  };

  // Main scroll listener
  const onScrollListener = useCallback(
    (event: Event) => {
      if (typeof onScroll === 'function') {
        setTimeout(() => onScroll(event), 0);
      }
      const target =
        height || scrollableNode.current instanceof HTMLElement
          ? (event.target as HTMLElement)
          : document.documentElement.scrollTop
            ? document.documentElement
            : document.body;
      if (actionTriggered.current) return;
      const atBottom = inverse ? isElementAtTop(target, scrollThreshold) : isElementAtBottom(target, scrollThreshold);
      if (atBottom && hasMore) {
        actionTriggered.current = true;
        setShowLoader(true);
        next && next();
      }
      lastScrollTop.current = target.scrollTop;
    },
    [hasMore, next, onScroll, height, inverse, scrollThreshold]
  );

  // Use throttle correctly: function first, ms second
  const throttledOnScrollListener = useCallback(throttle(150, onScrollListener), [onScrollListener]);

  // Effect: set up event listeners
  useEffect(() => {
    scrollableNode.current = getScrollableTarget();
    const el = height ? infScrollRef.current : scrollableNode.current || window;
    if (!el) return;
    el.addEventListener('scroll', throttledOnScrollListener as EventListenerOrEventListenerObject);
    if (pullDownToRefresh) {
      el.addEventListener('touchstart', onStart as EventListener);
      el.addEventListener('touchmove', onMove as EventListener);
      el.addEventListener('touchend', onEnd as EventListener);
      el.addEventListener('mousedown', onStart as EventListener);
      el.addEventListener('mousemove', onMove as EventListener);
      el.addEventListener('mouseup', onEnd as EventListener);
      // get BCR of pullDown element to position it above
      maxPullDownDistance.current =
        (pullDownRef.current &&
          pullDownRef.current.firstChild &&
          (pullDownRef.current.firstChild as HTMLDivElement).getBoundingClientRect().height) ||
        0;
    }
    // Initial scroll
    if (typeof initialScrollY === 'number' && el instanceof HTMLElement && el.scrollHeight > initialScrollY) {
      el.scrollTo(0, initialScrollY);
    }
    return () => {
      el.removeEventListener('scroll', throttledOnScrollListener as EventListenerOrEventListenerObject);
      if (pullDownToRefresh) {
        el.removeEventListener('touchstart', onStart as EventListener);
        el.removeEventListener('touchmove', onMove as EventListener);
        el.removeEventListener('touchend', onEnd as EventListener);
        el.removeEventListener('mousedown', onStart as EventListener);
        el.removeEventListener('mousemove', onMove as EventListener);
        el.removeEventListener('mouseup', onEnd as EventListener);
      }
    };
  }, [getScrollableTarget, height, throttledOnScrollListener, pullDownToRefresh, onStart, onMove, onEnd, initialScrollY]);

  // Effect: reset loader when data changes
  useEffect(() => {
    if (dataLength !== prevDataLength) {
      actionTriggered.current = false;
      setShowLoader(false);
      setPrevDataLength(dataLength);
    }
  }, [dataLength, prevDataLength]);

  // Styles
  const mainStyle = {
    height: height || 'auto',
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
    ...style
  } as CSSProperties;
  const hasAnyChildren = hasChildren || !!(children && Array.isArray(children) && (children as any[]).length);
  const outerDivStyle = pullDownToRefresh && height ? { overflow: 'auto' } : {};

  return (
    <div style={outerDivStyle} className="infinite-scroll-component__outerdiv">
      <div
        className={cn('infinite-scroll-component', className)}
        ref={infScrollRef}
        style={mainStyle}
        role="region"
        aria-label={ariaLabel}
        aria-busy={showLoader}
        tabIndex={0}>
        {pullDownToRefresh && (
          <div style={{ position: 'relative' }} ref={pullDownRef}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: -1 * maxPullDownDistance.current
              }}>
              {pullToRefreshThresholdBreached ? releaseToRefreshContent : pullDownToRefreshContent}
            </div>
          </div>
        )}
        {children}
        {!showLoader && !hasAnyChildren && hasMore && loader && (
          <div role="status" aria-live="polite">
            {loader}
          </div>
        )}
        {showLoader && hasMore && loader && (
          <div role="status" aria-live="polite">
            {loader}
          </div>
        )}
        {!hasMore && endMessage && (
          <div role="status" aria-live="polite">
            {endMessage}
          </div>
        )}
      </div>
    </div>
  );
};
