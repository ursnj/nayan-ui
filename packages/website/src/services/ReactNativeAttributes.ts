export const accordionAttributes = [
  { name: 'items', type: 'AccordionItemData[]', default: 'Required', details: 'Array of accordion items with title and content.' },
  { name: 'multiple', type: 'boolean', default: 'false', details: 'Whether multiple items can be expanded at once.' },
  { name: 'defaultValue', type: 'string[]', default: 'Optional', details: 'Default expanded item values.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'itemClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'titleClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'contentClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' }
];

export const actionItemAttributes = [
  { name: 'name', type: 'string', default: 'Required', details: 'Name/title of the action item.' },
  { name: 'description', type: 'string', default: 'Optional', details: 'Description text for the action item.' },
  { name: 'icon', type: 'React.ComponentType<any> | React.ReactElement', default: 'Optional', details: 'Icon component or element to display.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Whether the action item is disabled.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'titleClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'descriptionClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'onPress', type: '() => void', default: 'Optional', details: 'Callback when action item is pressed.' },
  { name: 'onLongPress', type: '() => void', default: 'Optional', details: 'Callback when action item is long pressed.' }
];

export const alertAttributes = [
  { name: 'title', type: 'string', default: 'Optional', details: 'Title for the alert.' },
  { name: 'description', type: 'string', default: 'Required', details: 'Description text for the alert.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'titleClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'descriptionClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'iconClassName', type: 'string', default: "' '", details: 'You can customise icon by passing tailwind classes.' }
];

export const badgeAttributes = [
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Badge content.' }
];

export const buttonAttributes = [
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Button content.' },
  { name: 'icon', type: 'React.ComponentType<any> | React.ReactElement', default: 'Optional', details: 'Icon component or element to display.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Whether the button is disabled.' },
  { name: 'onPress', type: '() => void', default: 'Optional', details: 'Callback when button is pressed.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'textClassName', type: 'string', default: "' '", details: 'You can customise text by passing tailwind classes.' }
];

export const buttonGroupAttributes = [
  { name: 'items', type: 'ButtonGroupItem[]', default: 'Required', details: 'Array of button group items.' },
  { name: 'value', type: 'string', default: 'Required', details: 'Currently selected value.' },
  { name: 'onChange', type: '(value: string) => void', default: 'Required', details: 'Callback when selection changes.' },
  { name: 'label', type: 'string', default: 'Optional', details: 'Label for the button group.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Whether the button group is disabled.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'buttonClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' }
];

export const cardAttributes = [
  { name: 'children', type: 'React.ReactNode', default: 'Optional', details: 'Card content.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' }
];

export const checkAttributes = [
  { name: 'checked', type: 'boolean', default: 'Required', details: 'Whether the checkbox is checked.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Whether the checkbox is disabled.' },
  { name: 'label', type: 'string', default: 'Required', details: 'Label text for the checkbox.' },
  { name: 'onChange', type: '(checked: boolean) => void', default: 'Required', details: 'Callback when checkbox state changes.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' }
];

export const confirmAlertAttributes = [
  { name: 'title', type: 'string', default: 'Required', details: 'Title for the confirmation dialog.' },
  { name: 'description', type: 'string', default: 'Required', details: 'Description text for the confirmation.' },
  { name: 'onResult', type: '(result: boolean) => void', default: 'Required', details: 'Callback when user confirms or cancels.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Trigger element for the confirmation dialog.' },
  { name: 'confirmText', type: 'string', default: 'Optional', details: 'Custom text for confirm button.' },
  { name: 'cancelText', type: 'string', default: 'Optional', details: 'Custom text for cancel button.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise dialog by passing tailwind classes.' },
  { name: 'titleClassName', type: 'string', default: "' '", details: 'You can customise title by passing tailwind classes.' },
  { name: 'descriptionClassName', type: 'string', default: "' '", details: 'You can customise description by passing tailwind classes.' },
  { name: 'confirmClassName', type: 'string', default: "' '", details: 'You can customise confirm button by passing tailwind classes.' },
  { name: 'cancelClassName', type: 'string', default: "' '", details: 'You can customise cancel button by passing tailwind classes.' }
];

export const dialogAttributes = [
  { name: 'children', type: 'React.ReactNode', default: 'Optional', details: 'Content for the dialog.' },
  { name: 'trigger', type: 'React.ReactNode', default: 'Optional', details: 'Trigger element for the dialog.' },
  { name: 'title', type: 'string', default: 'Required', details: 'Title for the dialog.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'headerClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'headerTitleClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'contentClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' }
];

export const dividerAttributes = [
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'orientation', type: 'vertical | horizontal', default: 'horizontal', details: 'You can pass divider orientation.' }
];

export const infiniteScrollAttributes = [
  {
    name: 'next',
    type: 'function',
    default: '',
    details:
      'a function which must be called after reaching the bottom. It must trigger some sort of action which fetches the next data. The data is passed as children to the InfiniteScroll component and the data should contain previous items too. e.g. Initial data = [1, 2, 3] and then next load of data should be [1, 2, 3, 4, 5, 6].'
  },
  {
    name: 'hasMore',
    type: 'boolean',
    default: '',
    details: 'it tells the InfiniteScroll component on whether to call next function on reaching the bottom and shows an endMessage to the user.'
  },
  { name: 'children', type: 'ReactNode[]', default: '', details: 'the data items which you need to scroll.\n' },
  { name: 'dataLength', type: 'number', default: '', details: 'set the length of the data.This will unlock the subsequent calls to next.' },
  {
    name: 'loader',
    type: 'ReactNode',
    default: '',
    details:
      'you can send a loader component to show while the component waits for the next load of data. e.g. <h3>Loading...</h3> or any fancy loader element.'
  },
  {
    name: 'scrollThreshold',
    type: 'number | string',
    default: '',
    details:
      'A threshold value defining when InfiniteScroll will call next. Default value is 0.8. It means the next will be called when user comes below 80% of the total height. If you pass threshold in pixels (scrollThreshold="200px"), next will be called once you scroll at least (100% - scrollThreshold) pixels down.'
  },
  {
    name: 'onScroll',
    type: 'function',
    default: '',
    details:
      'a function that will listen to the scroll event on the scrolling container. Note that the scroll event is throttled, so you may not receive as many events as you would expect.'
  },
  {
    name: 'endMessage',
    type: 'ReactNode',
    default: '',
    details: "this message is shown to the user when he has seen all the records which means he's at the bottom and hasMore is false\n"
  },
  { name: 'className', type: 'string', default: "' '", details: 'add any custom class you want.' },
  { name: 'style', type: 'object', default: '', details: 'any style which you want to override.' },
  { name: 'height', type: 'number', default: '', details: 'optional, give only if you want to have a fixed height scrolling content\n' },
  {
    name: 'scrollableTarget',
    type: 'string | ReactNode',
    default: '',
    details:
      'optional, reference to a (parent) DOM element that is already providing overflow scrollbars to the InfiniteScroll component. You should provide the id of the DOM node preferably.'
  },
  {
    name: 'hasChildren',
    type: 'boolean',
    default: '',
    details:
      "children is by default assumed to be of type array and it's length is used to determine if loader needs to be shown or not, if your children is not an array, specify this prop to tell if your items are 0 or more.\n"
  },
  { name: 'pullDownToRefresh', type: 'boolean', default: '', details: 'to enable Pull Down to Refresh feature\n' },
  {
    name: 'pullDownToRefreshContent',
    type: 'ReactNode',
    default: '',
    details: 'any JSX that you want to show the user, default={<h3>Pull down to refresh</h3>}.'
  },
  {
    name: 'releaseToRefreshContent',
    type: 'ReactNode',
    default: '',
    details: 'any JSX that you want to show the user, default={<h3>Release to refresh</h3>}.'
  },
  {
    name: 'pullDownToRefreshThreshold',
    type: 'number',
    default: '',
    details:
      'minimum distance the user needs to pull down to trigger the refresh, default=100px , a lower value may be needed to trigger the refresh depending your users browser.'
  },
  {
    name: 'refreshFunction',
    type: 'function',
    default: '',
    details: 'this function will be called, it should return the fresh data that you want to show the user.'
  },
  { name: 'initialScrollY', type: 'number', default: '', details: 'set a scroll y position for the component to render with.' },
  { name: 'inverse', type: 'boolean', default: '', details: 'set infinite scroll on top.' }
];

export const inputAttributes = [
  { name: 'value', type: 'string', default: 'Required', details: 'Current input value.' },
  { name: 'label', type: 'string', default: 'Optional', details: 'Label for the input field.' },
  { name: 'placeholder', type: 'string', default: 'Optional', details: 'Placeholder text for the input.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Whether the input is disabled.' },
  { name: 'onChangeText', type: '(text: string) => void', default: 'Required', details: 'Callback when input text changes.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'inputClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' }
];

export const linkifyAttributes = [
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'children', type: 'string | ReactNode', default: 'Required', details: 'You can pass linkify content as children.' }
];

export const loadingAttributes = [{ name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' }];

export const menuAttributes = [
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'titleClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'triggerClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'title', type: 'string', default: "' '", details: 'You can pass title for menu.' },
  { name: 'size', type: 'MenuSize', default: 'MenuSize.MD', details: 'You can pass size of the menu.' },
  { name: 'side', type: 'top | bottom | right | left', default: 'bottom', details: 'You can pass side to menu.' },
  { name: 'align', type: 'start | end | center', default: 'end', details: 'You can pass align to menu.' },
  { name: 'trigger', type: 'string | ReactNode', default: 'Required', details: 'You can pass trigger to menu.' },
  { name: 'children', type: 'string | ReactNode', default: 'Required', details: 'You can pass menu content as children.' }
];

export const menuItemAttributes = [
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'iconClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'titleClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'shortcutClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'title', type: 'string', default: 'Required', details: 'You can pass title for menu item.' },
  { name: 'shortcut', type: 'string', default: "' '", details: 'You can pass shortcut key for menu item.' },
  { name: 'icon', type: 'ReactNode', default: 'Required', details: 'You can pass icon for menu item.' },
  { name: 'separator', type: 'boolean', default: 'false', details: 'You can pass separator for menu item.' },
  { name: 'onClick', type: '() => void', default: '', details: 'You can get callback when menu item clicked.' }
];

export const menuNestedAttributes = [
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'triggerClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'size', type: 'MenuSize', default: 'MenuSize.MD', details: 'You can pass size of the menu.' },
  { name: 'trigger', type: 'string | ReactNode', default: 'Required', details: 'You can pass trigger to menu.' },
  { name: 'children', type: 'string | ReactNode', default: 'Required', details: 'You can pass menu content as children.' }
];

export const popoverAttributes = [
  { name: 'trigger', type: 'React.ReactNode', default: 'Optional', details: 'Trigger element for the popover.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Content for the popover.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'side', type: "'top' | 'bottom'", default: 'Optional', details: 'Side to position the popover.' }
];

export const pressAttributes = [
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Content for the pressable component.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' }
];

export const progressAttributes = [
  { name: 'value', type: 'number', default: 'Required', details: 'Progress value (0-100).' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise progress container by passing tailwind classes.' },
  { name: 'indicatorClassName', type: 'string', default: "' '", details: 'You can customise progress indicator by passing tailwind classes.' }
];

export const radioAttributes = [
  { name: 'label', type: 'string', default: 'Optional', details: 'Label for the radio group.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Whether the radio group is disabled.' },
  { name: 'value', type: 'string', default: 'Required', details: 'Currently selected value.' },
  { name: 'items', type: 'RadioItem[]', default: 'Required', details: 'Array of radio items with label and value properties.' },
  { name: 'onChange', type: '(value: string) => void', default: 'Required', details: 'Callback when selection changes.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise container by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise group label by passing tailwind classes.' },
  { name: 'radioGroupClassName', type: 'string', default: "' '", details: 'You can customise radio group by passing tailwind classes.' },
  { name: 'radioItemClassName', type: 'string', default: "' '", details: 'You can customise individual radio items by passing tailwind classes.' },
  { name: 'radioClassName', type: 'string', default: "' '", details: 'You can customise radio buttons by passing tailwind classes.' },
  { name: 'radioLabelClassName', type: 'string', default: "' '", details: 'You can customise radio item labels by passing tailwind classes.' }
];

export const requiredAttributes = [{ name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' }];

export const selectAttributes = [
  { name: 'label', type: 'string', default: 'Optional', details: 'Label for the select field.' },
  { name: 'selectLabel', type: 'string', default: 'Optional', details: 'Label for the select trigger.' },
  { name: 'placeholder', type: 'string', default: 'Optional', details: 'Placeholder text for the select.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Whether the select is disabled.' },
  { name: 'value', type: 'SelectOption', default: 'Required', details: 'Currently selected value.' },
  { name: 'items', type: 'SelectOption[]', default: 'Required', details: 'Array of select options.' },
  { name: 'onChange', type: '(value: any) => void', default: 'Required', details: 'Callback when selection changes.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'inputClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' }
];

export const sheetAttributes = [
  { name: 'sheetRef', type: 'React.RefObject<BottomSheetModal>', default: 'Required', details: 'Reference to the bottom sheet modal.' },
  { name: 'snapPoints', type: 'string[] | number[]', default: 'null', details: 'Snap points for the sheet. If null, uses dynamic sizing.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Content for the sheet.' }
];

export const skeletonAttributes = [{ name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' }];

export const switchAttributes = [
  { name: 'label', type: 'string', default: 'Optional', details: 'Label for the switch.' },
  { name: 'checked', type: 'boolean', default: 'Required', details: 'Whether the switch is checked.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'inputClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Whether the switch is disabled.' },
  { name: 'onChange', type: '(checked: boolean) => void', default: 'Required', details: 'Callback when switch state changes.' }
];

export const textAttributes = [
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'children', type: 'string | React.ReactNode', default: 'Required', details: 'Text content.' }
];

export const textareaAttributes = [
  { name: 'value', type: 'string', default: 'Required', details: 'Current textarea value.' },
  { name: 'label', type: 'string', default: 'Optional', details: 'Label for the textarea.' },
  { name: 'placeholder', type: 'string', default: 'Optional', details: 'Placeholder text for the textarea.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Whether the textarea is disabled.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'inputClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'onChangeText', type: '(text: string) => void', default: 'Required', details: 'Callback when textarea text changes.' }
];

export const themeAttributes = [
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Content to be themed.' },
  { name: 'theme', type: 'string', default: 'Required', details: 'Theme name to apply.' },
  { name: 'themeColors', type: 'ThemeConfig', default: 'Required', details: 'Theme configuration object.' }
];

export const themeToggleAttributes = [
  { name: 'size', type: 'number', default: 'Optional', details: 'Size of the theme toggle icon.' },
  { name: 'strokeWidth', type: 'number', default: 'Optional', details: 'Stroke width of the icon.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'onThemeChange', type: '(theme: string) => void', default: 'Optional', details: 'Callback when theme changes.' }
];

export const toastAttributes = [
  { name: 'config', type: 'NToastConfig', default: 'Optional', details: 'Toast configuration object with custom icons and settings.' },
  { name: 'successIcon', type: 'React.ComponentType<any> | React.ReactElement', default: 'Optional', details: 'Custom icon for success toasts.' },
  { name: 'errorIcon', type: 'React.ComponentType<any> | React.ReactElement', default: 'Optional', details: 'Custom icon for error toasts.' },
  { name: 'infoIcon', type: 'React.ComponentType<any> | React.ReactElement', default: 'Optional', details: 'Custom icon for info toasts.' },
  { name: 'warningIcon', type: 'React.ComponentType<any> | React.ReactElement', default: 'Optional', details: 'Custom icon for warning toasts.' }
];

export const tooltipAttributes = [
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Trigger element for the tooltip.' },
  { name: 'message', type: 'string', default: 'Required', details: 'Tooltip message text.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise tooltip content by passing tailwind classes.' },
  { name: 'textClassName', type: 'string', default: "' '", details: 'You can customise tooltip text by passing tailwind classes.' }
];

export const colorPickerAttributes = [
  { name: 'value', type: 'string', default: 'Required', details: 'Current color value (hex format).' },
  { name: 'label', type: 'string', default: 'Optional', details: 'Label for the color picker.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Whether the color picker is disabled.' },
  { name: 'onChange', type: '(value: string) => void', default: 'Required', details: 'Callback when color changes.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise container by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise label by passing tailwind classes.' },
  { name: 'triggerClassName', type: 'string', default: "' '", details: 'You can customise color trigger button by passing tailwind classes.' }
];

export const confirmAttributes = [
  { name: 'title', type: 'string', default: 'Required', details: 'Title for the confirmation dialog.' },
  { name: 'description', type: 'string', default: 'Required', details: 'Description text for the confirmation.' },
  { name: 'onResult', type: '(result: boolean) => void', default: 'Required', details: 'Callback when user confirms or cancels.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Trigger element for the confirmation dialog.' },
  { name: 'confirmText', type: 'string', default: 'Optional', details: 'Custom text for confirm button.' },
  { name: 'cancelText', type: 'string', default: 'Optional', details: 'Custom text for cancel button.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise dialog by passing tailwind classes.' },
  { name: 'titleClassName', type: 'string', default: "' '", details: 'You can customise title by passing tailwind classes.' },
  { name: 'descriptionClassName', type: 'string', default: "' '", details: 'You can customise description by passing tailwind classes.' },
  { name: 'confirmClassName', type: 'string', default: "' '", details: 'You can customise confirm button by passing tailwind classes.' },
  { name: 'cancelClassName', type: 'string', default: "' '", details: 'You can customise cancel button by passing tailwind classes.' }
];

export const datePickerAttributes = [
  { name: 'value', type: 'Date', default: 'Required', details: 'Current date value.' },
  { name: 'label', type: 'string', default: 'Optional', details: 'Label for the date picker.' },
  { name: 'isDarkMode', type: 'boolean', default: 'Optional', details: 'Whether to use dark mode styling for the picker modal.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Whether the date picker is disabled.' },
  { name: 'type', type: "'date' | 'time' | 'datetime'", default: "'date'", details: 'Type of date picker (date, time, or datetime).' },
  { name: 'onChange', type: '(date: Date) => void', default: 'Required', details: 'Callback when date changes.' },
  {
    name: 'icon',
    type: 'React.ComponentType<any> | React.ReactElement',
    default: 'Optional',
    details: 'Custom icon component or element to display.'
  },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise container by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise label by passing tailwind classes.' },
  { name: 'inputClassName', type: 'string', default: "' '", details: 'You can customise input container by passing tailwind classes.' },
  { name: 'inputTextClassName', type: 'string', default: "' '", details: 'You can customise input text by passing tailwind classes.' },
  { name: 'inputIconClassName', type: 'string', default: "' '", details: 'You can customise input icon by passing tailwind classes.' }
];
