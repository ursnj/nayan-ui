export const accordionAttributes = [
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'itemClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'triggerClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'contentClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'type', type: 'AccordionTypes', default: 'AccordionTypes.SINGLE', details: 'You can pass type of the accordion.' },
  { name: 'items', type: 'AccordionListItem[]', default: 'Required', details: 'You can pass list of accordion items.' },
  {
    name: 'keyExtractor',
    type: '(item: T, index: number) => string | number',
    default: 'Optional',
    details: 'Custom key extractor function for items.'
  },
  {
    name: 'renderTrigger',
    type: '(item: T, index: number) => React.ReactNode',
    default: 'Optional',
    details: 'Custom render function for accordion triggers.'
  },
  {
    name: 'renderContent',
    type: '(item: T, index: number) => React.ReactNode',
    default: 'Optional',
    details: 'Custom render function for accordion content.'
  }
];

export const alertAttributes = [
  { name: 'type', type: 'AlertTypes', default: 'Required', details: 'You can pass type of the alert.' },
  { name: 'message', type: 'string', default: 'Optional', details: 'You can pass alert message.' },
  { name: 'title', type: 'string', default: 'Optional', details: 'You can pass alert title.' },
  { name: 'icon', type: 'React.ReactNode', default: 'Optional', details: 'Custom icon for the alert.' },
  { name: 'actions', type: 'React.ReactNode', default: 'Optional', details: 'Custom actions for the alert.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'titleClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'messageClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'closeClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'onClose', type: '() => void', default: 'Optional', details: 'You can get callback when alert got closed.' },
  { name: 'role', type: "'alert' | 'status'", default: 'Optional', details: 'ARIA role for accessibility.' },
  { name: 'children', type: 'React.ReactNode', default: 'Optional', details: 'Custom content for the alert.' }
];

export const badgeAttributes = [
  { name: 'size', type: 'BadgeSize', default: 'BadgeSize.SM', details: 'You can pass size of the badge.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'You can pass badge content as children.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'role', type: 'string', default: 'Optional', details: 'ARIA role for accessibility.' }
];

