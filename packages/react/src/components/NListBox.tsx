import React, { ReactNode, memo } from 'react';
import type { Selection } from '@heroui/react';
import { ListBox, ListBoxItem } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NListBoxItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface NListBoxProps {
  items: NListBoxItem[];
  selectionMode?: 'none' | 'single' | 'multiple';
  selectedKeys?: Iterable<string>;
  onSelectionChange?: (keys: Selection) => void;
  /** Fires on click or Enter, for a list that acts rather than selects. */
  onAction?: (key: string) => void;
  variant?: 'default' | 'danger';
  /** Keys that cannot be chosen. Individual items can also carry `disabled`. */
  disabledKeys?: Iterable<string>;
  /** Shown when `items` is empty. */
  emptyMessage?: ReactNode;
  className?: string;
  itemClassName?: string;
  'aria-label'?: string;
}

const NListBoxComponent: React.FC<NListBoxProps> = memo(
  ({
    items,
    selectionMode = 'single',
    selectedKeys,
    onSelectionChange,
    onAction,
    variant = 'default',
    disabledKeys,
    emptyMessage = 'Nothing here yet.',
    className = '',
    itemClassName = '',
    'aria-label': ariaLabel = 'Options'
  }) => {
    return (
      <ListBox
        items={items}
        selectionMode={selectionMode}
        selectedKeys={selectedKeys}
        onSelectionChange={onSelectionChange}
        onAction={onAction ? (key: any) => onAction(String(key)) : undefined}
        disabledKeys={disabledKeys}
        variant={variant}
        renderEmptyState={() => <p className="p-3 text-center text-sm text-muted">{emptyMessage}</p>}
        className={cn('nyn-list-box', className)}
        aria-label={ariaLabel}>
        {(item: NListBoxItem) => (
          <ListBoxItem id={item.id} textValue={item.label} isDisabled={item.disabled} className={cn('nyn-list-box-item', itemClassName)}>
            {item.icon}
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{item.label}</span>
              {item.description && <span className="truncate text-xs text-muted">{item.description}</span>}
            </span>
            {selectionMode !== 'none' && <ListBoxItem.Indicator />}
          </ListBoxItem>
        )}
      </ListBox>
    );
  }
);

NListBoxComponent.displayName = 'NListBox';

export const NListBox = NListBoxComponent;
