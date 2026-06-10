import {
  AppWindow,
  Badge,
  BookOpen,
  Bot,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  CircleDot,
  Columns3,
  CreditCard,
  Download,
  EllipsisVertical,
  FileCode,
  FileText,
  GalleryVertical,
  Gamepad2,
  Gauge,
  Grid3x3,
  HandCoins,
  Hash,
  Link,
  Link2,
  ListCollapse,
  ListFilter,
  Loader,
  Map,
  MessageSquare,
  MessageSquareDot,
  MessageSquareText,
  MessageSquareWarning,
  PictureInPicture2,
  RectangleEllipsis,
  Search,
  Settings,
  ShieldCheck,
  Slash,
  SlidersHorizontal,
  Sparkles,
  Square,
  SquareArrowOutUpRight,
  SquareCheck,
  SquareMousePointer,
  StickyNote,
  TextCursorInput,
  TextSelect,
  ToggleRight,
  Wrench
} from 'lucide-react';
import {
  accordionAttributes,
  alertAttributes,
  autocompleteAttributes,
  badgeAttributes,
  buttonAttributes,
  buttonGroupAttributes,
  cardAttributes,
  checkboxAttributes,
  confirmAlertAttributes,
  datePickerAttributes,
  dialogAttributes,
  dividerAttributes,
  infiniteScrollAttributes,
  inputAttributes,
  linkAttributes,
  loadingAttributes,
  menuAttributes,
  meterAttributes,
  numberFieldAttributes,
  popoverAttributes,
  progressAttributes,
  radioGroupAttributes,
  searchFieldAttributes,
  selectAttributes,
  sheetAttributes,
  skeletonAttributes,
  sliderAttributes,
  switchAttributes,
  tableAttributes,
  tabsAttributes,
  tagGroupAttributes,
  textareaAttributes,
  toastAttributes,
  tooltipAttributes
} from '@/services/ReactAttributes';
import {
  accordionCode,
  alertCode,
  autocompleteCode,
  badgeCode,
  buttonCode,
  buttonGroupCode,
  cardCode,
  checkBoxCode,
  confirmAlertCode,
  datePickerCode,
  dialogCode,
  dividerCode,
  infiniteScrollCode,
  inputCode,
  inputHookCode,
  linkCode,
  linkifyCode,
  loadingCode,
  menuCode,
  meterCode,
  numberFieldCode,
  popoverCode,
  progressCode,
  radioGroupCode,
  searchFieldCode,
  selectCode,
  sheetCode,
  skeletonCode,
  sliderCode,
  switchCode,
  tableCode,
  tabsCode,
  tagGroupCode,
  textareaCode,
  toastCode,
  tooltipCode
} from '@/services/ReactCodeBlocks';
import {
  accordionAttributes as rnAccordionAttributes,
  alertAttributes as rnAlertAttributes,
  buttonAttributes as rnButtonAttributes,
  buttonGroupAttributes as rnButtonGroupAttributes,
  cardAttributes as rnCardAttributes,
  checkAttributes as rnCheckAttributes,
  dialogAttributes as rnDialogAttributes,
  dividerAttributes as rnDividerAttributes,
  inputAttributes as rnInputAttributes,
  loadingAttributes as rnLoadingAttributes,
  menuAttributes as rnMenuAttributes,
  popoverAttributes as rnPopoverAttributes,
  progressAttributes as rnProgressAttributes,
  radioAttributes as rnRadioAttributes,
  selectAttributes as rnSelectAttributes,
  sheetAttributes as rnSheetAttributes,
  skeletonAttributes as rnSkeletonAttributes,
  sliderAttributes as rnSliderAttributes,
  switchAttributes as rnSwitchAttributes,
  tabsAttributes as rnTabsAttributes,
  textareaAttributes as rnTextareaAttributes,
  toastAttributes as rnToastAttributes,
  tooltipAttributes as rnTooltipAttributes
} from '@/services/ReactNativeAttributes';
import {
  accordionTags,
  aiReviewTags,
  aiScannerTags,
  alertTags,
  autocompleteTags,
  badgeTags,
  buttonGroupTags,
  buttonTags,
  cardTags,
  checkboxTags,
  confirmAlertTags,
  datePickerTags,
  dialogTags,
  dividerTags,
  infiniteScrollTags,
  inputTags,
  linkTags,
  linkifyTags,
  loadingTags,
  menuTags,
  meterTags,
  numberFieldTags,
  popoverTags,
  progressTags,
  radioGroupTags,
  rnAccordionTags,
  rnAlertTags,
  rnButtonGroupTags,
  rnButtonTags,
  rnCardTags,
  rnCheckboxTags,
  rnDialogTags,
  rnDividerTags,
  rnInputTags,
  rnMenuTags,
  rnPopoverTags,
  rnProgressTags,
  rnRadioTags,
  rnSelectTags,
  rnSheetTags,
  rnSkeletonTags,
  rnSwitchTags,
  rnTextareaTags,
  rnToastTags,
  rnTooltipTags,
  robotsTags,
  searchFieldTags,
  selectTags,
  seoMasterTags,
  sheetTags,
  sitemapTags,
  skeletonTags,
  sliderTags,
  switchTags,
  tableTags,
  tabsTags,
  tagGroupTags,
  textareaTags,
  toastTags,
  tooltipTags
} from '@/services/Tags';

