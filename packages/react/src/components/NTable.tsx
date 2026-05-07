import React, { useMemo } from 'react';
import { Table } from '@heroui/react';
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
  headerClassName?: string;
  bodyClassName?: string;
  bodyRowClassName?: string;
  bodyCellClassName?: string;
  headerCellClassName?: string;
  variant?: 'primary' | 'secondary';
  caption?: string;
  columns: NTableColumn<T>[];
  data: T[];
}

export const NTable = React.memo(
  <T extends Record<string, any>>({
    columns = [],
    data = [],
    caption = '',
    className = '',
    headerClassName = '',
    headerCellClassName = '',
    bodyClassName = '',
    bodyRowClassName = '',
    bodyCellClassName = '',
    variant = 'primary'
  }: NTableProps<T>) => {
    const memoColumns = useMemo(() => columns, [columns]);
    const memoData = useMemo(() => data, [data]);

    return (
      <Table variant={variant} className={cn('nyn-table', className)}>
        <Table.ScrollContainer>
          <Table.Content aria-label={caption || 'Data table'}>
            <Table.Header className={cn(headerClassName)}>
              {memoColumns.map((col, colIndex) => (
                <Table.Column key={col.name} id={col.name} className={cn(headerCellClassName, col.headerClassName, col.className)}>
                  {col.renderHeader ? col.renderHeader(col, colIndex) : col.title}
                </Table.Column>
              ))}
            </Table.Header>
            <Table.Body
              className={cn(bodyClassName)}
              items={memoData.map((row, idx) => ({ ...row, _idx: idx }))}
              renderEmptyState={() => <span>No data</span>}>
              {(item: T & { _idx: number }) => (
                <Table.Row id={item._idx} className={cn(bodyRowClassName)}>
                  {memoColumns.map((col, colIndex) => (
                    <Table.Cell key={col.name} className={cn(bodyCellClassName, col.cellClassName, col.className)}>
                      {col.renderCell ? col.renderCell(item, col, item._idx, colIndex) : item[col.name]}
                    </Table.Cell>
                  ))}
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    );
  }
);

NTable.displayName = 'NTable';
