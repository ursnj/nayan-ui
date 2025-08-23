import {
  AppWindow,
  Badge,
  Bot,
  CircleAlert,
  CircleCheck,
  CircleDot,
  Columns3,
  CreditCard,
  EllipsisVertical,
  FileCode,
  GalleryVertical,
  Grid3x3,
  HandCoins,
  Link,
  Link2,
  ListCollapse,
  Loader,
  Map,
  MessageSquare,
  MessageSquareDot,
  MessageSquareText,
  MessageSquareWarning,
  PictureInPicture2,
  RectangleEllipsis,
  Settings,
  Slash,
  SlidersHorizontal,
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
  badgeAttributes,
  buttonAttributes,
  buttonGroupAttributes,
  cardAttributes,
  checkboxAttributes,
  confirmAlertAttributes,
  dialogAttributes,
  dividerAttributes,
  infiniteScrollAttributes,
  inputAttributes,
  linkAttributes,
  loadingAttributes,
  menuAttributes,
  popoverAttributes,
  progressAttributes,
  radioGroupAttributes,
  selectAttributes,
  sheetAttributes,
  skeletonAttributes,
  sliderAttributes,
  switchAttributes,
  tableAttributes,
  tabsAttributes,
  textareaAttributes,
  toastAttributes,
  tooltipAttributes
} from '@/services/ReactAttributes';
import {
  accordionCode,
  alertCode,
  badgeCode,
  buttonCode,
  buttonGroupCode,
  cardCode,
  checkBoxCode,
  confirmAlertCode,
  dialogCode,
  dividerCode,
  infiniteScrollCode,
  inputCode,
  inputHookCode,
  linkCode,
  linkifyCode,
  loadingCode,
  menuCode,
  popoverCode,
  progressCode,
  radioGroupCode,
  selectCode,
  sheetCode,
  skeletonCode,
  sliderCode,
  switchCode,
  tableCode,
  tabsCode,
  textareaCode,
  toastCode,
  tooltipCode
} from '@/services/ReactCodeBlocks';
import {
  accordionTags,
  alertTags,
  badgeTags,
  buttonGroupTags,
  buttonTags,
  cardTags,
  checkboxTags,
  confirmAlertTags,
  dialogTags,
  dividerTags,
  infiniteScrollTags,
  inputTags,
  linkTags,
  linkifyTags,
  loadingTags,
  menuTags,
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
  rnLinkifyTags,
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
  selectTags,
  seoMasterTags,
  sheetTags,
  skeletonTags,
  sliderTags,
  switchTags,
  tableTags,
  tabsTags,
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
    component: () => import('../react/components/Accordion.tsx?raw'),
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
    component: () => import('../react/components/Alert.tsx?raw'),
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
    component: () => import('../react/components/Badge.tsx?raw'),
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
    component: () => import('../react/components/Button.tsx?raw'),
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
    component: () => import('../react/components/ButtonGroup.tsx?raw'),
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
    component: () => import('../react/components/Card.tsx?raw'),
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
    component: () => import('../react/components/Checkbox.tsx?raw'),
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
    component: () => import('../react/components/ConfirmAlert.tsx?raw'),
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
    component: () => import('../react/components/Dialog.tsx?raw'),
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
    component: () => import('../react/components/Divider.tsx?raw'),
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
    component: () => import('../react/components/InfiniteScroll.tsx?raw'),
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
    component: () => import('../react/components/Input.tsx?raw'),
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
    component: () => import('../react/components/Link.tsx?raw'),
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
    component: () => import('../react/components/Linkify.tsx?raw'),
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
    component: () => import('../react/components/Loading.tsx?raw'),
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
    component: () => import('../react/components/Menu.tsx?raw'),
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
    component: () => import('../react/components/Popover.tsx?raw'),
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
    component: () => import('../react/components/Progress.tsx?raw'),
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
    component: () => import('../react/components/RadioGroup.tsx?raw'),
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
    component: () => import('../react/components/Select.tsx?raw'),
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
    component: () => import('../react/components/Sheet.tsx?raw'),
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
    component: () => import('../react/components/Skeleton.tsx?raw'),
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
    component: () => import('../react/components/Slider.tsx?raw'),
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
    component: () => import('../react/components/Switch.tsx?raw'),
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
    component: () => import('../react/components/Table.tsx?raw'),
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
    component: () => import('../react/components/Tabs.tsx?raw'),
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
    component: () => import('../react/components/Textarea.tsx?raw'),
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
    component: () => import('../react/components/Toast.tsx?raw'),
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
    component: () => import('../react/components/Tooltip.tsx?raw'),
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
      'An Accordion component is a UI element that allows users to expand and collapse sections of content. It is commonly used to organize information in a compact and accessible manner, displaying only the headers by default and revealing the associated content when clicked. This helps improve the readability of complex or lengthy information by reducing clutter on the page.',
    link: '/react-native/accordion',
    attributes: accordionAttributes,
    code: accordionCode,
    tags: rnAccordionTags,
    icon: ListCollapse,
    component: () => import('../../../../examples/expo-app/src/app/accordion.tsx?raw'),
    isComponent: true
  },
  {
    title: 'Alert',
    description:
      "An Alert component is a UI element used to display important messages or notifications to users. It can convey different types of information such as success, warning, error, or informational messages, typically styled with distinct colors and icons to highlight the message's significance. Alerts are often used to grab the user's attention and provide immediate feedback on actions or events.",
    link: '/react-native/alert',
    attributes: alertAttributes,
    code: alertCode,
    tags: rnAlertTags,
    icon: CircleAlert,
    component: () => import('../../../../examples/expo-app/src/app/alert.tsx?raw'),
    isComponent: true
  },
  {
    title: 'Button',
    description:
      'A Button component is a fundamental UI element that allows users to trigger actions or events, such as submitting a form, opening a dialog, or navigating to another page. Buttons are interactive and typically styled to stand out, making it easy for users to identify and interact with them. They can come in various types, such as primary, secondary, or disabled, depending on their purpose or state.',
    link: '/react-native/button',
    attributes: buttonAttributes,
    code: buttonCode,
    tags: rnButtonTags,
    icon: Square,
    component: () => import('../../../../examples/expo-app/src/app/button.tsx?raw'),
    isComponent: true
  },
  {
    title: 'Button Group',
    description:
      'A Button Group component is a UI element that groups multiple buttons together, allowing users to select from a set of related actions or options. It helps organize buttons in a compact, cohesive layout, typically displayed in a horizontal or vertical row. Button Groups are useful for actions that are closely related or mutually exclusive, providing a clean and structured way to present multiple controls.',
    link: '/react-native/button-group',
    attributes: buttonGroupAttributes,
    code: buttonGroupCode,
    tags: rnButtonGroupTags,
    icon: Columns3,
    component: () => import('../../../../examples/expo-app/src/app/button-group.tsx?raw'),
    isComponent: true
  },
  {
    title: 'Card',
    description:
      'A Card component is a versatile UI element used to display content in a structured and visually appealing way. It typically contains related information, such as text, images, buttons, and other elements, within a bordered or shadowed container. Cards are often used for presenting individual items, like products, articles, or profiles, making the content easy to scan and interact with.',
    link: '/react-native/card',
    attributes: cardAttributes,
    code: cardCode,
    tags: rnCardTags,
    icon: CreditCard,
    component: () => import('../../../../examples/expo-app/src/app/card.tsx?raw'),
    isComponent: true
  },
  {
    title: 'Checkbox',
    description:
      'A Checkbox component is a UI element that allows users to select or deselect one or more options from a list. It typically appears as a small square that can be checked (ticked) or unchecked. Checkboxes are often used in forms, settings, or filters where multiple selections are needed, and they provide a clear, binary choice for users.',
    link: '/react-native/checkbox',
    attributes: checkboxAttributes,
    code: checkBoxCode,
    tags: rnCheckboxTags,
    icon: SquareCheck,
    component: () => import('../../../../examples/expo-app/src/app/checkbox.tsx?raw'),
    isComponent: true
  },
  {
    title: 'Dialog',
    description:
      'A Dialog component is a UI element that displays a pop-up window over the main content to capture user attention or request input. It is often used for tasks like confirmations, alerts, forms, or other interactions that require user feedback before proceeding. Dialogs can include buttons like "OK" or "Cancel" to confirm or dismiss actions, and typically block interaction with the underlying content until closed.',
    link: '/react-native/dialog',
    attributes: dialogAttributes,
    code: dialogCode,
    tags: rnDialogTags,
    icon: MessageSquare,
    component: () => import('../../../../examples/expo-app/src/app/dialog.tsx?raw'),
    isComponent: true
  },
  {
    title: 'Divider',
    description:
      'A Divider component is a simple UI element used to separate content within a layout, creating visual distinction between sections. It helps enhance the organization and readability of the interface by providing clear boundaries between different elements, such as text blocks, images, or other components. Dividers can be styled in various ways (solid, dashed, or dotted) and can vary in thickness and color to match the overall design of the application.',
    link: '/react-native/divider',
    attributes: dividerAttributes,
    code: dividerCode,
    tags: rnDividerTags,
    icon: Slash,
    component: () => import('../../../../examples/expo-app/src/app/divider.tsx?raw'),
    isComponent: true
  },
  {
    title: 'Input',
    description:
      'An Input component is a user interface element that allows users to enter data, such as text, numbers, or selections. It typically includes various types, such as text fields, checkboxes, radio buttons, and dropdowns, providing flexibility for different data types. Input components are essential for forms and interactive applications, enabling users to submit information effectively and efficiently.',
    link: '/react-native/input',
    attributes: inputAttributes,
    code: inputCode,
    tags: rnInputTags,
    icon: TextCursorInput,
    component: () => import('../../../../examples/expo-app/src/app/input.tsx?raw'),
    isComponent: true
  },
  {
    title: 'Linkify',
    description:
      'A Linkify component is a UI tool that automatically detects and converts plain text URLs within a content area into clickable hyperlinks. This enhances user experience by allowing easy access to external resources without the need for manual formatting. Linkify typically recognizes various URL formats and ensures that they are presented in a visually distinct manner, making navigation seamless and intuitive.',
    link: '/react-native/linkify',
    attributes: linkAttributes,
    code: linkifyCode,
    tags: rnLinkifyTags,
    icon: SquareArrowOutUpRight,
    component: () => import('../../../../examples/expo-app/src/app/linkify.tsx?raw'),
    isComponent: true
  },
  {
    title: 'Dropdown Menu',
    description:
      'A Dropdown Menu component is a UI element that allows users to select an option from a list that appears when the user clicks or hovers over a button or link. This component helps save space on the interface by displaying additional options only when needed. Dropdown menus are commonly used for navigation, settings, or forms, enabling users to choose from multiple choices in a clean and organized manner.',
    link: '/react-native/menu',
    attributes: menuAttributes,
    code: menuCode,
    tags: rnMenuTags,
    icon: EllipsisVertical,
    component: () => import('../../../../examples/expo-app/src/app/menu.tsx?raw'),
    isComponent: true
  },
  {
    title: 'Popover',
    description:
      'A Popover component is a UI element that displays additional information or actions when users interact with a specific trigger, such as a button or link. It typically appears as a small overlay or tooltip that provides context, tips, or options without navigating away from the current page. Popovers enhance user experience by offering relevant content in a concise format while maintaining focus on the main interface.',
    link: '/react-native/popover',
    attributes: popoverAttributes,
    code: popoverCode,
    tags: rnPopoverTags,
    icon: PictureInPicture2,
    component: () => import('../../../../examples/expo-app/src/app/popover.tsx?raw'),
    isComponent: true
  },
  {
    title: 'Progress',
    description:
      'A Progress component visually indicates the completion status of a task or process. It typically consists of a progress bar that fills up as the task progresses, providing users with a clear and immediate understanding of how much of the task is completed and how much remains. This component is commonly used in forms, uploads, downloads, and loading states to enhance user experience by managing expectations and keeping users informed.',
    link: '/react-native/progress',
    attributes: progressAttributes,
    code: progressCode,
    tags: rnProgressTags,
    icon: RectangleEllipsis,
    component: () => import('../../../../examples/expo-app/src/app/progress.tsx?raw'),
    isComponent: true
  },
  {
    title: 'Radio Group',
    description:
      'A Radio Group component is a UI element that allows users to select one option from a set of mutually exclusive choices. It typically consists of multiple radio buttons, where only one button can be selected at a time. Radio groups are commonly used in forms to gather user preferences, ensuring a clear and organized way to present options for selection. They enhance user experience by providing a straightforward interface for making single-choice decisions.',
    link: '/react-native/radio-group',
    attributes: radioGroupAttributes,
    code: radioGroupCode,
    tags: rnRadioTags,
    icon: CircleDot,
    component: () => import('../../../../examples/expo-app/src/app/radio.tsx?raw'),
    isComponent: true
  },
  {
    title: 'Select',
    description:
      'A Select or ComboBox component is a UI element that allows users to choose one or more options from a dropdown list. It typically displays a default value or prompt, and when clicked, it expands to show a list of available choices. Users can either select an option from the list or, in the case of a ComboBox, input custom values. This component is ideal for conserving space in forms and making it easy for users to make selections quickly.',
    link: '/react-native/select',
    attributes: selectAttributes,
    code: selectCode,
    tags: rnSelectTags,
    icon: SquareMousePointer,
    component: () => import('../../../../examples/expo-app/src/app/select.tsx?raw'),
    isComponent: true
  },
  {
    title: 'Sheet',
    description:
      'A Sheet component is a UI element that presents content in a sliding panel, often overlaying the main application interface. It is typically used for displaying additional information, forms, or actions without navigating away from the current view. Sheets can be swiped or tapped to expand or collapse, providing a clean and efficient way to manage user interactions and maintain focus on the main content.',
    link: '/react-native/sheet',
    attributes: sheetAttributes,
    code: sheetCode,
    tags: rnSheetTags,
    icon: StickyNote,
    component: () => import('../../../../examples/expo-app/src/app/sheet.tsx?raw'),
    isComponent: true
  },
  {
    title: 'Skeleton',
    description:
      'A Skeleton component is a placeholder UI element that represents the layout of content before it loads. It typically features a grey or light-colored shape mimicking the structure of the actual content (such as text blocks, images, or buttons) to indicate that loading is in progress. Skeleton components enhance user experience by providing a visual cue that content is being fetched, reducing perceived loading times and preventing layout shifts.',
    link: '/react-native/skeleton',
    attributes: skeletonAttributes,
    code: skeletonCode,
    tags: rnSkeletonTags,
    icon: TextSelect,
    component: () => import('../../../../examples/expo-app/src/app/skeleton.tsx?raw'),
    isComponent: true
  },
  {
    title: 'Switch',
    description:
      'A Switch component is a UI element that allows users to toggle between two states, typically representing an on/off or enabled/disabled choice. It is visually represented as a sliding toggle or checkbox and provides immediate feedback when the user interacts with it. Switch components are commonly used for settings, preferences, and feature activations in applications, enhancing user experience by simplifying the selection process.',
    link: '/react-native/switch',
    attributes: switchAttributes,
    code: switchCode,
    tags: rnSwitchTags,
    icon: ToggleRight,
    component: () => import('../../../../examples/expo-app/src/app/switch.tsx?raw'),
    isComponent: true
  },
  {
    title: 'Textarea',
    description:
      'A Textarea component is an input field that allows users to enter multi-line text. It provides a larger area for text input compared to a standard text input field, making it ideal for comments, feedback, or any scenario where users need to provide detailed information. Textareas can be resized, styled, and configured to support features like character limits, placeholders, and auto-resizing to enhance user experience.',
    link: '/react-native/textarea',
    attributes: textareaAttributes,
    code: textareaCode,
    tags: rnTextareaTags,
    icon: TextCursorInput,
    component: () => import('../../../../examples/expo-app/src/app/textarea.tsx?raw'),
    isComponent: true
  },
  {
    title: 'Toast',
    description:
      'A Toast component is a transient notification that appears on the screen to provide feedback or information to users without interrupting their workflow. Typically displayed at the top or bottom of the screen, toasts are brief messages that automatically disappear after a short duration. They are commonly used to inform users about actions such as successful submissions, updates, or alerts, enhancing the overall user experience with minimal disruption.',
    link: '/react-native/toast',
    attributes: toastAttributes,
    code: toastCode,
    tags: rnToastTags,
    icon: MessageSquareText,
    component: () => import('../../../../examples/expo-app/src/app/toast.tsx?raw'),
    isComponent: true
  },
  {
    title: 'Tooltip',
    description:
      'A Tooltip component is a small, informative pop-up that appears when a user hovers over or focuses on an element, such as a button or icon. It provides additional context or explanations about that element without cluttering the interface. Tooltips enhance user experience by offering helpful hints, instructions, or details, ensuring that information is accessible without overwhelming the layout.',
    link: '/react-native/tooltip',
    attributes: tooltipAttributes,
    code: tooltipCode,
    tags: rnTooltipTags,
    icon: MessageSquareDot,
    component: () => import('../../../../examples/expo-app/src/app/tooltip.tsx?raw'),
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
    icon: Map
  },
  {
    title: 'Robots.txt Generator',
    description: 'Create and validate robots.txt files for search engine crawling control',
    link: '/devtools/robots',
    icon: Bot
  }
];
