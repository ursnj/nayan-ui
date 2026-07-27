import React, { memo } from 'react';
import { Autocomplete, ListBox, SearchField, useFilter } from '@heroui/react';
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
  disabled?: boolean;
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
    disabled = false,
    isInvalid = false,
    fullWidth = false,
    className = '',
    popoverClassName = '',
    'aria-label': ariaLabel = 'Search'
  }) => {
    const { contains } = useFilter({ sensitivity: 'base' });

    return (
      <Autocomplete
        placeholder={placeholder}
        selectedKey={selectedKey}
        onSelectionChange={key => onSelectionChange?.(key as string | null)}
        onClear={onClear}
        variant={variant}
        isDisabled={disabled}
        isInvalid={isInvalid}
        fullWidth={fullWidth}
        className={cn('nyn-autocomplete', className)}
        aria-label={ariaLabel}>
        <Autocomplete.Trigger>
          <Autocomplete.Value />
          {onClear && <Autocomplete.ClearButton />}
          <Autocomplete.Indicator />
        </Autocomplete.Trigger>
        <Autocomplete.Popover className={cn(popoverClassName)}>
          <Autocomplete.Filter filter={contains}>
            <SearchField aria-label={`${ariaLabel} filter`}>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder={placeholder} />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
            <ListBox items={items}>
              {(item: NAutocompleteItem) => (
                <ListBox.Item id={item.id} textValue={item.label}>
                  {item.label}
                </ListBox.Item>
              )}
            </ListBox>
          </Autocomplete.Filter>
        </Autocomplete.Popover>
      </Autocomplete>
    );
  }
);

NAutocompleteComponent.displayName = 'NAutocomplete';

export const NAutocomplete = NAutocompleteComponent;
