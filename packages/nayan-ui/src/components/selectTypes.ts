import type { ComponentOption, ComponentProps } from './types';

/** Shared select description. Rust owns selected values, filtering and popup state. */
export interface ComponentSelectProps<
  Option extends ComponentOption = ComponentOption,
  Multi extends boolean = false,
  Change = Option | null
> extends Omit<ComponentProps, 'value' | 'defaultValue' | 'selected' | 'items' | 'options' | 'onChange' | 'onValueChange'> {
  isMulti?: Multi;
  multiple?: Multi;
  value?: Multi extends true ? readonly (Option | string)[] : Option | string | null;
  selected?: Multi extends true ? readonly (Option | string)[] : Option | string | null;
  defaultValue?: Multi extends true ? readonly (Option | string)[] : Option | string | null;
  items?: readonly (Option | string)[];
  options?: readonly (Option | string)[];
  isClearable?: boolean;
  isSearchable?: boolean;
  selectLabel?: string;
  triggerClassName?: string;
  selectClassName?: string;
  noOptionsMessage?: string;
  onChange?: (value: Multi extends true ? Exclude<Change, null>[] : Change) => void;
  onChangeOptions?: (value: Multi extends true ? Option[] : Option | null) => void;
  onValueChange?: (value: Multi extends true ? string[] : string) => void;
}
