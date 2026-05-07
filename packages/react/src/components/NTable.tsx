import React, { useMemo } from 'react';
import { cn } from '../lib/utils';

// Generic column definition with flexible accessor and custom cell/header renderers
export interface NTableColumn<T> {
  name: string; // Unique name for the column
  title: React.ReactNode;
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  // Custom cell renderer: (row, col, rowIndex, colIndex) => ReactNode
  renderCell?: (row: T, col: NTableColumn<T>, rowIndex: number, colIndex: number) => React.ReactNode;
  // Custom header renderer
  renderHeader?: (col: NTableColumn<T>, colIndex: number) => React.ReactNode;
  // Optional aria-label for accessibility
  ariaLabel?: string;
}

export interface NTableProps<T> {
  className?: string;
  captionClassName?: string;
  headerClassName?: string;
  headerRowClassName?: string;
  headerCellClassName?: string;
  bodyClassName?: string;
  bodyRowClassName?: string;
  bodyCellClassName?: string;
  caption?: string;
  columns: NTableColumn<T>[];
  data: T[];
  tableProps?: React.TableHTMLAttributes<HTMLTableElement>;
  rowProps?: (row: T, rowIndex: number) => React.HTMLAttributes<HTMLTableRowElement>;
  cellProps?: (row: T, col: NTableColumn<T>, rowIndex: number, colIndex: number) => React.TdHTMLAttributes<HTMLTableCellElement>;
}

export const NTable = React.memo(
  <T extends Record<string, any>>({
    columns = [],
    data = [],
    caption = '',
    className = '',
    captionClassName = '',
    headerClassName = '',
    headerRowClassName = '',
    headerCellClassName = '',
    bodyClassName = '',
    bodyRowClassName = '',
    bodyCellClassName = '',
    tableProps,
    rowProps,
    cellProps
  }: NTableProps<T>) => {
    // Memoize columns and rows for performance
    const memoColumns = useMemo(() => columns, [columns]);
    const memoData = useMemo(() => data, [data]);

    return (
      <table
        className={cn('border border-border bg-card rounded w-full', className)}
        role="table"
        aria-label={caption || 'Data table'}
        {...tableProps}>
        {caption && <caption className={captionClassName}>{caption}</caption>}
        <thead className={cn('[&_tr]:border-0 border-border', headerClassName)}>
          <tr className={headerRowClassName} role="row">
            {memoColumns.map((col, colIndex) => (
              <th
                key={col.name}
                className={cn(
                  'px-3 py-3 h-auto border-b border-border text-left text-sm font-medium',
                  headerCellClassName,
                  col.headerClassName,
                  col.className
                )}
                scope="col"
                aria-label={col.ariaLabel || (typeof col.title === 'string' ? col.title : undefined)}
                role="columnheader">
                {col.renderHeader ? col.renderHeader(col, colIndex) : col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={bodyClassName}>
          {memoData.length === 0 ? (
            <tr>
              <td colSpan={memoColumns.length} className={cn('text-center px-3 py-3', bodyCellClassName)}>
                No data
              </td>
            </tr>
          ) : (
            memoData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn('[&_tr]:border-0 border-border', bodyRowClassName)}
                role="row"
                {...(rowProps ? rowProps(row, rowIndex) : {})}>
                {memoColumns.map((col, colIndex) => (
                  <td
                    key={col.name}
                    className={cn('px-3 py-3 border-b border-border text-sm', bodyCellClassName, col.cellClassName, col.className)}
                    role="cell"
                    aria-label={col.ariaLabel || (typeof col.title === 'string' ? col.title : undefined)}
                    {...(cellProps ? cellProps(row, col, rowIndex, colIndex) : {})}>
                    {col.renderCell ? col.renderCell(row, col, rowIndex, colIndex) : row[col.name]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    );
  }
);

NTable.displayName = 'NTable';
