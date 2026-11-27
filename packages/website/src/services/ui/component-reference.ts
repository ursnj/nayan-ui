import { ALL_PLATFORMS, NATIVE_PLATFORMS, WEB_PLATFORMS } from './reference-platforms';

const components = [
  ['action-item', 'Action Item', 'NActionItem', 'Render a pressable row for an action such as opening a document.'],
  ['accordion', 'Accordion', 'NAccordion', 'Expand a single section or group related panels with single or multiple expansion.'],
  ['alert', 'Alert', 'NAlert', 'Show a status message with a title and optional description.'],
  ['badge', 'Badge', 'NBadge', 'Add a short status label to an interface.'],
  ['blur', 'Blur', 'NBlur', 'Blur the backdrop or sample a specific native source view on Android.'],
  ['button', 'Button', 'NButton', 'Run an action from a labelled button.'],
  ['button-group', 'Button Group', 'NButtonGroup', 'Offer a compact group of selectable actions.'],
  ['card', 'Card', 'NCard', 'Group related content in a themed surface.'],
  ['carousel', 'Carousel', 'NCarousel', 'Swipe or scroll through a set of pages.'],
  ['checkbox', 'Checkbox', 'NCheck', 'Toggle an independent option.'],
  ['chip', 'Chip', 'NChip', 'Show a compact tag or category.'],
  ['code', 'Code', 'NCode', 'Render inline code in a monospace style.'],
  ['confetti', 'Confetti', 'NConfetti', 'Show a short celebration after a user action.'],
  ['confirm-alert', 'Confirm Alert', 'NConfirm', 'Ask the user to confirm or cancel an action.'],
  ['date-picker', 'Date Picker', 'NDatePicker', 'Collect a date with a themed picker.'],
  ['dialog', 'Dialog', 'NDialog', 'Open a modal with focused content and a dismiss action.'],
  ['divider', 'Divider', 'NDivider', 'Separate groups of content with a rule.'],
  ['drawer', 'Drawer', 'NDrawer', 'Reveal a panel from the edge of a screen.'],
  ['empty-state', 'Empty State', 'NEmptyState', 'Explain an empty list or a search with no results.'],
  ['icon', 'Icon', 'NIcon', 'Render an icon by name at a chosen size.'],
  ['image', 'Image', 'NImage', 'Render a local or remote image with a text alternative.'],
  ['input', 'Input', 'NInput', 'Collect a single line of text.'],
  ['input-otp', 'OTP Input', 'NInputOtp', 'Collect a short verification code.'],
  ['kbd', 'Keyboard Key', 'NKbd', 'Display a keyboard key or shortcut.'],
  ['keyboard', 'Keyboard', 'NKeyboard', 'Coordinate software keyboard behavior for a component surface.'],
  ['link', 'Link', 'NLink', 'Add a link with a clear destination.'],
  ['linkify', 'Linkify', 'NLinkify', 'Turn URLs in plain text into links.'],
  ['list', 'List', 'NList', 'Render a virtualized list with stable item keys.'],
  ['loading', 'Loading', 'NLoading', 'Show when work is in progress.'],
  ['menu-item', 'Menu Item', 'NMenuItem', 'Add an action to a menu.'],
  ['number-field', 'Number Field', 'NNumberField', 'Collect a number within optional bounds.'],
  ['page', 'Page', 'NPage', 'Render a screen surface with optional keyboard handling, safe-area insets and viewport sizing.'],
  ['pattern', 'Pattern', 'NPattern', 'Draw a decorative vector pattern behind content.'],
  ['platform-view', 'Platform View', 'NPlatformView', 'Embed platform-rendered content in an engine surface.'],
  ['press', 'Press', 'NPress', 'Make custom content respond to presses.'],
  ['progress', 'Progress', 'NProgress', 'Show how far a task has progressed.'],
  ['radio', 'Radio', 'NRadio', 'Build a single-choice option for a radio group.'],
  ['radio-group', 'Radio Group', 'NRadioGroup', 'Let users pick one option from a group.'],
  ['refresh-control', 'Refresh Control', 'NRefreshControl', 'Add pull-to-refresh to a scroll view.'],
  ['required', 'Required Indicator', 'NRequired', 'Mark a required form field.'],
  ['safe-area', 'Safe Area', 'NSafeArea', 'Keep content clear of system bars and screen cutouts.'],
  ['safe-area-listener', 'Safe Area Listener', 'NSafeAreaListener', 'Observe changes in available screen space and insets.'],
  ['safe-area-provider', 'Safe Area Provider', 'NSafeAreaProvider', 'Share safe area measurements with descendants.'],
  ['scroll-shadow', 'Scroll Shadow', 'NScrollShadow', 'Indicate that more content is available by scrolling.'],
  ['scroll-view', 'Scroll View', 'NScrollView', 'Scroll through a small group of children.'],
  ['search-field', 'Search Field', 'NSearchField', 'Collect a search query.'],
  ['select', 'Select', 'NSelect', 'Select a value from a list of options.'],
  ['sheet', 'Sheet', 'NSheet', 'Reveal modal content from an edge of the screen.'],
  ['skeleton', 'Skeleton', 'NSkeleton', 'Reserve space while content loads.'],
  ['skeleton-group', 'Skeleton Group', 'NSkeletonGroup', 'Group loading placeholders in one layout.'],
  ['slider', 'Slider', 'NSlider', 'Adjust a value by moving a thumb along a track.'],
  ['switch', 'Switch', 'NSwitch', 'Turn a setting on or off.'],
  ['tabs', 'Tabs', 'NTabs', 'Switch between related views.'],
  ['tabs-content', 'Tabs Content', 'NTabsContent', 'Place content beneath a tab selector.'],
  ['text', 'Text', 'NText', 'Display headings, labels or body text.'],
  ['textarea', 'Textarea', 'NTextarea', 'Collect multiline text.'],
  ['theme', 'Theme', 'NTheme', 'Render a themed screen and configure its colour mode, tokens, and shared services.'],
  ['toast', 'Toast', 'NToast', 'Send brief status feedback after an action.'],
  ['toast-host', 'Toast Host', 'NToastHost', 'Mount the host that displays queued notifications.'],
  ['toggle-button', 'Toggle Button', 'NToggleButton', 'Show a button with an on or off state.'],
  ['tooltip', 'Tooltip', 'NTooltip', 'Provide a short explanation beside an interactive control.'],
  ['use-drawer', 'useNDrawer', 'useNDrawer', 'Open, close or read the state of a containing drawer.'],
  ['use-keyboard', 'useNKeyboard', 'useNKeyboard', 'Read software keyboard visibility and dimensions.'],
  ['use-safe-area-frame', 'useNSafeAreaFrame', 'useNSafeAreaFrame', 'Read the safe area provider’s frame.'],
  ['use-safe-area-insets', 'useNSafeAreaInsets', 'useNSafeAreaInsets', 'Read the distances from each edge of the screen.'],
  ['use-system-bars', 'useNSystemBars', 'useNSystemBars', 'Set the status bar appearance on iOS and Android and the navigation bar appearance on Android for the focused screen.'],
  ['use-theme', 'useNTheme', 'useNTheme', 'Read or change the active engine theme.'],
  ['view', 'View', 'NView', 'Lay out and style a group of engine children.']
] as const;

