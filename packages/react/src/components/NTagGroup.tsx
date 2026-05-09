import React, { memo } from 'react';
import type { Selection } from 'react-aria-components';
import { Tag, TagGroup } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NTagItem {
  id: string;
  label: string;
}

export interface NTagGroupProps {
  items: NTagItem[];
  selectionMode?: 'none' | 'single' | 'multiple';
  selectedKeys?: Iterable<string>;
  onSelectionChange?: (keys: Selection) => void;
  onRemove?: (keys: Set<string>) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'surface';
  isDisabled?: boolean;
  className?: string;
  tagClassName?: string;
  'aria-label'?: string;
}

const NTagGroupComponent: React.FC<NTagGroupProps> = memo(
  ({
    items,
    selectionMode = 'none',
    selectedKeys,
    onSelectionChange,
    onRemove,
    size = 'md',
    variant = 'default',
    isDisabled = false,
    className = '',
    tagClassName = '',
    'aria-label': ariaLabel = 'Tags'
  }) => {
    return (
      <TagGroup
        selectionMode={selectionMode}
        selectedKeys={selectedKeys}
        onSelectionChange={onSelectionChange}
        onRemove={keys => onRemove?.(keys as Set<string>)}
        size={size}
        variant={variant}
        className={cn('nyn-tag-group', className)}
        aria-label={ariaLabel}>
        <TagGroup.List items={items}>
          {(item: NTagItem) => (
            <Tag id={item.id} textValue={item.label} className={cn(tagClassName)}>
              {item.label}
              {onRemove && <Tag.RemoveButton />}
            </Tag>
          )}
        </TagGroup.List>
      </TagGroup>
    );
  }
);

NTagGroupComponent.displayName = 'NTagGroup';

export const NTagGroup = NTagGroupComponent;
