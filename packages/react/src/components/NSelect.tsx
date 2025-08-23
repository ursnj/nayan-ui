import React, { memo, useCallback, useId } from 'react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { cn } from '../lib/utils';
import { ReactSelectOption } from './Types';
import { reactSelectCustomClassNames, reactSelectTheme } from './Utils';
import { Label } from './ui/label';

export interface NSelectProps<OptionType = ReactSelectOption, IsMulti extends boolean = false> {
  isMulti?: IsMulti;
  label?: string;
  placeholder?: string;
  isLoading?: boolean;
  isCreatable?: boolean;
  isClearable?: boolean;
  isSearchable?: boolean;
  isDisabled?: boolean;
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
    isSearchable = false,
    isClearable = false,
    isDisabled = false,
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
    ...rest
  } = props;
  const generatedId = useId();
  const selectId = inputId || `nyn-select-${generatedId}`;

  // Accept both onChange and onChangeOptions for compatibility
  const handleChange = useCallback(
    (selected: any) => {
      if (props.onChangeOptions) {
        props.onChangeOptions(selected);
      } else if (onChange) {
        onChange(selected);
      }
    },
    [onChange, props]
  );

  const handleCreate = useCallback(
    (inputValue: string) => {
      if (onCreateOption) onCreateOption(inputValue);
    },
    [onCreateOption]
  );

  const SelectComponent = isCreatable ? CreatableSelect : Select;

  return (
    <div className={cn('nyn-select-block mb-3', className)}>
      {label && (
        <Label htmlFor={selectId} className={cn('nyn-select-label block pb-2 text-text', labelClassName)}>
          {label}
        </Label>
      )}
      <SelectComponent
        inputId={selectId}
        name={name}
        isMulti={isMulti}
        isLoading={isLoading}
        isDisabled={isDisabled}
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
        aria-label={label}
        menuPortalTarget={typeof window !== 'undefined' ? menuPortalTarget || document.body : undefined}
        {...rest}
      />
    </div>
  );
};

export const NSelect = memo(NSelectInner) as typeof NSelectInner;

(NSelect as React.FC).displayName = 'NSelect';
