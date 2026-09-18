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
  options: OptionType[];
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
  const generatedId = useId();
  const selectId = inputId || `nyn-select-${generatedId}`;

  // Accept both onChange and onChangeOptions for compatibility. Read the
  // destructured values rather than `props`, so the callback doesn't depend on
  // the whole props object changing identity every render.
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

  /*
   * The menu needs to escape ancestors that clip their overflow, and the
   * obvious way to do that — portalling to `document.body` — quietly breaks
   * the select inside a dialog or sheet: those trap focus and treat any press
   * outside their own DOM subtree as a dismiss, so clicking an option closes
   * the overlay instead of picking the value.
   *
   * `menuPosition="fixed"` gets the same overflow escape while keeping the
   * menu where it was rendered, so it stays inside the overlay. A caller that
   * really wants a portal can still pass `menuPortalTarget`; the z-index
   * override is here for them, because react-select portals at `z-index: 1`.
   */
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
        options={options}
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
