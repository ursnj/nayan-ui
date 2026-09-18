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
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'You can pass badge content as children.' },
  { name: 'color', type: "'default' | 'accent' | 'success' | 'warning' | 'danger'", default: "'default'", details: 'Badge color theme.' },
  { name: 'variant', type: "'primary' | 'secondary' | 'soft'", default: "'soft'", details: 'Badge visual variant.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", details: 'Badge size.' },
  { name: 'className', type: 'string', default: "' '", details: 'Additional CSS classes.' },
  { name: 'role', type: 'string', default: "'status'", details: 'ARIA role for accessibility.' }
];

export const buttonAttributes = [
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Disables the button.' },
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
  { name: 'placement', type: "'top' | 'bottom' | 'right' | 'left'", default: "'bottom'", details: 'Side of the trigger the menu opens on.' },
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
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Whether the menu item is disabled.' },
  { name: 'id', type: 'string', default: 'Optional', details: 'Item key, for selection and for React Aria collections.' },
  { name: 'onAction', type: '() => void', default: 'Optional', details: 'Called when the item is chosen, by click or by keyboard.' }
];

export const menuNestedAttributes = [
  { name: 'trigger', type: 'React.ReactNode', default: 'Required', details: 'Label for the row that opens the submenu.' },
  { name: 'icon', type: 'React.ReactNode', default: 'Optional', details: 'Rendered before the label, like an item icon.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Submenu content — usually NMenuItem elements.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'triggerClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' }
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
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Whether the select is disabled.' },
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

export const datePickerAttributes = [
  { name: 'value', type: 'DateValue', default: 'Optional', details: 'Controlled date value.' },
  { name: 'defaultValue', type: 'DateValue', default: 'Optional', details: 'Default date value.' },
  { name: 'onChange', type: '(value: DateValue) => void', default: 'Optional', details: 'Callback when date changes.' },
  { name: 'label', type: 'React.ReactNode', default: 'Optional', details: 'Label for the date picker.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Disables the date picker.' },
  { name: 'isInvalid', type: 'boolean', default: 'false', details: 'Marks as invalid.' },
  { name: 'minValue', type: 'DateValue', default: 'Optional', details: 'Minimum selectable date.' },
  { name: 'maxValue', type: 'DateValue', default: 'Optional', details: 'Maximum selectable date.' },
  { name: 'granularity', type: "'day' | 'hour' | 'minute' | 'second'", default: "'day'", details: 'Date granularity.' },
  { name: 'className', type: 'string', default: "' '", details: 'Additional CSS classes.' },
  { name: 'wrapperClassName', type: 'string', default: "' '", details: 'Wrapper CSS classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'Label CSS classes.' },
  { name: 'error', type: 'React.ReactNode', default: 'Optional', details: 'Error message to display.' },
  { name: 'helperText', type: 'React.ReactNode', default: 'Optional', details: 'Helper text below the input.' }
];

export const numberFieldAttributes = [
  { name: 'value', type: 'number', default: 'Optional', details: 'Controlled value.' },
  { name: 'defaultValue', type: 'number', default: 'Optional', details: 'Default value.' },
  { name: 'onChange', type: '(value: number) => void', default: 'Optional', details: 'Callback when value changes.' },
  { name: 'minValue', type: 'number', default: 'Optional', details: 'Minimum value.' },
  { name: 'maxValue', type: 'number', default: 'Optional', details: 'Maximum value.' },
  { name: 'step', type: 'number', default: '1', details: 'Step increment.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Disables the field.' },
  { name: 'isInvalid', type: 'boolean', default: 'false', details: 'Marks as invalid.' },
  { name: 'variant', type: "'primary' | 'secondary'", default: "'primary'", details: 'Visual variant.' },
  { name: 'fullWidth', type: 'boolean', default: 'false', details: 'Full width mode.' },
  { name: 'formatOptions', type: 'Intl.NumberFormatOptions', default: 'Optional', details: 'Number format options (currency, percent, etc).' },
  { name: 'className', type: 'string', default: "' '", details: 'Additional CSS classes.' }
];

export const meterAttributes = [
  { name: 'value', type: 'number', default: 'Required', details: 'Current meter value.' },
  { name: 'minValue', type: 'number', default: '0', details: 'Minimum value.' },
  { name: 'maxValue', type: 'number', default: '100', details: 'Maximum value.' },
  { name: 'label', type: 'React.ReactNode', default: 'Optional', details: 'What is being measured, at the start of the row.' },
  { name: 'output', type: 'React.ReactNode', default: 'Optional', details: 'The reading, at the end of the row. Defaults to a percentage.' },
  { name: 'showOutput', type: 'boolean', default: 'true', details: 'Show the reading.' },
  { name: 'color', type: "'default' | 'accent' | 'success' | 'warning' | 'danger'", default: "'accent'", details: 'Meter color.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", details: 'Meter size.' },
  { name: 'className', type: 'string', default: "' '", details: 'Additional CSS classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'Classes for the label.' },
  { name: 'outputClassName', type: 'string', default: "' '", details: 'Classes for the reading.' },
  { name: 'trackClassName', type: 'string', default: "' '", details: 'Classes for the track.' },
  { name: 'fillClassName', type: 'string', default: "' '", details: 'Classes for the filled portion.' }
];

export const tagGroupAttributes = [
  { name: 'items', type: 'NTagItem[]', default: 'Required', details: 'List of tag items with id and label.' },
  { name: 'selectionMode', type: "'none' | 'single' | 'multiple'", default: "'none'", details: 'Selection mode.' },
  { name: 'selectedKeys', type: 'Iterable<string>', default: 'Optional', details: 'Selected tag keys.' },
  { name: 'onSelectionChange', type: '(keys: Selection) => void', default: 'Optional', details: 'Callback when selection changes.' },
  { name: 'onRemove', type: '(keys: Set<string>) => void', default: 'Optional', details: 'Callback when tags are removed.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", details: 'Tag size.' },
  { name: 'variant', type: "'default' | 'surface'", default: "'default'", details: 'Tag variant.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Disables the tag group.' },
  { name: 'className', type: 'string', default: "' '", details: 'Additional CSS classes.' }
];

export const searchFieldAttributes = [
  { name: 'value', type: 'string', default: 'Optional', details: 'Controlled value.' },
  { name: 'defaultValue', type: 'string', default: 'Optional', details: 'Default value.' },
  { name: 'onChange', type: '(value: string) => void', default: 'Optional', details: 'Callback when value changes.' },
  { name: 'onSubmit', type: '(value: string) => void', default: 'Optional', details: 'Callback on submit.' },
  { name: 'onClear', type: '() => void', default: 'Optional', details: 'Callback when cleared.' },
  { name: 'placeholder', type: 'string', default: "'Search...'", details: 'Placeholder text.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Disables the search field.' },
  { name: 'isInvalid', type: 'boolean', default: 'false', details: 'Marks as invalid.' },
  { name: 'variant', type: "'primary' | 'secondary'", default: "'primary'", details: 'Visual variant.' },
  { name: 'fullWidth', type: 'boolean', default: 'false', details: 'Full width mode.' },
  { name: 'className', type: 'string', default: "' '", details: 'Additional CSS classes.' }
];

export const avatarAttributes = [
  { name: 'src', type: 'string', default: 'Optional', details: 'The src prop.' },
  { name: 'alt', type: 'string', default: "''", details: 'The alt prop.' },
  { name: 'fallback', type: 'React.ReactNode', default: 'Optional', details: 'The fallback prop.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", details: 'The size prop.' },
  { name: 'color', type: "'default' | 'accent' | 'success' | 'warning' | 'danger'", default: "'default'", details: 'The color prop.' },
  { name: 'variant', type: "'default' | 'soft'", default: "'default'", details: 'The variant prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'imageClassName', type: 'string', default: "''", details: 'The imageClassName prop.' },
  { name: 'fallbackClassName', type: 'string', default: "''", details: 'The fallbackClassName prop.' },
  { name: 'loading', type: "'eager' | 'lazy'", default: "'lazy'", details: 'The loading prop.' }
];

export const avatarGroupAttributes = [
  { name: 'items', type: 'NAvatarGroupItem[]', default: 'Required', details: 'The items prop.' },
  { name: 'max', type: 'number', default: 'Optional', details: 'Avatars shown before the rest are collapsed into a count.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", details: 'The size prop.' },
  { name: 'color', type: "'default' | 'accent' | 'success' | 'warning' | 'danger'", default: "'default'", details: 'The color prop.' },
  { name: 'variant', type: "'default' | 'soft'", default: "'default'", details: 'The variant prop.' },
  {
    name: 'overlap',
    type: "'clip' | 'ring'",
    default: "'ring'",
    details: 'How the avatars meet: overlapping with a ring, or clipped into each other.'
  },
  { name: 'isGrid', type: 'boolean', default: 'false', details: 'Lays the avatars out in a grid instead of an overlapping row.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'avatarClassName', type: 'string', default: "''", details: 'The avatarClassName prop.' }
];

export const breadcrumbsAttributes = [
  { name: 'items', type: 'NBreadcrumbItem[]', default: 'Required', details: 'The items prop.' },
  { name: 'separator', type: 'React.ReactNode', default: 'Optional', details: 'The separator prop.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'The disabled prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'itemClassName', type: 'string', default: "''", details: 'The itemClassName prop.' },
  { name: 'aria-label', type: 'string', default: "'Breadcrumbs'", details: 'The aria-label prop.' }
];

export const calendarAttributes = [
  { name: 'value', type: 'any', default: 'Optional', details: 'The value prop.' },
  { name: 'defaultValue', type: 'any', default: 'Optional', details: 'The defaultValue prop.' },
  { name: 'onChange', type: '(value: any) => void', default: 'Optional', details: 'The onChange prop.' },
  { name: 'minValue', type: 'any', default: 'Optional', details: 'The minValue prop.' },
  { name: 'maxValue', type: 'any', default: 'Optional', details: 'The maxValue prop.' },
  {
    name: 'isDateUnavailable',
    type: '(date: any) => boolean',
    default: 'Optional',
    details: 'Dates the user cannot pick, e.g. `date => date.day === 1`.'
  },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'The disabled prop.' },
  { name: 'visibleMonths', type: 'number', default: 'Optional', details: 'Months shown side by side.' },
  { name: 'label', type: 'ReactNode', default: 'Optional', details: 'The label prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'headerClassName', type: 'string', default: "''", details: 'The headerClassName prop.' },
  { name: 'gridClassName', type: 'string', default: "''", details: 'The gridClassName prop.' },
  { name: 'aria-label', type: 'string', default: "'Calendar'", details: 'The aria-label prop.' }
];

export const checkGroupAttributes = [
  { name: 'items', type: 'NCheckGroupItem[]', default: 'Required', details: 'The items prop.' },
  { name: 'value', type: 'string[]', default: 'Required', details: 'The value prop.' },
  { name: 'onChange', type: '(selected: string[]) => void', default: 'Required', details: 'The onChange prop.' },
  { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'vertical'", details: 'The orientation prop.' },
  { name: 'label', type: 'string', default: 'Optional', details: 'The label prop.' },
  { name: 'showLabel', type: 'boolean', default: 'true', details: 'The showLabel prop.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'The disabled prop.' },
  { name: 'id', type: 'string', default: 'Optional', details: 'The id prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'labelClassName', type: 'string', default: "''", details: 'The labelClassName prop.' },
  { name: 'itemClassName', type: 'string', default: "''", details: 'The itemClassName prop.' }
];

export const chipAttributes = [
  { name: 'children', type: 'ReactNode', default: 'Required', details: 'The children prop.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", details: 'The size prop.' },
  { name: 'color', type: "'default' | 'accent' | 'success' | 'warning' | 'danger'", default: "'default'", details: 'The color prop.' },
  { name: 'variant', type: "'primary' | 'secondary' | 'tertiary' | 'soft'", default: "'secondary'", details: 'The variant prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' }
];

export const dateFieldAttributes = [
  { name: 'value', type: 'any', default: 'Optional', details: 'The value prop.' },
  { name: 'defaultValue', type: 'any', default: 'Optional', details: 'The defaultValue prop.' },
  { name: 'onChange', type: '(value: any) => void', default: 'Optional', details: 'The onChange prop.' },
  { name: 'label', type: 'ReactNode', default: 'Optional', details: 'The label prop.' },
  { name: 'minValue', type: 'any', default: 'Optional', details: 'The minValue prop.' },
  { name: 'maxValue', type: 'any', default: 'Optional', details: 'The maxValue prop.' },
  { name: 'granularity', type: "'day' | 'hour' | 'minute' | 'second'", default: "'day'", details: 'The granularity prop.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'The disabled prop.' },
  { name: 'isInvalid', type: 'boolean', default: 'false', details: 'The isInvalid prop.' },
  { name: 'variant', type: "'primary' | 'secondary'", default: "'primary'", details: 'The variant prop.' },
  { name: 'fullWidth', type: 'boolean', default: 'false', details: 'The fullWidth prop.' },
  { name: 'error', type: 'ReactNode', default: 'Optional', details: 'The error prop.' },
  { name: 'helperText', type: 'ReactNode', default: 'Optional', details: 'The helperText prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'labelClassName', type: 'string', default: "''", details: 'The labelClassName prop.' },
  { name: 'aria-label', type: 'string', default: "'Date'", details: 'The aria-label prop.' }
];

export const dateRangePickerAttributes = [
  { name: 'value', type: 'any', default: 'Optional', details: '`{ start, end }` as react-aria date values.' },
  { name: 'defaultValue', type: 'any', default: 'Optional', details: 'The defaultValue prop.' },
  { name: 'onChange', type: '(value: any) => void', default: 'Optional', details: 'The onChange prop.' },
  { name: 'label', type: 'ReactNode', default: 'Optional', details: 'The label prop.' },
  { name: 'minValue', type: 'any', default: 'Optional', details: 'The minValue prop.' },
  { name: 'maxValue', type: 'any', default: 'Optional', details: 'The maxValue prop.' },
  { name: 'granularity', type: "'day' | 'hour' | 'minute' | 'second'", default: "'day'", details: 'The granularity prop.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'The disabled prop.' },
  { name: 'isInvalid', type: 'boolean', default: 'false', details: 'The isInvalid prop.' },
  { name: 'variant', type: "'primary' | 'secondary'", default: "'primary'", details: 'The variant prop.' },
  { name: 'fullWidth', type: 'boolean', default: 'true', details: 'The fullWidth prop.' },
  { name: 'error', type: 'ReactNode', default: 'Optional', details: 'The error prop.' },
  { name: 'helperText', type: 'ReactNode', default: 'Optional', details: 'The helperText prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'labelClassName', type: 'string', default: "''", details: 'The labelClassName prop.' },
  { name: 'aria-label', type: 'string', default: "'Date range'", details: 'The aria-label prop.' }
];

export const disclosureAttributes = [
  { name: 'title', type: 'ReactNode', default: 'Required', details: 'The title prop.' },
  { name: 'children', type: 'ReactNode', default: 'Required', details: 'The children prop.' },
  { name: 'defaultExpanded', type: 'boolean', default: 'false', details: 'The defaultExpanded prop.' },
  { name: 'expanded', type: 'boolean', default: 'Optional', details: 'The expanded prop.' },
  { name: 'onExpandedChange', type: '(expanded: boolean) => void', default: 'Optional', details: 'The onExpandedChange prop.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'The disabled prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'triggerClassName', type: 'string', default: "''", details: 'The triggerClassName prop.' },
  { name: 'contentClassName', type: 'string', default: "''", details: 'The contentClassName prop.' },
  { name: 'indicatorClassName', type: 'string', default: "''", details: 'The indicatorClassName prop.' }
];

export const emptyStateAttributes = [
  { name: 'title', type: 'ReactNode', default: 'Required', details: 'The title prop.' },
  { name: 'message', type: 'ReactNode', default: 'Optional', details: 'The message prop.' },
  { name: 'icon', type: 'ReactNode', default: 'Optional', details: 'Shown above the title — an icon or a small illustration.' },
  { name: 'actions', type: 'ReactNode', default: 'Optional', details: 'Buttons or links under the message.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'iconClassName', type: 'string', default: "''", details: 'The iconClassName prop.' },
  { name: 'titleClassName', type: 'string', default: "''", details: 'The titleClassName prop.' },
  { name: 'messageClassName', type: 'string', default: "''", details: 'The messageClassName prop.' },
  { name: 'actionsClassName', type: 'string', default: "''", details: 'The actionsClassName prop.' },
  { name: 'children', type: 'ReactNode', default: 'Optional', details: 'The children prop.' }
];

export const inputOtpAttributes = [
  { name: 'maxLength', type: 'number', default: 'Required', details: 'The maxLength prop.' },
  { name: 'value', type: 'string', default: 'Optional', details: 'The value prop.' },
  { name: 'onChange', type: '(value: string) => void', default: 'Optional', details: 'The onChange prop.' },
  { name: 'onComplete', type: '(value: string) => void', default: 'Optional', details: 'The onComplete prop.' },
  { name: 'variant', type: "'primary' | 'secondary'", default: "'primary'", details: 'The variant prop.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'The disabled prop.' },
  { name: 'isInvalid', type: 'boolean', default: 'false', details: 'The isInvalid prop.' },
  { name: 'pattern', type: 'string', default: 'Optional', details: 'The pattern prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'slotClassName', type: 'string', default: "''", details: 'The slotClassName prop.' },
  { name: 'separatorIndices', type: 'number[]', default: 'EMPTY_SEPARATOR_INDICES', details: 'The separatorIndices prop.' },
  { name: 'aria-label', type: 'string', default: "'One-time password'", details: 'The aria-label prop.' }
];

export const kbdAttributes = [
  { name: 'children', type: 'ReactNode', default: 'Required', details: 'The children prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' }
];

export const listBoxAttributes = [
  { name: 'items', type: 'NListBoxItem[]', default: 'Required', details: 'The items prop.' },
  { name: 'selectionMode', type: "'none' | 'single' | 'multiple'", default: "'single'", details: 'The selectionMode prop.' },
  { name: 'selectedKeys', type: 'Iterable<string>', default: 'Optional', details: 'The selectedKeys prop.' },
  { name: 'onSelectionChange', type: '(keys: Selection) => void', default: 'Optional', details: 'The onSelectionChange prop.' },
  {
    name: 'onAction',
    type: '(key: string) => void',
    default: 'Optional',
    details: 'Fires on click or Enter, for a list that acts rather than selects.'
  },
  { name: 'variant', type: "'default' | 'danger'", default: "'default'", details: 'The variant prop.' },
  {
    name: 'disabledKeys',
    type: 'Iterable<string>',
    default: 'Optional',
    details: 'Keys that cannot be chosen. Individual items can also carry `disabled`.'
  },
  { name: 'emptyMessage', type: 'ReactNode', default: "'Nothing here yet.'", details: 'Shown when `items` is empty.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'itemClassName', type: 'string', default: "''", details: 'The itemClassName prop.' },
  { name: 'aria-label', type: 'string', default: "'Options'", details: 'The aria-label prop.' }
];

export const paginationAttributes = [
  { name: 'totalPages', type: 'number', default: 'Required', details: 'The totalPages prop.' },
  { name: 'currentPage', type: 'number', default: 'Required', details: 'The currentPage prop.' },
  { name: 'onChange', type: '(page: number) => void', default: 'Required', details: 'The onChange prop.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", details: 'The size prop.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'The disabled prop.' },
  { name: 'showSummary', type: 'boolean', default: 'false', details: 'The showSummary prop.' },
  { name: 'summaryText', type: 'string', default: 'Optional', details: 'The summaryText prop.' },
  { name: 'siblingCount', type: 'number', default: '1', details: 'The siblingCount prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'contentClassName', type: 'string', default: "''", details: 'The contentClassName prop.' },
  { name: 'linkClassName', type: 'string', default: "''", details: 'The linkClassName prop.' },
  { name: 'activeLinkClassName', type: 'string', default: "''", details: 'The activeLinkClassName prop.' },
  { name: 'aria-label', type: 'string', default: "'Pagination'", details: 'The aria-label prop.' }
];

export const progressCircleAttributes = [
  { name: 'value', type: 'number', default: 'Optional', details: 'The value prop.' },
  { name: 'minValue', type: 'number', default: '0', details: 'The minValue prop.' },
  { name: 'maxValue', type: 'number', default: '100', details: 'The maxValue prop.' },
  { name: 'isIndeterminate', type: 'boolean', default: 'false', details: 'Omit `value` for an indeterminate circle.' },
  { name: 'color', type: "'default' | 'accent' | 'success' | 'warning' | 'danger'", default: "'accent'", details: 'The color prop.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", details: 'The size prop.' },
  { name: 'children', type: 'ReactNode', default: 'Optional', details: 'Rendered in the middle of the circle — a percentage, a count, an icon.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'trackClassName', type: 'string', default: "''", details: 'The trackClassName prop.' },
  { name: 'aria-label', type: 'string', default: "'Progress'", details: 'The aria-label prop.' }
];

export const scrollShadowAttributes = [
  { name: 'children', type: 'ReactNode', default: 'Required', details: 'The children prop.' },
  { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'vertical'", details: 'The orientation prop.' },
  { name: 'size', type: 'number', default: 'Optional', details: 'Shadow depth in pixels.' },
  { name: 'offset', type: 'number', default: 'Optional', details: 'How close to the edge counts as scrolled to it.' },
  { name: 'hideScrollBar', type: 'boolean', default: 'false', details: 'The hideScrollBar prop.' },
  { name: 'isEnabled', type: 'boolean', default: 'true', details: 'The isEnabled prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' }
];

export const switchGroupAttributes = [
  { name: 'items', type: 'NSwitchGroupItem[]', default: 'Required', details: 'The items prop.' },
  { name: 'value', type: 'string[]', default: 'Required', details: 'The values currently switched on.' },
  { name: 'onChange', type: '(selected: string[]) => void', default: 'Required', details: 'The onChange prop.' },
  { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'vertical'", details: 'The orientation prop.' },
  { name: 'label', type: 'string', default: 'Optional', details: 'The label prop.' },
  { name: 'showLabel', type: 'boolean', default: 'true', details: 'The showLabel prop.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'The disabled prop.' },
  { name: 'id', type: 'string', default: 'Optional', details: 'The id prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'labelClassName', type: 'string', default: "''", details: 'The labelClassName prop.' },
  { name: 'itemClassName', type: 'string', default: "''", details: 'The itemClassName prop.' },
  { name: 'switchClassName', type: 'string', default: "''", details: 'The switchClassName prop.' }
];

export const timeFieldAttributes = [
  { name: 'value', type: 'any', default: 'Optional', details: 'The value prop.' },
  { name: 'defaultValue', type: 'any', default: 'Optional', details: 'The defaultValue prop.' },
  { name: 'onChange', type: '(value: any) => void', default: 'Optional', details: 'The onChange prop.' },
  { name: 'label', type: 'ReactNode', default: 'Optional', details: 'The label prop.' },
  { name: 'minValue', type: 'any', default: 'Optional', details: 'The minValue prop.' },
  { name: 'maxValue', type: 'any', default: 'Optional', details: 'The maxValue prop.' },
  { name: 'granularity', type: "'hour' | 'minute' | 'second'", default: "'minute'", details: 'The granularity prop.' },
  { name: 'hourCycle', type: '12 | 24', default: 'Optional', details: "12- or 24-hour display. Defaults to the locale's own convention." },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'The disabled prop.' },
  { name: 'isInvalid', type: 'boolean', default: 'false', details: 'The isInvalid prop.' },
  { name: 'variant', type: "'primary' | 'secondary'", default: "'primary'", details: 'The variant prop.' },
  { name: 'fullWidth', type: 'boolean', default: 'false', details: 'The fullWidth prop.' },
  { name: 'error', type: 'ReactNode', default: 'Optional', details: 'The error prop.' },
  { name: 'helperText', type: 'ReactNode', default: 'Optional', details: 'The helperText prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'labelClassName', type: 'string', default: "''", details: 'The labelClassName prop.' },
  { name: 'aria-label', type: 'string', default: "'Time'", details: 'The aria-label prop.' }
];

export const toggleButtonAttributes = [
  { name: 'children', type: 'ReactNode', default: 'Required', details: 'The children prop.' },
  { name: 'isSelected', type: 'boolean', default: 'Optional', details: 'The isSelected prop.' },
  { name: 'defaultSelected', type: 'boolean', default: 'false', details: 'The defaultSelected prop.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'The disabled prop.' },
  { name: 'isIconOnly', type: 'boolean', default: 'false', details: 'The isIconOnly prop.' },
  { name: 'variant', type: "'default' | 'ghost'", default: "'default'", details: 'The variant prop.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", details: 'The size prop.' },
  { name: 'onChange', type: '(isSelected: boolean) => void', default: 'Optional', details: 'The onChange prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'aria-label', type: 'string', default: 'Optional', details: 'The aria-label prop.' },
  { name: 'aria-labelledby', type: 'string', default: 'Optional', details: 'The aria-labelledby prop.' }
];

export const toolbarAttributes = [
  { name: 'children', type: 'ReactNode', default: 'Required', details: 'The children prop.' },
  { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", details: 'The orientation prop.' },
  { name: 'isAttached', type: 'boolean', default: 'false', details: 'Joins the controls into one segmented strip.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'aria-label', type: 'string', default: "'Toolbar'", details: 'The aria-label prop.' }
];
