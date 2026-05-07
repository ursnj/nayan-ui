import React, { memo, useCallback, useMemo } from 'react';
import { Pagination } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NPaginationProps {
  totalPages: number;
  currentPage: number;
  onChange: (page: number) => void;
  size?: 'sm' | 'md' | 'lg';
  isDisabled?: boolean;
  showSummary?: boolean;
  summaryText?: string;
  siblingCount?: number;
  className?: string;
  contentClassName?: string;
  linkClassName?: string;
  activeLinkClassName?: string;
}

const NPaginationComponent: React.FC<NPaginationProps> = memo(
  ({
    totalPages,
    currentPage,
    onChange,
    size = 'md',
    isDisabled = false,
    showSummary = false,
    summaryText,
    siblingCount = 1,
    className = '',
    contentClassName = '',
    linkClassName = '',
    activeLinkClassName = ''
  }) => {
    const pages = useMemo(() => {
      const result: (number | 'ellipsis')[] = [];
      const addRange = (start: number, end: number) => {
        for (let i = start; i <= end; i++) result.push(i);
      };

      if (totalPages <= 7) {
        addRange(1, totalPages);
      } else {
        const leftBound = Math.max(2, currentPage - siblingCount);
        const rightBound = Math.min(totalPages - 1, currentPage + siblingCount);

        result.push(1);
        if (leftBound > 2) result.push('ellipsis');
        addRange(leftBound, rightBound);
        if (rightBound < totalPages - 1) result.push('ellipsis');
        result.push(totalPages);
      }
      return result;
    }, [totalPages, currentPage, siblingCount]);

    const handlePrevious = useCallback(() => {
      if (currentPage > 1) onChange(currentPage - 1);
    }, [currentPage, onChange]);

    const handleNext = useCallback(() => {
      if (currentPage < totalPages) onChange(currentPage + 1);
    }, [currentPage, totalPages, onChange]);

    return (
      <Pagination size={size} className={cn('nyn-pagination', className)}>
        {showSummary && (
          <Pagination.Summary className="text-sm text-muted">{summaryText || `Page ${currentPage} of ${totalPages}`}</Pagination.Summary>
        )}
        <Pagination.Content className={cn(contentClassName)}>
          <Pagination.Item>
            <Pagination.Previous isDisabled={isDisabled || currentPage <= 1} onPress={handlePrevious}>
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
                  isActive={page === currentPage}
                  isDisabled={isDisabled}
                  onPress={() => onChange(page)}
                  className={cn(linkClassName, page === currentPage && activeLinkClassName)}>
                  {page}
                </Pagination.Link>
              </Pagination.Item>
            )
          )}
          <Pagination.Item>
            <Pagination.Next isDisabled={isDisabled || currentPage >= totalPages} onPress={handleNext}>
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