export const isWindowDefined = () => {
  return typeof window !== 'undefined';
};

// Utility function to determine which sidebar items to use based on URL path
export const getSidebarItems = (path: string) => {
  if (path.startsWith('/react-native')) {
    return reactNativeSidebarItems;
  }
  if (path.startsWith('/devtools')) {
    return devtoolsSidebarItems;
  }
  if (path.startsWith('/games')) {
    return gamesSidebarItems;
  }
  return reactSidebarItems;
};

// Updated getMenuItem to work with both React and React Native
export const getMenuItem = (path: string) => {
  const sidebarItems = getSidebarItems(path);
  return sidebarItems.find(item => item.link === path);
};

// Updated getMenuItemByTag to work with both React and React Native
export const getMenuItemByTag = (tag: string, path?: string) => {
  const sidebarItems = path ? getSidebarItems(path) : [...reactSidebarItems, ...reactNativeSidebarItems];
  return sidebarItems.find((component: any) => component.tags?.find((tg: any) => tg.sku === tag));
};

export const reactSidebarItems = [
  { title: 'Get Started', description: '', link: '', isHeading: true },
  { title: 'Installation', description: '', link: '/react/installation', icon: Settings },
  {
    title: 'Components',
    description:
      'Components are reusable building blocks of a user interface that encapsulate a specific piece of functionality or UI design. Each component can represent a distinct part of the application, such as buttons, forms, modals, or navigation bars. Components help organize and structure code, making it easier to manage, maintain, and scale applications by allowing developers to reuse consistent elements across different parts of the project.',
    link: '/react/components',
    isHeading: true
  },
  {
    title: 'Accordion',
    description:
      'An Accordion component is a UI element that allows users to expand and collapse sections of content. It is commonly used to organize information in a compact and accessible manner, displaying only the headers by default and revealing the associated content when clicked. This helps improve the readability of complex or lengthy information by reducing clutter on the page.',
    link: '/react/accordion',
    attributes: accordionAttributes,
    code: accordionCode,
    tags: accordionTags,
    icon: ListCollapse,
    isComponent: true
  },
  {
    title: 'Alert',
    description:
      "An Alert component is a UI element used to display important messages or notifications to users. It can convey different types of information such as success, warning, error, or informational messages, typically styled with distinct colors and icons to highlight the message's significance. Alerts are often used to grab the user's attention and provide immediate feedback on actions or events.",
    link: '/react/alert',
    attributes: alertAttributes,
    code: alertCode,
    tags: alertTags,
    icon: CircleAlert,
    isComponent: true
  },
  {
    title: 'Autocomplete',
    description:
      'An Autocomplete component is a UI element that combines a text input with a dropdown list of suggestions, allowing users to quickly find and select from a set of options. It provides real-time filtering as users type, enhancing the search and selection experience.',
    link: '/react/autocomplete',
    attributes: autocompleteAttributes,
    code: autocompleteCode,
    tags: autocompleteTags,
    icon: ListFilter,
    isComponent: true
  },
  {
    title: 'Badge',
    description:
      'A Badge component is a small UI element used to display a count, status, or label associated with another element, such as an icon or button. Badges are commonly used to highlight notifications, messages, or any relevant information in a compact and visually distinct way, often appearing as small circles or rectangles with numbers or text.',
    link: '/react/badge',
    attributes: badgeAttributes,
    code: badgeCode,
    tags: badgeTags,
    icon: Badge,
    isComponent: true
  },
  {
    title: 'Button',
    description:
      'A Button component is a fundamental UI element that allows users to trigger actions or events, such as submitting a form, opening a dialog, or navigating to another page. Buttons are interactive and typically styled to stand out, making it easy for users to identify and interact with them. They can come in various types, such as primary, secondary, or disabled, depending on their purpose or state.',
    link: '/react/button',
    attributes: buttonAttributes,
    code: buttonCode,
    tags: buttonTags,
    icon: Square,
    isComponent: true
  },
  {
    title: 'Button Group',
    description:
      'A Button Group component is a UI element that groups multiple buttons together, allowing users to select from a set of related actions or options. It helps organize buttons in a compact, cohesive layout, typically displayed in a horizontal or vertical row. Button Groups are useful for actions that are closely related or mutually exclusive, providing a clean and structured way to present multiple controls.',
    link: '/react/button-group',
    attributes: buttonGroupAttributes,
    code: buttonGroupCode,
    tags: buttonGroupTags,
    icon: Columns3,
    isComponent: true
  },
  {
    title: 'Card',
    description:
      'A Card component is a versatile UI element used to display content in a structured and visually appealing way. It typically contains related information, such as text, images, buttons, and other elements, within a bordered or shadowed container. Cards are often used for presenting individual items, like products, articles, or profiles, making the content easy to scan and interact with.',
    link: '/react/card',
    attributes: cardAttributes,
    code: cardCode,
    tags: cardTags,
    icon: CreditCard,
    isComponent: true
  },
  {
    title: 'Checkbox',
    description:
      'A Checkbox component is a UI element that allows users to select or deselect one or more options from a list. It typically appears as a small square that can be checked (ticked) or unchecked. Checkboxes are often used in forms, settings, or filters where multiple selections are needed, and they provide a clear, binary choice for users.',
    link: '/react/checkbox',
    attributes: checkboxAttributes,
    code: checkBoxCode,
    tags: checkboxTags,
    icon: SquareCheck,
    isComponent: true
  },
  {
    title: 'Confirm Alert',
    description:
      'A Confirm Alert component is a UI element that prompts users to confirm or cancel an action before proceeding. It typically displays a message asking for confirmation, along with "Confirm" and "Cancel" buttons, ensuring that the user consciously approves or rejects the action, often used for critical tasks like deletions or irreversible changes.',
    link: '/react/confirm-alert',
    attributes: confirmAlertAttributes,
    code: confirmAlertCode,
    tags: confirmAlertTags,
    icon: MessageSquareWarning,
    isComponent: true
  },
  {
    title: 'Date Picker',
    description:
      'A Date Picker component is a UI element that allows users to select a date from a calendar popup. It provides an intuitive interface for choosing dates with support for date ranges, min/max constraints, and various granularity levels.',
    link: '/react/date-picker',
    attributes: datePickerAttributes,
    code: datePickerCode,
    tags: datePickerTags,
    icon: CalendarDays,
    isComponent: true
  },
  {
    title: 'Dialog',
    description:
      'A Dialog component is a UI element that displays a pop-up window over the main content to capture user attention or request input. It is often used for tasks like confirmations, alerts, forms, or other interactions that require user feedback before proceeding. Dialogs can include buttons like "OK" or "Cancel" to confirm or dismiss actions, and typically block interaction with the underlying content until closed.',
    link: '/react/dialog',
    attributes: dialogAttributes,
    code: dialogCode,
    tags: dialogTags,
    icon: MessageSquare,
    isComponent: true
  },
  {
    title: 'Divider',
    description:
      'A Divider component is a simple UI element used to separate content within a layout, creating visual distinction between sections. It helps enhance the organization and readability of the interface by providing clear boundaries between different elements, such as text blocks, images, or other components. Dividers can be styled in various ways (solid, dashed, or dotted) and can vary in thickness and color to match the overall design of the application.',
    link: '/react/divider',
    attributes: dividerAttributes,
    code: dividerCode,
    tags: dividerTags,
    icon: Slash,
    isComponent: true
  },
  {
    title: 'Infinite Scroll',
    description:
      'An Infinite Scroll component is a user interface feature that automatically loads and displays additional content as the user scrolls down a page. Instead of traditional pagination, this component creates a seamless browsing experience by continuously appending new items, such as images or articles, when the user reaches the bottom of the viewport. This enhances user engagement and keeps the content flow uninterrupted, making it ideal for applications like social media feeds, product galleries, and news websites.',
    link: '/react/infinite-scroll',
    attributes: infiniteScrollAttributes,
    code: infiniteScrollCode,
    tags: infiniteScrollTags,
    icon: GalleryVertical,
    isComponent: true
  },
  {
    title: 'Input',
    description:
      'An Input component is a user interface element that allows users to enter data, such as text, numbers, or selections. It typically includes various types, such as text fields, checkboxes, radio buttons, and dropdowns, providing flexibility for different data types. Input components are essential for forms and interactive applications, enabling users to submit information effectively and efficiently.',
    link: '/react/input',
    attributes: inputAttributes,
    code: inputCode,
    tags: inputTags,
    icon: TextCursorInput,
    isComponent: true
  },
  // {
  //   title: 'Input Hook Form',
  //   description:
  //     'An Input with React Hook Form component is a controlled input field that integrates with the React Hook Form library for efficient form handling in React applications. It simplifies the process of managing form state, validation, and submission. By utilizing React Hook Form, this component enables easy tracking of input values, ensures validation rules are applied, and provides streamlined error handling, making it a powerful tool for building robust forms with minimal boilerplate code.',
  //   link: '/react/input-hook-form',
  //   attributes: inputHookAttributes,
  //   code: inputHookCode,
  //   tags: inputTags,
  //   icon: TextCursorInput,
  //   isComponent: true
  // },
  {
    title: 'Link',
    description:
      'A Link component is a UI element that allows users to navigate from one page or section to another within a web application or website. Typically styled as underlined text or buttons, links provide a clear indication of interactivity. They can point to internal or external resources and often include features like hover effects or icons to enhance user experience and accessibility.',
    link: '/react/link',
    attributes: linkAttributes,
    code: linkCode,
    tags: linkTags,
    icon: Link,
    isComponent: true
  },
  {
    title: 'Linkify',
    description:
      'A Linkify component is a UI tool that automatically detects and converts plain text URLs within a content area into clickable hyperlinks. This enhances user experience by allowing easy access to external resources without the need for manual formatting. Linkify typically recognizes various URL formats and ensures that they are presented in a visually distinct manner, making navigation seamless and intuitive.',
    link: '/react/linkify',
    attributes: linkAttributes,
    code: linkifyCode,
    tags: linkifyTags,
    icon: SquareArrowOutUpRight,
    isComponent: true
  },
  {
    title: 'Loading',
    description:
      'A Loading component is a UI element that indicates to users that a process is ongoing, such as data fetching, page loading, or background tasks. It typically features visual indicators like spinners, progress bars, or animated icons to convey that the application is busy and to enhance the user experience by preventing confusion or frustration during waiting periods.',
    link: '/react/loading',
    attributes: loadingAttributes,
    code: loadingCode,
    tags: loadingTags,
    icon: Loader,
    isComponent: true
  },
  {
    title: 'Dropdown Menu',
    description:
      'A Dropdown Menu component is a UI element that allows users to select an option from a list that appears when the user clicks or hovers over a button or link. This component helps save space on the interface by displaying additional options only when needed. Dropdown menus are commonly used for navigation, settings, or forms, enabling users to choose from multiple choices in a clean and organized manner.',
    link: '/react/menu',
    attributes: menuAttributes,
    code: menuCode,
    tags: menuTags,
    icon: EllipsisVertical,
    isComponent: true
  },
  {
    title: 'Meter',
    description:
      'A Meter component is a UI element that visually represents a scalar measurement within a known range, such as disk usage, battery level, or CPU load. It provides an at-a-glance indicator of how a value compares to its min and max thresholds.',
    link: '/react/meter',
    attributes: meterAttributes,
    code: meterCode,
    tags: meterTags,
    icon: Gauge,
    isComponent: true
  },
  {
    title: 'Number Field',
    description:
      'A Number Field component is a UI element that allows users to enter and adjust numeric values using increment and decrement buttons or direct input. It supports features like min/max constraints, step values, and number formatting.',
    link: '/react/number-field',
    attributes: numberFieldAttributes,
    code: numberFieldCode,
    tags: numberFieldTags,
    icon: Hash,
    isComponent: true
  },
  {
    title: 'Popover',
    description:
      'A Popover component is a UI element that displays additional information or actions when users interact with a specific trigger, such as a button or link. It typically appears as a small overlay or tooltip that provides context, tips, or options without navigating away from the current page. Popovers enhance user experience by offering relevant content in a concise format while maintaining focus on the main interface.',
    link: '/react/popover',
    attributes: popoverAttributes,
    code: popoverCode,
    tags: popoverTags,
    icon: PictureInPicture2,
    isComponent: true
  },
  {
    title: 'Progress',
    description:
      'A Progress component visually indicates the completion status of a task or process. It typically consists of a progress bar that fills up as the task progresses, providing users with a clear and immediate understanding of how much of the task is completed and how much remains. This component is commonly used in forms, uploads, downloads, and loading states to enhance user experience by managing expectations and keeping users informed.',
    link: '/react/progress',
    attributes: progressAttributes,
    code: progressCode,
    tags: progressTags,
    icon: RectangleEllipsis,
    isComponent: true
  },
  {
    title: 'Radio Group',
    description:
      'A Radio Group component is a UI element that allows users to select one option from a set of mutually exclusive choices. It typically consists of multiple radio buttons, where only one button can be selected at a time. Radio groups are commonly used in forms to gather user preferences, ensuring a clear and organized way to present options for selection. They enhance user experience by providing a straightforward interface for making single-choice decisions.',
    link: '/react/radio-group',
    attributes: radioGroupAttributes,
    code: radioGroupCode,
    tags: radioGroupTags,
    icon: CircleDot,
    isComponent: true
  },
  {
    title: 'Select',
    description:
      'A Select or ComboBox component is a UI element that allows users to choose one or more options from a dropdown list. It typically displays a default value or prompt, and when clicked, it expands to show a list of available choices. Users can either select an option from the list or, in the case of a ComboBox, input custom values. This component is ideal for conserving space in forms and making it easy for users to make selections quickly.',
    link: '/react/select',
    attributes: selectAttributes,
    code: selectCode,
    tags: selectTags,
    icon: SquareMousePointer,
    isComponent: true
  },
  {
    title: 'Search Field',
    description:
      'A Search Field component is a UI element that provides a text input specifically designed for search functionality. It includes a built-in search icon and clear button, allowing users to quickly enter, modify, and clear search queries.',
    link: '/react/search-field',
    attributes: searchFieldAttributes,
    code: searchFieldCode,
    tags: searchFieldTags,
    icon: Search,
    isComponent: true
  },
  {
    title: 'Sheet',
    description:
      'A Sheet component is a UI element that presents content in a sliding panel, often overlaying the main application interface. It is typically used for displaying additional information, forms, or actions without navigating away from the current view. Sheets can be swiped or tapped to expand or collapse, providing a clean and efficient way to manage user interactions and maintain focus on the main content.',
    link: '/react/sheet',
    attributes: sheetAttributes,
    code: sheetCode,
    tags: sheetTags,
    icon: StickyNote,
    isComponent: true
  },
  {
    title: 'Skeleton',
    description:
      'A Skeleton component is a placeholder UI element that represents the layout of content before it loads. It typically features a grey or light-colored shape mimicking the structure of the actual content (such as text blocks, images, or buttons) to indicate that loading is in progress. Skeleton components enhance user experience by providing a visual cue that content is being fetched, reducing perceived loading times and preventing layout shifts.',
    link: '/react/skeleton',
    attributes: skeletonAttributes,
    code: skeletonCode,
    tags: skeletonTags,
    icon: TextSelect,
    isComponent: true
  },
  {
    title: 'Slider',
    description:
      'A Slider component is a UI element that allows users to select a value from a range by sliding a handle along a track. It provides an interactive way to adjust settings, such as volume, brightness, or other continuous values, with smooth transitions. Sliders can be single or multi-valued, enabling users to make precise selections visually, enhancing the overall user experience.',
    link: '/react/slider',
    attributes: sliderAttributes,
    code: sliderCode,
    tags: sliderTags,
    icon: SlidersHorizontal,
    isComponent: true
  },
  {
    title: 'Switch',
    description:
      'A Switch component is a UI element that allows users to toggle between two states, typically representing an on/off or enabled/disabled choice. It is visually represented as a sliding toggle or checkbox and provides immediate feedback when the user interacts with it. Switch components are commonly used for settings, preferences, and feature activations in applications, enhancing user experience by simplifying the selection process.',
    link: '/react/switch',
    attributes: switchAttributes,
    code: switchCode,
    tags: switchTags,
    icon: ToggleRight,
    isComponent: true
  },
  {
    title: 'Table',
    description:
      'A Table component is a structured UI element that organizes and displays data in rows and columns, making it easy to read and compare information. Tables can include features like sorting, filtering, pagination, and inline editing, allowing users to interact with the data efficiently. They are commonly used to present datasets, such as user information, product listings, or any structured content that benefits from a grid-like layout.',
    link: '/react/table',
    attributes: tableAttributes,
    code: tableCode,
    tags: tableTags,
    icon: Grid3x3,
    isComponent: true
  },
  {
    title: 'Tag Group',
    description:
      'A Tag Group component is a UI element that displays a collection of tags or labels, allowing users to select, filter, or remove tags. It supports multiple selection modes and removable tags, making it ideal for categorization, filtering, and labeling interfaces.',
    link: '/react/tag-group',
    attributes: tagGroupAttributes,
    code: tagGroupCode,
    tags: tagGroupTags,
    icon: Badge,
    isComponent: true
  },
  {
    title: 'Tabs',
    description:
      'A Tabs component is a UI element that allows users to switch between different views or sections of content within the same interface. Organized as a series of labeled tabs, this component enhances navigation by displaying only one section at a time, helping to reduce clutter and improve user experience. Users can easily access various related content or features by clicking on the respective tabs, making it ideal for dashboards, settings pages, or any multi-section layout.',
    link: '/react/tabs',
    attributes: tabsAttributes,
    code: tabsCode,
    tags: tabsTags,
    icon: AppWindow,
    isComponent: true
  },
  {
    title: 'Textarea',
    description:
      'A Textarea component is an input field that allows users to enter multi-line text. It provides a larger area for text input compared to a standard text input field, making it ideal for comments, feedback, or any scenario where users need to provide detailed information. Textareas can be resized, styled, and configured to support features like character limits, placeholders, and auto-resizing to enhance user experience.',
    link: '/react/textarea',
    attributes: textareaAttributes,
    code: textareaCode,
    tags: textareaTags,
    icon: TextCursorInput,
    isComponent: true
  },
  {
    title: 'Toast',
    description:
      'A Toast component is a transient notification that appears on the screen to provide feedback or information to users without interrupting their workflow. Typically displayed at the top or bottom of the screen, toasts are brief messages that automatically disappear after a short duration. They are commonly used to inform users about actions such as successful submissions, updates, or alerts, enhancing the overall user experience with minimal disruption.',
    link: '/react/toast',
    attributes: toastAttributes,
    code: toastCode,
    tags: toastTags,
    icon: MessageSquareText,
    isComponent: true
  },
  {
    title: 'Tooltip',
    description:
      'A Tooltip component is a small, informative pop-up that appears when a user hovers over or focuses on an element, such as a button or icon. It provides additional context or explanations about that element without cluttering the interface. Tooltips enhance user experience by offering helpful hints, instructions, or details, ensuring that information is accessible without overwhelming the layout.',
    link: '/react/tooltip',
    attributes: tooltipAttributes,
    code: tooltipCode,
    tags: tooltipTags,
    icon: MessageSquareDot,
    isComponent: true
  }
];

