import React from 'react';
import { ListGroup, type ListGroupRootProps, cn } from 'heroui-native';

export interface ListGroupItem {
  value: string;
  title: string;
  description?: string;
  /** Rendered before the title — an icon or an avatar. */
  prefix?: React.ReactNode;
  /** Rendered at the end of the row. Defaults to a chevron when the row is pressable. */
  suffix?: React.ReactNode;
  isDisabled?: boolean;
  onPress?: () => void;
}

export interface NListGroupProps extends Omit<ListGroupRootProps, 'children'> {
  items: ListGroupItem[];
  itemClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export const NListGroup = React.memo<NListGroupProps>(({ items, className, itemClassName, titleClassName, descriptionClassName, ...props }) => {
  return (
    <ListGroup className={cn(className)} {...props}>
      {items.map(item => (
        <ListGroup.Item key={item.value} disabled={item.isDisabled} onPress={item.onPress} className={cn(itemClassName)}>
          {item.prefix && <ListGroup.ItemPrefix>{item.prefix}</ListGroup.ItemPrefix>}
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle className={cn(titleClassName)}>{item.title}</ListGroup.ItemTitle>
            {item.description && <ListGroup.ItemDescription className={cn(descriptionClassName)}>{item.description}</ListGroup.ItemDescription>}
          </ListGroup.ItemContent>
          {item.suffix ?? (item.onPress ? <ListGroup.ItemSuffix /> : null)}
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
});

NListGroup.displayName = 'NListGroup';
