import React, { memo } from 'react';
import { SearchField } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NSearchFieldProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  className?: string;
  'aria-label'?: string;
}

const NSearchFieldComponent: React.FC<NSearchFieldProps> = memo(
  ({
    value,
    defaultValue,
    onChange,
    onSubmit,
    onClear,
    placeholder = 'Search...',
    isDisabled = false,
    isInvalid = false,
    variant = 'primary',
    fullWidth = false,
    className = '',
    'aria-label': ariaLabel = 'Search'
  }) => {
    return (
      <SearchField
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onSubmit={onSubmit}
        onClear={onClear}
        isDisabled={isDisabled}
        isInvalid={isInvalid}
        variant={variant}
        fullWidth={fullWidth}
        className={cn('nyn-search-field', className)}
        aria-label={ariaLabel}>
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder={placeholder} />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
    );
  }
);

NSearchFieldComponent.displayName = 'NSearchField';

export const NSearchField = NSearchFieldComponent;
