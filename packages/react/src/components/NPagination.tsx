import React, { memo, useCallback, useMemo } from 'react';
import { Pagination } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NPaginationProps {
  totalPages: number;
  currentPage: number;
  onChange: (page: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  showSummary?: boolean;
  summaryText?: string;
  siblingCount?: number;
  className?: string;
  contentClassName?: string;
  linkClassName?: string;
  activeLinkClassName?: string;
  'aria-label'?: string;
}

const NPaginationComponent: React.FC<NPaginationProps> = memo(
  ({
    totalPages,
    currentPage,
    onChange,
    size = 'md',
    disabled = false,
    showSummary = false,
    summaryText,
    siblingCount = 1,
    className = '',
    contentClassName = '',
    linkClassName = '',
    activeLinkClassName = '',
    'aria-label': ariaLabel = 'Pagination'
  }) => {
    const pageCount = Math.max(0, Math.floor(totalPages));
    const activePage = pageCount === 0 ? 0 : Math.min(pageCount, Math.max(1, Math.floor(currentPage)));
    const siblings = Math.max(0, Math.floor(siblingCount));

    const pages = useMemo(() => {
      const result: (number | 'ellipsis')[] = [];
      const addRange = (start: number, end: number) => {
        for (let i = start; i <= end; i++) result.push(i);
      };

      if (pageCount <= siblings * 2 + 5) {
        addRange(1, pageCount);
      } else {
        const leftBound = Math.max(2, activePage - siblings);
        const rightBound = Math.min(pageCount - 1, activePage + siblings);

        result.push(1);
        if (leftBound > 2) result.push('ellipsis');
        addRange(leftBound, rightBound);
        if (rightBound < pageCount - 1) result.push('ellipsis');
        result.push(pageCount);
      }
      return result;
    }, [activePage, pageCount, siblings]);

    const handlePrevious = useCallback(() => {
      if (activePage > 1) onChange(activePage - 1);
    }, [activePage, onChange]);

    const handleNext = useCallback(() => {
      if (activePage < pageCount) onChange(activePage + 1);
    }, [activePage, pageCount, onChange]);

    return (
      <Pagination size={size} className={cn('nyn-pagination', className)} aria-label={ariaLabel}>
        {showSummary && (
          <Pagination.Summary className="text-sm text-muted font-medium">{summaryText || `Page ${activePage} of ${pageCount}`}</Pagination.Summary>
        )}
        <Pagination.Content className={cn(contentClassName)}>
          <Pagination.Item>
            <Pagination.Previous isDisabled={disabled || activePage <= 1} onPress={handlePrevious}>
              <Pagination.PreviousIcon />
              <span>Previous</span>
            </Pagination.Previous>
          </Pagination.Item>
          {pages.map((page, index) =>
            page === 'ellipsis' ? (
              <Pagination.Item key={`ellipsis-${index}`}>
                <Pagination.Ellipsis />
              </Pagination.Item>
            ) : (
              <Pagination.Item key={page}>
                <Pagination.Link
                  isActive={page === activePage}
                  isDisabled={disabled}
                  onPress={() => page !== activePage && onChange(page)}
                  className={cn(linkClassName, page === activePage && activeLinkClassName)}>
                  {page}
                </Pagination.Link>
              </Pagination.Item>
            )
          )}
          <Pagination.Item>
            <Pagination.Next isDisabled={disabled || activePage >= pageCount} onPress={handleNext}>
              <span>Next</span>
              <Pagination.NextIcon />
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
      </Pagination>
    );
  }
);

NPaginationComponent.displayName = 'NPagination';

export const NPagination = NPaginationComponent;