const specialized = [
  ['animation-view', 'Animation View', 'AnimationView', 'Bind engine animation values to a view.', 'animations'],
  ['drawing-canvas', 'Drawing Canvas', 'DrawingCanvas', 'Display and edit a drawing document.', 'drawing'],
  ['game-view', 'Game View', 'GameView', 'Render a game world on a browser or native surface.', 'games'],
  ['joystick', 'Joystick', 'Joystick', 'Read directional touch input in a game loop.', 'games'],
  ['markdown-view', 'Markdown View', 'NMarkdown', 'Display Markdown content in an engine component tree.', 'markdown'],
  ['video-player', 'Video Player', 'VideoPlayer', 'Play a clip with the engine’s media component.', 'video']
] as const;

export const componentReferences = [...components.map((item) => [...item, 'components'] as const), ...specialized]
  .map(([slug, title, symbol, description, module]) => ({
    slug,
    title,
    symbol,
    description,
    module,
    platforms: slug === 'use-system-bars' ? NATIVE_PLATFORMS : ALL_PLATFORMS,
    importPath: `nayan-ui/${module}`,
    path: `/components/${slug}`
  }))
  .sort((first, second) => first.title.localeCompare(second.title));

export function findComponentReference(slug: string) {
  return componentReferences.find((item) => item.slug === slug);
}

export function legacyComponentPlatforms(path: string) {
  const slug = path.slice(path.lastIndexOf('/') + 1);
  return findComponentReference(slug)?.platforms ?? (path.startsWith('/react-native/') ? NATIVE_PLATFORMS : WEB_PLATFORMS);
}

export const legacyComponentAlternatives = {
  menu: 'menu-item',
  'avatar-group': 'view',
  breadcrumbs: 'link',
  calendar: 'date-picker',
  'checkbox-group': 'checkbox',
  'date-field': 'input',
  'date-range-picker': 'date-picker',
  disclosure: 'accordion',
  'infinite-scroll': 'list',
  'list-box': 'checkbox',
  meter: 'progress',
  pagination: 'button',
  popover: 'card',
  'progress-circle': 'progress',
  'switch-group': 'switch',
  table: 'view',
  'tag-group': 'chip',
  'time-field': 'input',
  toolbar: 'button'
} as const;
