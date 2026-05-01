import React from 'react';
import { TagGroup, type TagGroupProps } from 'heroui-native';
import { cn } from '../lib/utils';

export interface TagItem {
  label: string;
  value: string;
  isDisabled?: boolean;
}

export interface NTagGroupProps extends Omit<TagGroupProps, 'children'> {
  items: TagItem[];
  listClassName?: string;
  itemClassName?: string;
}

export const NTagGroup = React.memo<NTagGroupProps>(
  ({ items, className, listClassName, itemClassName, ...props }) => {
    return (
      <TagGroup className={cn(className)} {...props}>
        <TagGroup.List className={cn(listClassName)}>
          {items.map((item) => (
            <TagGroup.Item key={item.value} id={item.value} isDisabled={item.isDisabled} className={cn(itemClassName)}>
              <TagGroup.ItemLabel>{item.label}</TagGroup.ItemLabel>
            </TagGroup.Item>
          ))}
        </TagGroup.List>
      </TagGroup>
    );
  }
);

NTagGroup.displayName = 'NTagGroup';
