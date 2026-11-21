import type { componentReferences } from './component-reference';

type ComponentSymbol = (typeof componentReferences)[number]['symbol'];

// Use the order and level of detail of the former @nayan-ui/react tables.
// Controls with a dedicated props type can use their own declared fields by default.
export const componentAttributeNames: Partial<Record<ComponentSymbol, readonly string[]>> = {
  AnimationView: ['children', 'animatedStyle', 'initial', 'style', 'ref', 'accessibilityLabel'],
  NActionItem: [
    'name', 'description', 'icon', 'showArrow', 'onPress', 'disabled',
    'className', 'titleClassName'
  ],
  NAlert: ['type', 'message', 'title', 'className', 'role', 'children', 'description'],
  NBadge: ['children', 'color', 'variant', 'size', 'className', 'role'],
  NButton: ['disabled', 'className', 'isOutline', 'isLoading', 'loadingText', 'children', 'onPress'],
  NButtonGroup: [
    'className', 'items', 'selected', 'disabled', 'onChange', 'ariaLabel',
    'value', 'defaultValue', 'size'
  ],
  NCard: ['className', 'children', 'onClick'],
  NCarousel: [
    'children', 'value', 'defaultValue', 'onValueChange', 'orientation', 'autoPlay',
    'interval', 'showIndicators', 'indicatorPlacement', 'className'
  ],
  NCheck: [
    'id', 'className', 'labelClassName', 'disabled', 'checked', 'defaultChecked',
    'onChange', 'children', 'required', 'label'
  ],
  NChip: ['children', 'size', 'color', 'variant', 'className'],
  NCloseButton: ['onPress', 'disabled', 'accessibilityLabel', 'className'],
  NCode: ['code', 'children', 'className'],
  NConfirm: [
    'isOpen', 'description', 'title', 'className', 'titleClassName', 'descriptionClassName',
    'cancelClassName', 'confirmClassName', 'confirmText', 'cancelText', 'onResult', 'onOpenChange',
    'children'
  ],
  NDatePicker: [
    'value', 'defaultValue', 'onChange', 'label', 'disabled', 'isInvalid',
    'minimumDate', 'maximumDate', 'className', 'error', 'helperText'
  ],
  NDialog: [
    'isOpen', 'title', 'maxWidth', 'className', 'titleClassName', 'contentClassName',
    'children', 'onOpenChange', 'trigger', 'showCloseButton'
  ],
  NDisclosure: [
    'title', 'children', 'defaultExpanded', 'expanded', 'onExpandedChange', 'disabled',
    'className'
  ],
  NDivider: ['className', 'orientation', 'children'],
  NEmptyState: ['title', 'message', 'className', 'children'],
  NIcon: ['name', 'size', 'color', 'strokeWidth', 'accessibilityLabel', 'className', 'onPress'],
  NImage: [
    'src', 'alt', 'fallbackSource', 'width', 'height', 'className',
    'loading', 'source', 'contentFit', 'onLoad', 'onError'
  ],
  NInput: [
    'id', 'label', 'labelClassName', 'className', 'containerClassName', 'error',
    'helperText', 'onChange', 'onChangeText', 'value', 'defaultValue', 'placeholder',
    'disabled', 'type'
  ],
  NInputOtp: [
    'maxLength', 'value', 'defaultValue', 'onChange', 'disabled', 'pattern',
    'className', 'accessibilityLabel'
  ],
  NKbd: ['children', 'className'],
  NLink: ['href', 'children', 'className', 'target', 'rel'],
  NLinkify: ['text', 'children', 'className', 'linkStyle', 'onPress'],
  NList: [
    'data', 'renderItem', 'keyExtractor', 'height', 'itemSize', 'estimatedItemSize',
    'numColumns', 'onEndReached', 'onEndReachedThreshold', 'ListEmptyComponent', 'onRefresh', 'refreshing',
    'className'
  ],
  NLoading: ['className', 'accessibilityLabel', 'size', 'color', 'label', 'animating'],
  NMarkdown: ['source', 'children', 'document', 'blockSpacing', 'styles', 'classNames', 'className'],
  NMenuItem: ['title', 'children', 'separator', 'className', 'disabled', 'id', 'onAction'],
  NNumberField: [
    'value', 'defaultValue', 'onChange', 'minValue', 'maxValue', 'step',
    'disabled', 'isInvalid', 'className', 'label'
  ],
  NPage: [
    'children', 'className', 'style', 'background', 'keyboard', 'safeArea',
    'showsVerticalScrollIndicator', 'onError'
  ],
  NPattern: ['recipe', 'style', 'className', 'onError'],
  NPlatformView: ['children', 'className', 'style', 'accessibilityLabel'],
  NPress: [
    'children', 'onPress', 'isDisabled', 'isSelected', 'type', 'className',
    'style', 'accessibilityLabel', 'ref'
  ],
  NProgress: ['value', 'className', 'label', 'showLabel', 'color', 'size'],
  NRadio: ['children', 'label', 'value', 'disabled', 'className'],
  NRadioGroup: [
    'orientation', 'items', 'className', 'id', 'label', 'labelClassName',
    'disabled', 'value', 'defaultValue', 'onChange', 'showLabel', 'children'
  ],
  NRequired: ['children', 'className', 'accessibilityLabel'],
  NSafeArea: ['children', 'edges', 'mode', 'className', 'style', 'ref'],
  NSafeAreaListener: ['onChange', 'children', 'style'],
  NSafeAreaProvider: ['children', 'initialMetrics', 'initialSafeAreaInsets', 'style', 'ref'],
  NScrollShadow: ['children', 'orientation', 'showsScrollIndicator', 'className'],
  NScrollView: [
    'children', 'horizontal', 'contentContainerClassName', 'contentContainerStyle', 'refreshControl', 'showsHorizontalScrollIndicator',
    'showsVerticalScrollIndicator', 'className', 'style'
  ],
  NSearchField: [
    'value', 'defaultValue', 'onChange', 'onSubmit', 'placeholder', 'disabled',
    'isInvalid', 'className', 'label'
  ],
  NSelect: [
    'isMulti', 'label', 'placeholder', 'isLoading', 'isClearable', 'isSearchable',
    'disabled', 'className', 'selectClassName', 'value', 'defaultValue', 'options',
    'onChangeOptions', 'name'
  ],
  NSheet: [
    'isOpen', 'title', 'maxWidth', 'className', 'titleClassName', 'contentClassName',
    'children', 'onOpenChange', 'snapPoints', 'isSwipeable', 'trigger'
  ],
  NSkeleton: ['className', 'width', 'height', 'role', 'accessibilityLabel'],
  NSkeletonGroup: ['children', 'className', 'style', 'accessibilityLabel'],
  NSlider: [
    'label', 'className', 'id', 'value', 'defaultValue', 'min',
    'max', 'step', 'disabled', 'orientation', 'onChange', 'showOutput',
    'accessibilityLabel'
  ],
  NSwitch: [
    'enabled', 'defaultChecked', 'label', 'className', 'labelClassName', 'onChange',
    'id', 'checked', 'disabled', 'value'
  ],
  NTabs: [
    'items', 'children', 'selected', 'className', 'onChange', 'ariaLabel',
    'id', 'value', 'defaultValue', 'orientation'
  ],
  NTabsContent: ['item', 'children', 'className'],
  NText: [
    'children', 'text', 'tag', 'className', 'style', 'numberOfLines',
    'selectable', 'accessibilityLabel', 'ref'
  ],
  NTextarea: [
    'id', 'label', 'labelClassName', 'className', 'error', 'helperText',
    'onChange', 'value', 'defaultValue', 'placeholder', 'rows', 'maxLength'
  ],
  NTheme: [
    'children', 'defaultTheme', 'themes', 'colors', 'components', 'radius',
    'stylesheet', 'fonts', 'persistence', 'onThemeChange'
  ],
  NToggleButton: [
    'children', 'isSelected', 'defaultSelected', 'disabled', 'variant', 'size',
    'onChange', 'className', 'accessibilityLabel'
  ],
  NTooltip: ['message', 'className', 'children', 'id', 'accessibilityLabel'],
  NView: ['children', 'tag', 'className', 'style', 'id', 'role', 'accessibilityLabel', 'ref'],
  VideoPlayer: [
    'source', 'controls', 'autoPlay', 'loop', 'muted', 'volume',
    'contentFit', 'style', 'ref', 'onStatusChange', 'onProgress', 'onError'
  ]
};