export const reactNativeSidebarItems = [
  { title: 'Get Started', description: '', link: '', isHeading: true },
  { title: 'Installation', description: '', link: '/react-native/installation', icon: Settings },
  {
    title: 'Components',
    description:
      'Components are reusable building blocks of a user interface that encapsulate a specific piece of functionality or UI design. Each component can represent a distinct part of the application, such as buttons, forms, modals, or navigation bars. Components help organize and structure code, making it easier to manage, maintain, and scale applications by allowing developers to reuse consistent elements across different parts of the project.',
    link: '/react-native/components',
    isHeading: true
  },
  {
    title: 'Accordion',
    description:
      'An Accordion component allows users to expand and collapse sections of content, organizing information compactly. Built on top of heroui-native Accordion.',
    link: '/react-native/accordion',
    attributes: rnAccordionAttributes,
    code: accordionCode,
    tags: rnAccordionTags,
    icon: ListCollapse,
    isComponent: true
  },
  {
    title: 'Alert',
    description:
      'An Alert component displays important messages or notifications to users with different severity levels. Built on top of heroui-native.',
    link: '/react-native/alert',
    attributes: rnAlertAttributes,
    code: alertCode,
    tags: rnAlertTags,
    icon: CircleAlert,
    isComponent: true
  },
  {
    title: 'Button',
    description:
      'A Button component triggers actions or events. Built on top of heroui-native Button with support for variants, sizes, colors, and loading states.',
    link: '/react-native/button',
    attributes: rnButtonAttributes,
    code: buttonCode,
    tags: rnButtonTags,
    icon: Square,
    isComponent: true
  },
  {
    title: 'Button Group',
    description: 'A Button Group component groups multiple buttons together for selecting from a set of related actions or options.',
    link: '/react-native/button-group',
    attributes: rnButtonGroupAttributes,
    code: buttonGroupCode,
    tags: rnButtonGroupTags,
    icon: Columns3,
    isComponent: true
  },
  {
    title: 'Card',
    description: 'A Card component displays content in a structured container. Built on top of heroui-native Card.',
    link: '/react-native/card',
    attributes: rnCardAttributes,
    code: cardCode,
    tags: rnCardTags,
    icon: CreditCard,
    isComponent: true
  },
  {
    title: 'Checkbox',
    description:
      'A Checkbox component allows users to select or deselect options. Built on top of heroui-native Checkbox with isSelected/onSelectedChange API.',
    link: '/react-native/checkbox',
    attributes: rnCheckAttributes,
    code: checkBoxCode,
    tags: rnCheckboxTags,
    icon: SquareCheck,
    isComponent: true
  },
  {
    title: 'Dialog',
    description: 'A Dialog component displays a pop-up window for capturing user attention or input. Built on top of heroui-native Dialog.',
    link: '/react-native/dialog',
    attributes: rnDialogAttributes,
    code: dialogCode,
    tags: rnDialogTags,
    icon: MessageSquare,
    isComponent: true
  },
  {
    title: 'Divider',
    description: 'A Divider component separates content within a layout. Built on top of heroui-native Separator.',
    link: '/react-native/divider',
    attributes: rnDividerAttributes,
    code: dividerCode,
    tags: rnDividerTags,
    icon: Slash,
    isComponent: true
  },
  {
    title: 'Input',
    description: 'An Input component allows users to enter text data. Built on top of heroui-native Input.',
    link: '/react-native/input',
    attributes: rnInputAttributes,
    code: inputCode,
    tags: rnInputTags,
    icon: TextCursorInput,
    isComponent: true
  },
  {
    title: 'Loading',
    description: 'A Loading component displays a spinner indicator while content is being loaded. Built on top of heroui-native Spinner.',
    link: '/react-native/loading',
    attributes: rnLoadingAttributes,
    code: loadingCode,
    tags: rnAccordionTags,
    icon: Loader,
    isComponent: true
  },
  {
    title: 'Dropdown Menu',
    description: 'A Dropdown Menu component displays a list of options when triggered. Built on top of heroui-native Menu.',
    link: '/react-native/menu',
    attributes: rnMenuAttributes,
    code: menuCode,
    tags: rnMenuTags,
    icon: EllipsisVertical,
    isComponent: true
  },
  {
    title: 'Popover',
    description: 'A Popover component displays additional information in a floating overlay. Built on top of heroui-native Popover.',
    link: '/react-native/popover',
    attributes: rnPopoverAttributes,
    code: popoverCode,
    tags: rnPopoverTags,
    icon: PictureInPicture2,
    isComponent: true
  },
  {
    title: 'Progress',
    description: 'A Progress component visually indicates the completion status of a task. Built on top of heroui-native Progress.',
    link: '/react-native/progress',
    attributes: rnProgressAttributes,
    code: progressCode,
    tags: rnProgressTags,
    icon: RectangleEllipsis,
    isComponent: true
  },
  {
    title: 'Radio Group',
    description:
      'A Radio Group component allows users to select one option from a set of mutually exclusive choices. Built on top of heroui-native RadioGroup.',
    link: '/react-native/radio-group',
    attributes: rnRadioAttributes,
    code: radioGroupCode,
    tags: rnRadioTags,
    icon: CircleDot,
    isComponent: true
  },
  {
    title: 'Select',
    description: 'A Select component allows users to choose from a dropdown list. Built on top of heroui-native Select.',
    link: '/react-native/select',
    attributes: rnSelectAttributes,
    code: selectCode,
    tags: rnSelectTags,
    icon: SquareMousePointer,
    isComponent: true
  },
  {
    title: 'Sheet',
    description: 'A Sheet component presents content in a sliding bottom panel. Built on top of heroui-native Sheet.',
    link: '/react-native/sheet',
    attributes: rnSheetAttributes,
    code: sheetCode,
    tags: rnSheetTags,
    icon: StickyNote,
    isComponent: true
  },
  {
    title: 'Skeleton',
    description:
      'A Skeleton component is a placeholder UI element that represents the layout of content before it loads. Built on top of heroui-native Skeleton.',
    link: '/react-native/skeleton',
    attributes: rnSkeletonAttributes,
    code: skeletonCode,
    tags: rnSkeletonTags,
    icon: TextSelect,
    isComponent: true
  },
  {
    title: 'Slider',
    description:
      'A Slider component allows users to select a value from a range by dragging a thumb along a track. Built on top of heroui-native Slider.',
    link: '/react-native/slider',
    attributes: rnSliderAttributes,
    code: sliderCode,
    tags: rnAccordionTags,
    icon: SlidersHorizontal,
    isComponent: true
  },
  {
    title: 'Switch',
    description: 'A Switch component allows users to toggle between two states. Built on top of heroui-native Switch.',
    link: '/react-native/switch',
    attributes: rnSwitchAttributes,
    code: switchCode,
    tags: rnSwitchTags,
    icon: ToggleRight,
    isComponent: true
  },
  {
    title: 'Tabs',
    description:
      'A Tabs component allows users to switch between different views or sections. Built on top of heroui-native Tabs with items-based API.',
    link: '/react-native/tabs',
    attributes: rnTabsAttributes,
    code: tabsCode,
    tags: rnAccordionTags,
    icon: AppWindow,
    isComponent: true
  },
  {
    title: 'Textarea',
    description: 'A Textarea component allows users to enter multi-line text. Built on top of heroui-native.',
    link: '/react-native/textarea',
    attributes: rnTextareaAttributes,
    code: textareaCode,
    tags: rnTextareaTags,
    icon: TextCursorInput,
    isComponent: true
  },
  {
    title: 'Toast',
    description: 'A Toast component displays transient notifications. Uses heroui-native useToast hook for showing toast messages.',
    link: '/react-native/toast',
    attributes: rnToastAttributes,
    code: toastCode,
    tags: rnToastTags,
    icon: MessageSquareText,
    isComponent: true
  },
  {
    title: 'Tooltip',
    description: 'A Tooltip component displays informative pop-ups when hovering or focusing on an element. Built on top of heroui-native Tooltip.',
    link: '/react-native/tooltip',
    attributes: rnTooltipAttributes,
    code: tooltipCode,
    tags: rnTooltipTags,
    icon: MessageSquareDot,
    isComponent: true
  }
];

