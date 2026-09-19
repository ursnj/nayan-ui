import React from "react";
import { SearchField, type SearchFieldProps, cn } from "heroui-native";

export interface NSearchFieldProps extends Omit<SearchFieldProps, "children"> {
  placeholder?: string;
  /** Hides the magnifier at the start of the field. */
  hideSearchIcon?: boolean;
  /** Hides the clear button that appears once there is text. */
  hideClearButton?: boolean;
  groupClassName?: string;
  inputClassName?: string;
}

export const NSearchField = React.memo<NSearchFieldProps>(
  ({
    placeholder = "Search...",
    hideSearchIcon = false,
    hideClearButton = false,
    className,
    groupClassName,
    inputClassName,
    ...props
  }) => {
    return (
      <SearchField className={cn("mb-3", className)} {...props}>
        <SearchField.Group className={cn(groupClassName)}>
          {!hideSearchIcon && <SearchField.SearchIcon />}
          <SearchField.Input
            className={cn("text-[16px]", inputClassName)}
            placeholder={placeholder}
          />
          {!hideClearButton && <SearchField.ClearButton />}
        </SearchField.Group>
      </SearchField>
    );
  },
);

NSearchField.displayName = "NSearchField";
