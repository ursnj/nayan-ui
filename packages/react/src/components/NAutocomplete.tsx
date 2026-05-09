import React, { memo } from 'react';
import { Autocomplete, ListBox } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NAutocompleteItem {
  id: string;
  label: string;
}

export interface NAutocompleteProps {
  items: NAutocompleteItem[];
  placeholder?: string;
  selectedKey?: string;
  onSelectionChange?: (key: string | null) => void;
  onClear?: () => void;
  variant?: 'primary' | 'secondary';
  isDisabled?: boolean;
  isInvalid?: boolean;
  fullWidth?: boolean;
  className?: string;
  popoverClassName?: string;
  'aria-label'?: string;
}

const NAutocompleteComponent: React.FC<NAutocompleteProps> = memo(
  ({
    items,
    placeholder = 'Search...',
    selectedKey,
    onSelectionChange,
    onClear,
    variant = 'primary',
    isDisabled = false,
    isInvalid = false,
    fullWidth = false,
    className = '',
    popoverClassName = '',
    'aria-label': ariaLabel = 'Search'
  }) => {
    return (
      <Autocomplete
        placeholder={placeholder}
        selectedKey={selectedKey}
        onSelectionChange={key => onSelectionChange?.(key as string | null)}
        onClear={onClear}
        variant={variant}
        isDisabled={isDisabled}
        isInvalid={isInvalid}
        fullWidth={fullWidth}
        className={cn('nyn-autocomplete', className)}
        aria-label={ariaLabel}>
        <Autocomplete.Trigger>
          <Autocomplete.Value />
          <Autocomplete.Indicator />
        </Autocomplete.Trigger>
        <Autocomplete.Popover className={cn(popoverClassName)}>
          <Autocomplete.Filter>
            <ListBox items={items}>{(item: NAutocompleteItem) => <ListBox.Item id={item.id} textValue={item.label}>{item.label}</ListBox.Item>}</ListBox>
          </Autocomplete.Filter>
        </Autocomplete.Popover>
      </Autocomplete>
    );
  }
);

NAutocompleteComponent.displayName = 'NAutocomplete';

export const NAutocomplete = NAutocompleteComponent;