export const devtoolsSidebarItems = [
  { title: 'Get Started', description: '', link: '', isHeading: true },
  {
    title: 'Overview',
    description: 'Overview of Nayan UI CLI tools and developer utilities',
    link: '/devtools',
    icon: Wrench
  },
  {
    title: 'Tools',
    description: 'Command line tools and utilities for web development',
    link: '',
    isHeading: true
  },
  {
    title: 'Sitemap Generator',
    description: 'Generate and validate XML sitemaps for better SEO optimization',
    link: '/devtools/sitemap',
    tags: sitemapTags,
    icon: Map
  },
  {
    title: 'Robots.txt Generator',
    description: 'Create and validate robots.txt files for search engine crawling control',
    link: '/devtools/robots',
    tags: robotsTags,
    icon: Bot
  },
  {
    title: 'AI Tools',
    description: 'AI-powered developer tools for code review and security scanning',
    link: '',
    isHeading: true
  },
  {
    title: 'AI Code Reviewer',
    description: 'AI-powered GitHub PR review using Codex & Claude Code',
    link: '/devtools/ai-code-reviewer',
    tags: aiReviewTags,
    icon: Sparkles
  },
  {
    title: 'AI Code Scanner',
    description: 'Scan repositories for package vulnerabilities with auto-fix',
    link: '/devtools/ai-code-scanner',
    tags: aiScannerTags,
    icon: ShieldCheck
  }
];

