import React, { memo, useCallback, useId } from 'react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { Label } from '@heroui/react';
import { cn } from '../lib/utils';
import { ReactSelectOption } from './Types';
import { reactSelectCustomClassNames, reactSelectTheme } from './Utils';

export interface NSelectProps<OptionType = ReactSelectOption, IsMulti extends boolean = false> {
  isMulti?: IsMulti;
  label?: string;
  placeholder?: string;
  isLoading?: boolean;
  isCreatable?: boolean;
  isClearable?: boolean;
  isSearchable?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  selectClassName?: string;
  value: IsMulti extends true ? OptionType[] : OptionType | null;
  options?: OptionType[];
  /** Alias of `options`, as the React Native package names it. */
  items?: OptionType[];
  onCreateOption?: (inputValue: string) => void;
  onChange?: (value: IsMulti extends true ? OptionType[] : OptionType | null) => void;
  onChangeOptions?: (value: IsMulti extends true ? OptionType[] : OptionType | null) => void;
  getOptionLabel?: (option: OptionType) => string;
  getOptionValue?: (option: OptionType) => string;
  inputId?: string;
  name?: string;
  menuPortalTarget?: HTMLElement;
  'aria-label'?: string;
  styles?: Record<string, unknown>;
  [key: string]: any; // for additional react-select props
}

const NSelectInner = <OptionType extends ReactSelectOption = ReactSelectOption, IsMulti extends boolean = false>(
  props: NSelectProps<OptionType, IsMulti>
) => {
  const {
    options,
    items,
    value,
    label,
    isMulti = false as IsMulti,
    isLoading = false,
    isCreatable = false,
    placeholder = 'Select...',
    isSearchable = true,
    isClearable = false,
    disabled = false,
    className = '',
    labelClassName = '',
    selectClassName = '',
    onChange,
    onChangeOptions,
    onCreateOption,
    getOptionLabel,
    getOptionValue,
    inputId,
    name,
    menuPortalTarget,
    'aria-label': ariaLabel,
    styles,
    ...rest
  } = props;
  const optionList = options ?? items ?? [];
  const generatedId = useId();
  const selectId = inputId || `nyn-select-${generatedId}`;

  const handleChange = useCallback(
    (selected: any) => {
      if (onChangeOptions) {
        onChangeOptions(selected);
      } else if (onChange) {
        onChange(selected);
      }
    },
    [onChange, onChangeOptions]
  );

  const handleCreate = useCallback(
    (inputValue: string) => {
      if (onCreateOption) onCreateOption(inputValue);
    },
    [onCreateOption]
  );

  const SelectComponent = isCreatable ? CreatableSelect : Select;

  // menuPosition="fixed" rather than a portal: a portalled menu is an outside press, which dismisses a dialog or sheet.
  const mergedStyles = {
    menuPortal: (base: Record<string, unknown>) => ({ ...base, zIndex: 9999 }),
    menu: (base: Record<string, unknown>) => ({ ...base, zIndex: 50 }),
    ...styles
  };

  return (
    <div className={cn('nyn-select-block mb-3', className)}>
      {label && (
        <Label htmlFor={selectId} className={cn(labelClassName)}>
          {label}
        </Label>
      )}
      <SelectComponent
        inputId={selectId}
        name={name}
        isMulti={isMulti}
        isLoading={isLoading}
        isDisabled={disabled}
        isClearable={isClearable}
        isSearchable={isSearchable}
        className={cn('nyn-select', selectClassName)}
        placeholder={placeholder}
        classNamePrefix="nyn-select"
        value={isMulti ? (value as OptionType[]) : (value as OptionType | null)}
        options={optionList}
        getOptionLabel={getOptionLabel}
        getOptionValue={getOptionValue}
        classNames={reactSelectCustomClassNames}
        onChange={handleChange}
        onCreateOption={isCreatable ? handleCreate : undefined}
        theme={reactSelectTheme}
        aria-label={ariaLabel || label || 'Select'}
        menuPortalTarget={menuPortalTarget}
        styles={mergedStyles as any}
        menuPosition="fixed"
        menuShouldScrollIntoView={false}
        {...rest}
      />
    </div>
  );
};

export const NSelect = memo(NSelectInner) as typeof NSelectInner;

(NSelect as React.FC).displayName = 'NSelect';
