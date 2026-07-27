import React from 'react';
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
  emptyMessage?: React.ReactNode;
  getRowKey?: (row: T, rowIndex: number) => string | number;
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
    variant = 'primary',
    emptyMessage = 'No data',
    getRowKey
  }: NTableProps<T>) => {
    return (
      <Table variant={variant} className={cn('nyn-table', className)}>
        <Table.ScrollContainer>
          <Table.Content aria-label={caption || 'Data table'}>
            <Table.Header className={cn(headerClassName)}>
              {columns.map((col, colIndex) => (
                <Table.Column
                  key={col.name}
                  id={col.name}
                  isRowHeader={colIndex === 0}
                  className={cn(headerCellClassName, col.headerClassName, col.className)}>
                  {col.renderHeader ? col.renderHeader(col, colIndex) : col.title}
                </Table.Column>
              ))}
            </Table.Header>
            <Table.Body className={cn(bodyClassName)} renderEmptyState={() => <span>{emptyMessage}</span>}>
              {data.map((row, rowIndex) => {
                const rowKey = getRowKey ? getRowKey(row, rowIndex) : rowIndex;
                return (
                  <Table.Row key={rowKey} id={rowKey} className={cn(bodyRowClassName)}>
                    {columns.map((col, colIndex) => (
                      <Table.Cell key={col.name} className={cn(bodyCellClassName, col.cellClassName, col.className)}>
                        {col.renderCell ? col.renderCell(row, col, rowIndex, colIndex) : row[col.name]}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    );
  }
);

NTable.displayName = 'NTable';