export const gamesSidebarItems = [
  { title: 'Get Started', description: '', link: '', isHeading: true },
  {
    title: 'Overview',
    description: 'Collection of classic games for React Native applications',
    link: '/games',
    icon: Gamepad2
  },
  {
    title: 'Installation',
    description: 'Installation guide and setup instructions for @nayan-ui/games',
    link: '/games/installation',
    icon: Download
  },
  {
    title: 'API Reference',
    description: 'Complete API documentation for all exported constants and types',
    link: '/games/api-reference',
    icon: BookOpen
  },
  {
    title: 'Licensing',
    description: 'License information, commercial usage, and acknowledgments',
    link: '/games/licensing',
    icon: FileText
  },
  { title: 'Games', description: '', link: '', isHeading: true },
  { title: 'Block Blast', description: 'Strategic block placement puzzle', link: '/games/block-blast', icon: Gamepad2 },
  { title: 'Connect Em All', description: 'Connect matching colored dots', link: '/games/connect-em-all', icon: Gamepad2 },
  { title: 'Bubble Shooter', description: 'Classic bubble matching puzzle', link: '/games/bubble-shooter', icon: Gamepad2 },
  { title: 'Tile Home', description: 'Mahjong-style tile matching', link: '/games/tile-home', icon: Gamepad2 },
  { title: 'Fruit Ninja', description: 'Slice flying fruits action', link: '/games/fruit-ninja', icon: Gamepad2 },
  { title: 'Fruit Merger', description: 'Physics-based fruit merging', link: '/games/fruit-merger', icon: Gamepad2 },
  { title: 'Flappy Bird', description: 'Classic pipe navigation', link: '/games/flappy-bird', icon: Gamepad2 },
  { title: 'Dino Jump', description: 'Endless dinosaur runner', link: '/games/dino-jump', icon: Gamepad2 },
  { title: 'Dots and Boxes', description: 'Strategy territory game', link: '/games/dots-and-boxes', icon: Gamepad2 },
  { title: 'Candy Crush', description: 'Match-3 candy puzzle', link: '/games/candy-crush', icon: Gamepad2 },
  { title: 'Whack A Mole', description: 'Fast-paced reflex game', link: '/games/whack-a-mole', icon: Gamepad2 },
  { title: 'Pac-Man', description: 'Classic maze arcade', link: '/games/pac-man', icon: Gamepad2 },
  { title: 'Colors Sort', description: 'Color sorting logic puzzle', link: '/games/colors-sort', icon: Gamepad2 },
  { title: 'Popit Fidget', description: 'Relaxing bubble popping', link: '/games/popit-fidget', icon: Gamepad2 },
  { title: 'Balloon Blaster', description: 'Pop rising balloons', link: '/games/balloon-blaster', icon: Gamepad2 },
  { title: 'Space Fighter', description: 'Space survival action', link: '/games/space-fighter', icon: Gamepad2 },
  { title: 'Word Search', description: 'Find hidden words puzzle', link: '/games/word-search', icon: Gamepad2 },
  { title: 'Number Search', description: 'Find number sequences', link: '/games/number-search', icon: Gamepad2 },
  { title: 'Tank 1990', description: 'Classic tank battle', link: '/games/tank-1990', icon: Gamepad2 },
  { title: 'Nuts and Bolts', description: 'Physics bolt puzzle', link: '/games/nuts-and-bolts', icon: Gamepad2 },
  { title: 'Ludo King', description: 'Classic board game', link: '/games/ludo-king', icon: Gamepad2 },
  { title: 'Spider Solitaire', description: 'Classic card game', link: '/games/spider-solitaire', icon: Gamepad2 },
  { title: 'Maze Runner', description: 'Procedural maze puzzle', link: '/games/maze-runner', icon: Gamepad2 },
  { title: 'Tic Tac Toe', description: 'Classic X and O strategy', link: '/games/tic-tac-toe', icon: Gamepad2 },
  { title: 'Car Racing', description: 'Traffic dodging racer', link: '/games/car-racing', icon: Gamepad2 },
  { title: 'Bike Racing', description: 'High-speed motorcycle racing', link: '/games/bike-racing', icon: Gamepad2 },
  { title: 'Sliding Numbers', description: 'Classic sliding tile puzzle', link: '/games/sliding-numbers', icon: Gamepad2 },
  { title: '2048', description: 'Addictive number merging', link: '/games/game-2048', icon: Gamepad2 },
  { title: 'Snake 3D', description: 'Classic snake gameplay', link: '/games/snake-3d', icon: Gamepad2 },
  { title: 'Perfect Circle', description: 'Precision drawing challenge', link: '/games/perfect-circle', icon: Gamepad2 },
  { title: 'Sudoku', description: 'Classic number logic puzzle', link: '/games/sudoku', icon: Gamepad2 },
  { title: 'Block Breaker', description: 'Brick-breaking arcade', link: '/games/block-breaker', icon: Gamepad2 },
  { title: 'Knife Hit', description: 'Knife throwing precision', link: '/games/knife-hit', icon: Gamepad2 },
  { title: 'Color Switch', description: 'Color matching arcade', link: '/games/color-switch', icon: Gamepad2 },
  { title: 'Stack Tower', description: 'Precision block stacking', link: '/games/stack-tower', icon: Gamepad2 },
  { title: 'Mine Sweeper', description: 'Classic logic deduction', link: '/games/mine-sweeper', icon: Gamepad2 },
  { title: 'Pipe Connect', description: 'Pipe rotation puzzle', link: '/games/pipe-connect', icon: Gamepad2 }
];