export const buttonAttributes = [
  { name: 'size', type: 'ButtonSize', default: 'ButtonSize.MD', details: 'You can pass size of the button.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'isOutline', type: 'boolean', default: 'false', details: 'You can pass this to create outline button.' },
  { name: 'isLoading', type: 'boolean', default: 'false', details: 'You can pass this to show loading indication.' },
  { name: 'loadingText', type: 'string', default: "' '", details: 'You can pass this to show customised loading text.' },
  { name: 'leftIcon', type: 'React.ReactNode', default: 'Optional', details: 'Icon to display on the left side of button.' },
  { name: 'rightIcon', type: 'React.ReactNode', default: 'Optional', details: 'Icon to display on the right side of button.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'You can pass button content as children.' }
];

export const buttonGroupAttributes = [
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'buttonClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'items', type: 'T[]', default: 'Required', details: 'You can pass items for the button group.' },
  { name: 'selected', type: 'T', default: 'Required', details: 'You can pass default selected item.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'You can pass disable state to disable items.' },
  { name: 'onChange', type: '(selected: T) => void', default: 'Required', details: 'You can get callback when button group changed.' },
  { name: 'keyExtractor', type: '(item: T, idx: number) => string | number', default: 'Optional', details: 'Custom key extractor function.' },
  {
    name: 'renderButton',
    type: '(item: T, selected: boolean, idx: number) => React.ReactNode',
    default: 'Optional',
    details: 'Custom render function for buttons.'
  },
  { name: 'ariaLabel', type: 'string', default: 'Optional', details: 'ARIA label for accessibility.' }
];

export const cardAttributes = [
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'You can pass card content as children.' },
  {
    name: 'onClick',
    type: '(e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => void',
    default: 'Optional',
    details: 'You can get callback when card is clicked.'
  }
];

export const checkboxAttributes = [
  { name: 'id', type: 'string', default: 'Optional', details: 'You can pass id to create unique identifier.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'checkClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'You can pass disable state.' },
  { name: 'checked', type: 'boolean', default: 'Required', details: 'You can pass checked state.' },
  { name: 'onChange', type: '(checked: boolean) => void', default: 'Required', details: 'You can get callback when checkbox state changes.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Label content for the checkbox.' },
  { name: 'renderLabel', type: '(children: React.ReactNode) => React.ReactNode', default: 'Optional', details: 'Custom render function for label.' }
];

export const confirmAlertAttributes = [
  { name: 'isOpen', type: 'boolean', default: 'Required', details: 'Controls whether the confirm alert is open.' },
  { name: 'message', type: 'string', default: 'Required', details: 'The confirmation message to display.' },
  { name: 'title', type: 'string', default: 'Optional', details: 'Title for the confirmation dialog.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'titleClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'messageClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'cancelClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'confirmClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'confirmText', type: 'string', default: 'Optional', details: 'Custom text for confirm button.' },
  { name: 'cancelText', type: 'string', default: 'Optional', details: 'Custom text for cancel button.' },
  { name: 'onResult', type: '(result: boolean) => void', default: 'Required', details: 'Callback when user confirms or cancels.' },
  { name: 'onClose', type: '() => void', default: 'Required', details: 'Callback when dialog is closed.' },
  { name: 'children', type: 'React.ReactNode', default: 'Optional', details: 'Custom content for the dialog.' },
  {
    name: 'renderActions',
    type: '(onResult: (result: boolean) => void) => React.ReactNode',
    default: 'Optional',
    details: 'Custom render function for actions.'
  },
  {
    name: 'renderHeader',
    type: '(title: string, message: string) => React.ReactNode',
    default: 'Optional',
    details: 'Custom render function for header.'
  }
];

export const dialogAttributes = [
  { name: 'isOpen', type: 'boolean', default: 'Required', details: 'Controls whether the dialog is open.' },
  { name: 'title', type: 'string', default: 'Required', details: 'Title for the dialog.' },
  { name: 'size', type: 'DialogSize', default: 'Optional', details: 'Size of the dialog.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'titleClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'headerClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'contentClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Content for the dialog.' },
  { name: 'onClose', type: '() => void', default: 'Required', details: 'Callback when dialog is closed.' },
  { name: 'renderHeader', type: '(title: string) => React.ReactNode', default: 'Optional', details: 'Custom render function for header.' },
  { name: 'renderFooter', type: '() => React.ReactNode', default: 'Optional', details: 'Custom render function for footer.' }
];

export const dividerAttributes = [
  { name: 'children', type: 'React.ReactNode', default: 'Optional', details: 'Content to display in the divider.' },
  { name: 'childrenClassName', type: 'string', default: "' '", details: 'You can customise children by passing tailwind classes.' },
  { name: 'separatorClassName', type: 'string', default: "' '", details: 'You can customise separator by passing tailwind classes.' }
];

export const formInputAttributes = [
  { name: 'id', type: 'string', default: 'Optional', details: 'You can pass id to create unique identifier.' },
  { name: 'type', type: 'string', default: 'Optional', details: 'Input type (text, email, password, etc.).' },
  { name: 'label', type: 'string', default: 'Optional', details: 'Label for the input field.' },
  { name: 'placeholder', type: 'string', default: 'Optional', details: 'Placeholder text for the input.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'inputClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'control', type: 'Control<TFieldValues>', default: 'Required', details: 'React Hook Form control object.' },
  { name: 'rules', type: 'RegisterOptions', default: 'Optional', details: 'Validation rules for the field.' },
  { name: 'name', type: 'string', default: 'Required', details: 'Field name for form registration.' },
  { name: 'error', type: 'FieldError', default: 'Optional', details: 'Error object from form validation.' },
  { name: 'renderError', type: '(error?: FieldError) => React.ReactNode', default: 'Optional', details: 'Custom render function for errors.' }
];

export const infiniteScrollAttributes = [
  { name: 'next', type: 'function', default: 'Required', details: 'Function to load next set of data.' },
  { name: 'hasMore', type: 'boolean', default: 'Required', details: 'Whether there is more data to load.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Content to display in the scroll container.' },
  { name: 'loader', type: 'React.ReactNode', default: 'Required', details: 'Loading indicator component.' },
  { name: 'scrollThreshold', type: 'number | string', default: 'Optional', details: 'Threshold for triggering next load.' },
  { name: 'endMessage', type: 'React.ReactNode', default: 'Optional', details: 'Message to show when no more data.' },
  { name: 'style', type: 'CSSProperties', default: 'Optional', details: 'Custom styles for the container.' },
  { name: 'height', type: 'number | string', default: 'Optional', details: 'Height of the scroll container.' },
  { name: 'scrollableTarget', type: 'HTMLElement | string | null', default: 'Optional', details: 'Target element for scrolling.' },
  { name: 'hasChildren', type: 'boolean', default: 'Optional', details: 'Whether container has children.' },
  { name: 'inverse', type: 'boolean', default: 'Optional', details: 'Whether to use inverse scrolling.' },
  { name: 'pullDownToRefresh', type: 'boolean', default: 'Optional', details: 'Enable pull to refresh functionality.' },
  { name: 'pullDownToRefreshContent', type: 'React.ReactNode', default: 'Optional', details: 'Content for pull to refresh.' },
  { name: 'releaseToRefreshContent', type: 'React.ReactNode', default: 'Optional', details: 'Content for release to refresh.' },
  { name: 'pullDownToRefreshThreshold', type: 'number', default: 'Optional', details: 'Threshold for pull to refresh.' },
  { name: 'refreshFunction', type: 'function', default: 'Optional', details: 'Function to call on refresh.' },
  { name: 'onScroll', type: '(e: Event) => any', default: 'Optional', details: 'Scroll event handler.' },
  { name: 'dataLength', type: 'number', default: 'Required', details: 'Length of current data array.' },
  { name: 'initialScrollY', type: 'number', default: 'Optional', details: 'Initial scroll position.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'aria-label', type: 'string', default: 'Optional', details: 'ARIA label for accessibility.' }
];

export const inputAttributes = [
  { name: 'id', type: 'string', default: 'Optional', details: 'You can pass id to create unique identifier.' },
  { name: 'label', type: 'React.ReactNode', default: 'Optional', details: 'Label for the input field.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'inputClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'wrapperClassName', type: 'string', default: "' '", details: 'You can customise wrapper by passing tailwind classes.' },
  { name: 'error', type: 'React.ReactNode', default: 'Optional', details: 'Error message to display.' },
  { name: 'helperText', type: 'React.ReactNode', default: 'Optional', details: 'Helper text to display.' },
  { name: 'onChange', type: '(e: React.ChangeEvent<HTMLInputElement>) => void', default: 'Optional', details: 'Change event handler.' }
];

export const linkAttributes = [
  { name: 'href', type: 'string', default: 'Optional', details: 'URL for anchor links.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Link content.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' }
];

export const linkifyAttributes = [
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Content to linkify.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'anchorProps', type: 'AnchorHTMLAttributes<HTMLAnchorElement>', default: 'Optional', details: 'Props for generated anchor elements.' },
  { name: 'linkComponent', type: 'React.ComponentType<any>', default: 'Optional', details: 'Custom link component to use.' }
];

export const loadingAttributes = [
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'aria-label', type: 'string', default: 'Optional', details: 'ARIA label for accessibility.' }
];

export const menuAttributes = [
  { name: 'size', type: 'MenuSize', default: 'Optional', details: 'Size of the menu.' },
  { name: 'title', type: 'React.ReactNode', default: 'Optional', details: 'Title for the menu.' },
  { name: 'side', type: "'top' | 'bottom' | 'right' | 'left'", default: 'Optional', details: 'Side where menu appears.' },
  { name: 'align', type: "'start' | 'end' | 'center'", default: 'Optional', details: 'Alignment of the menu.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'triggerClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'titleClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'trigger', type: 'React.ReactNode', default: 'Required', details: 'Trigger element for the menu.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Menu content.' }
];

export const menuItemAttributes = [
  { name: 'title', type: 'React.ReactNode', default: 'Required', details: 'Title for the menu item.' },
  { name: 'shortcut', type: 'string', default: 'Optional', details: 'Keyboard shortcut to display.' },
  { name: 'icon', type: 'ElementType | React.ReactNode', default: 'Optional', details: 'Icon for the menu item.' },
  { name: 'separator', type: 'boolean', default: 'false', details: 'Whether to show separator after item.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'iconClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'titleClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'shortcutClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Whether the menu item is disabled.' }
];

export const menuNestedAttributes = [
  { name: 'size', type: 'Size', default: 'Optional', details: 'Size of the nested menu.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'triggerClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'trigger', type: 'React.ReactElement', default: 'Required', details: 'Trigger element for the nested menu.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Nested menu content.' },
  { name: 'aria-label', type: 'string', default: 'Optional', details: 'ARIA label for accessibility.' }
];

export const popoverAttributes = [
  { name: 'size', type: 'PopoverSize', default: 'Optional', details: 'Size of the popover.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'triggerClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'trigger', type: 'React.ReactElement', default: 'Required', details: 'Trigger element for the popover.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Popover content.' },
  { name: 'side', type: "'top' | 'bottom' | 'right' | 'left'", default: 'Optional', details: 'Side where popover appears.' },
  { name: 'align', type: "'start' | 'end' | 'center'", default: 'Optional', details: 'Alignment of the popover.' },
  { name: 'popoverId', type: 'string', default: 'Optional', details: 'ID for the popover.' },
  { name: 'popoverLabel', type: 'string', default: 'Optional', details: 'Label for the popover.' },
  { name: 'triggerProps', type: 'React.HTMLAttributes<HTMLElement>', default: 'Optional', details: 'Props for trigger element.' },
  { name: 'contentProps', type: 'React.HTMLAttributes<HTMLDivElement>', default: 'Optional', details: 'Props for content element.' }
];

export const progressAttributes = [
  { name: 'value', type: 'number', default: 'Required', details: 'Current progress value.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'label', type: 'string', default: 'Optional', details: 'Label for the progress bar.' },
  { name: 'showLabel', type: 'boolean', default: 'Optional', details: 'Whether to show the label.' }
];

export const radioGroupAttributes = [
  { name: 'orientation', type: "'horizontal' | 'vertical'", default: 'Optional', details: 'Orientation of radio group.' },
  { name: 'items', type: 'RadioItem[]', default: 'Required', details: 'Array of radio items.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'id', type: 'string', default: 'Optional', details: 'ID for the radio group.' },
  { name: 'label', type: 'string', default: 'Optional', details: 'Label for the radio group.' },
  { name: 'itemClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'radioClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Whether the radio group is disabled.' },
  { name: 'value', type: 'string', default: 'Required', details: 'Selected radio value.' },
  { name: 'onChange', type: '(selected: string) => void', default: 'Required', details: 'Callback when selection changes.' },
  { name: 'showLabel', type: 'boolean', default: 'Optional', details: 'Whether to show labels.' }
];

export const selectAttributes = [
  { name: 'isMulti', type: 'boolean', default: 'false', details: 'You can pass isMulti option to switch between single / multi select.' },
  { name: 'label', type: 'string', default: 'Optional', details: 'Label for the select field.' },
  { name: 'placeholder', type: 'string', default: 'Optional', details: 'Placeholder text for the select.' },
  { name: 'isLoading', type: 'boolean', default: 'false', details: 'Whether the select is in loading state.' },
  { name: 'isCreatable', type: 'boolean', default: 'false', details: 'Whether new options can be created.' },
  { name: 'isClearable', type: 'boolean', default: 'false', details: 'Whether the selection can be cleared.' },
  { name: 'isSearchable', type: 'boolean', default: 'true', details: 'Whether the select is searchable.' },
  { name: 'isDisabled', type: 'boolean', default: 'false', details: 'Whether the select is disabled.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'selectClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'value', type: 'OptionType | OptionType[] | null', default: 'Required', details: 'Selected value(s).' },
  { name: 'options', type: 'OptionType[]', default: 'Required', details: 'Array of available options.' },
  { name: 'onCreateOption', type: '(inputValue: string) => void', default: 'Optional', details: 'Callback when new option is created.' },
  { name: 'onChange', type: '(value: OptionType | OptionType[] | null) => void', default: 'Optional', details: 'Callback when selection changes.' },
  {
    name: 'onChangeOptions',
    type: '(value: OptionType | OptionType[] | null) => void',
    default: 'Optional',
    details: 'Alternative change callback.'
  },
  { name: 'getOptionLabel', type: '(option: OptionType) => string', default: 'Optional', details: 'Function to get option label.' },
  { name: 'getOptionValue', type: '(option: OptionType) => string', default: 'Optional', details: 'Function to get option value.' },
  { name: 'inputId', type: 'string', default: 'Optional', details: 'ID for the input element.' },
  { name: 'name', type: 'string', default: 'Optional', details: 'Name attribute for the select.' },
  { name: 'menuPortalTarget', type: 'HTMLElement', default: 'Optional', details: 'Target element for menu portal.' }
];

export const sheetAttributes = [
  { name: 'isOpen', type: 'boolean', default: 'Required', details: 'Controls whether the sheet is open.' },
  { name: 'title', type: 'string', default: 'Optional', details: 'Title for the sheet.' },
  { name: 'size', type: 'SheetSize', default: 'Optional', details: 'Size of the sheet.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'headerClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'titleClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'contentClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Content for the sheet.' },
  { name: 'onCloseSheet', type: '() => void', default: 'Optional', details: 'Callback when sheet is closed.' },
  { name: 'header', type: 'React.ReactNode', default: 'Optional', details: 'Custom header content.' },
  { name: 'footer', type: 'React.ReactNode', default: 'Optional', details: 'Optional footer content.' },
  { name: 'aria-label', type: 'string', default: 'Optional', details: 'ARIA label for accessibility.' },
  { name: 'aria-labelledby', type: 'string', default: 'Optional', details: 'ARIA labelledby for accessibility.' },
  { name: 'role', type: 'string', default: 'Optional', details: 'ARIA role for accessibility.' }
];

export const skeletonAttributes = [
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'role', type: 'string', default: 'Optional', details: 'ARIA role for accessibility.' },
  { name: 'aria-busy', type: 'boolean', default: 'Optional', details: 'ARIA busy state.' },
  { name: 'aria-live', type: "'off' | 'polite' | 'assertive'", default: 'Optional', details: 'ARIA live region.' }
];

export const sliderAttributes = [
  { name: 'label', type: 'React.ReactNode', default: 'Optional', details: 'Label for the slider.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'sliderClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'id', type: 'string', default: 'Optional', details: 'ID for the slider.' },
  { name: 'value', type: 'number', default: 'Optional', details: 'Current slider value.' },
  { name: 'defaultValue', type: 'number', default: 'Optional', details: 'Default slider value.' },
  { name: 'min', type: 'number', default: 'Optional', details: 'Minimum slider value.' },
  { name: 'max', type: 'number', default: 'Optional', details: 'Maximum slider value.' },
  { name: 'step', type: 'number', default: 'Optional', details: 'Step increment for slider.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Whether the slider is disabled.' },
  { name: 'orientation', type: "'horizontal' | 'vertical'", default: 'Optional', details: 'Orientation of the slider.' },
  { name: 'onChange', type: '(value: number) => void', default: 'Optional', details: 'Callback when value changes.' },
  { name: 'aria-label', type: 'string', default: 'Optional', details: 'ARIA label for accessibility.' },
  { name: 'aria-labelledby', type: 'string', default: 'Optional', details: 'ARIA labelledby for accessibility.' },
  { name: 'aria-valuetext', type: 'string', default: 'Optional', details: 'ARIA value text for accessibility.' }
];

export const switchAttributes = [
  { name: 'enabled', type: 'boolean', default: 'Optional', details: 'Whether the switch is enabled.' },
  { name: 'defaultChecked', type: 'boolean', default: 'Optional', details: 'Default checked state.' },
  { name: 'label', type: 'React.ReactNode', default: 'Optional', details: 'Label for the switch.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'switchClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'onChange', type: '(checked: boolean) => void', default: 'Optional', details: 'Callback when switch state changes.' },
  { name: 'id', type: 'string', default: 'Optional', details: 'ID for the switch.' }
];

export const tableAttributes = [
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'captionClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'headerClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'headerRowClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'headerCellClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'bodyClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'bodyRowClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'bodyCellClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'caption', type: 'string', default: 'Optional', details: 'Caption for the table.' },
  { name: 'columns', type: 'NTableColumn<T>[]', default: 'Required', details: 'Array of table columns.' },
  { name: 'data', type: 'T[]', default: 'Required', details: 'Array of table data.' },
  { name: 'tableProps', type: 'React.TableHTMLAttributes<HTMLTableElement>', default: 'Optional', details: 'Props for table element.' },
  {
    name: 'rowProps',
    type: '(row: T, rowIndex: number) => React.HTMLAttributes<HTMLTableRowElement>',
    default: 'Optional',
    details: 'Function to get row props.'
  },
  {
    name: 'cellProps',
    type: '(row: T, col: NTableColumn<T>, rowIndex: number, colIndex: number) => React.TdHTMLAttributes<HTMLTableCellElement>',
    default: 'Optional',
    details: 'Function to get cell props.'
  }
];

export const tabsAttributes = [
  { name: 'isFull', type: 'boolean', default: 'Optional', details: 'Whether tabs should take full width.' },
  { name: 'items', type: 'string[]', default: 'Required', details: 'Array of tab items.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Tab content.' },
  { name: 'selected', type: 'string', default: 'Required', details: 'Currently selected tab.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'itemClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'activeItemClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'onChange', type: '(selected: string) => void', default: 'Required', details: 'Callback when tab changes.' },
  { name: 'ariaLabel', type: 'string', default: 'Optional', details: 'ARIA label for accessibility.' },
  { name: 'id', type: 'string', default: 'Optional', details: 'ID for the tabs.' }
];

export const tabsContentAttributes = [
  { name: 'item', type: 'string', default: 'Required', details: 'Tab item identifier.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Content for the tab.' }
];

export const textareaAttributes = [
  { name: 'id', type: 'string', default: 'Optional', details: 'You can pass id to create unique identifier.' },
  { name: 'label', type: 'React.ReactNode', default: 'Optional', details: 'Label for the textarea.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'textareaClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'error', type: 'React.ReactNode', default: 'Optional', details: 'Error message to display.' },
  { name: 'helperText', type: 'React.ReactNode', default: 'Optional', details: 'Helper text to display.' },
  { name: 'onChange', type: '(e: React.ChangeEvent<HTMLTextAreaElement>) => void', default: 'Optional', details: 'Change event handler.' }
];

export const themeAttributes = [
  { name: 'theme', type: 'ThemeType', default: 'Optional', details: 'Theme type to apply.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Content to wrap with theme.' },
  { name: 'onThemeChange', type: '(theme: string) => void', default: 'Optional', details: 'Callback when theme changes.' }
];

export const toastAttributes = [
  { name: 'description', type: 'string', default: 'Required', details: 'Toast message description.' },
  { name: 'title', type: 'string', default: 'Optional', details: 'Toast title.' }
];

export const tooltipAttributes = [
  { name: 'message', type: 'React.ReactNode', default: 'Required', details: 'Tooltip message or content.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'triggerClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Tooltip trigger content.' },
  { name: 'placement', type: "'top' | 'bottom' | 'left' | 'right'", default: 'Optional', details: 'Placement of the tooltip.' },
  { name: 'delayShow', type: 'number', default: 'Optional', details: 'Delay in ms before showing.' },
  { name: 'delayHide', type: 'number', default: 'Optional', details: 'Delay in ms before hiding.' },
  { name: 'id', type: 'string', default: 'Optional', details: 'ID for accessibility.' },
  { name: 'ariaLabel', type: 'string', default: 'Optional', details: 'ARIA label for accessibility.' },
  { name: 'triggerProps', type: 'React.HTMLAttributes<HTMLElement>', default: 'Optional', details: 'Props for trigger element.' },
  { name: 'contentProps', type: 'React.HTMLAttributes<HTMLDivElement>', default: 'Optional', details: 'Props for content element.' }
];
