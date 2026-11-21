import type { CSSProperties, ReactNode } from 'react';

/** Shared engine control props. Web and native naming aliases are accepted together. */
/** Entrance motion for a component first painted by a browser ComponentsRoot with a stylesheet. */
export interface ViewEntrance {
  duration: number;
  delay?: number;
  opacity?: number;
  translateY?: number;
  /** Play again after the view fully leaves the viewport. Defaults to false. */
  replay?: boolean;
}

export interface ComponentProps {
  'entrance'?: ViewEntrance;
  'autoCapitalize'?: string;
  'autoComplete'?: string;
  'autoCorrect'?: boolean;
  'autoFocus'?: boolean;
  'returnKeyType'?: string;
  'inputMode'?: string;
  'minLength'?: number;
  'pattern'?: string;
  'dateTime'?: string;
  'sizes'?: string;
  'onSubmit'?: (values: Record<string, string>) => void;
  'text'?: string;
  'tag'?: string;
  'htmlFor'?: string;
  'required'?: boolean;
  'target'?: string;
  'rel'?: string;
  'preload'?: boolean;
  'loading'?: 'eager' | 'lazy';
  'decoding'?: 'async' | 'sync' | 'auto';
  'fill'?: boolean;
  'tabIndex'?: number;
  'rows'?: number;
  'role'?: string;
  'onVisibleChange'?: (visible: boolean) => void;
  'id'?: string;
  /** Supported Tailwind-style utilities, resolved entirely in Rust. See the engine README. */
  'className'?: string;
  'containerClassName'?: string;
  'labelClassName'?: string;
  'descriptionClassName'?: string;
  'errorClassName'?: string;
  'style'?: ComponentStyleProp;
  'components'?: Readonly<Record<string, { className?: string; style?: ComponentStyle }>>;
  'color'?: string;
  'pointerEvents'?: string;
  'accessibilityRole'?: string;
  'testID'?: string;
  /** Semantic theme-token overrides, scoped to NTheme and its descendants. */
  'colors'?: ComponentThemeColors;
  'themes'?: { light?: ComponentThemeColors; dark?: ComponentThemeColors };
  /** Base radius in logical points, scoped to NTheme descendants. */
  'radius'?: number;
  'children'?: ReactNode;
  'numberOfLines'?: number;
  /** Set false to exclude rendered browser text from selection and copying. */
  'selectable'?: boolean;
  'label'?: string;
  'title'?: string;
  'name'?: string;
  'variant'?: string;
  'size'?: string | number;
  'isInvalid'?: boolean;
  'placeholderTextColor'?: string;
  'onLongPress'?: () => void;
  'message'?: string;
  'description'?: string;
  'helperText'?: string;
  'error'?: string;
  'errorMessage'?: string;
  'placeholder'?: string;
  'value'?: string | number | boolean | ComponentOption | null;
  'defaultValue'?: string | number | boolean;
  'checked'?: boolean;
  'enabled'?: boolean;
  'isSelected'?: boolean;
  'defaultChecked'?: boolean;
  'defaultSelected'?: boolean;
  'disabled'?: boolean;
  'isDisabled'?: boolean;
  'isLoading'?: boolean;
  'isOutline'?: boolean;
  'loadingText'?: string;
  'isReadOnly'?: boolean;
  'readOnly'?: boolean;
  'isRequired'?: boolean;
  'multiline'?: boolean;
  'keyboardType'?: ComponentKeyboardType;
  'inputProps'?: Pick<
    ComponentProps,
    | 'maxLength'
    | 'keyboardType'
    | 'secureTextEntry'
    | 'className'
    | 'autoFocus'
    | 'autoCorrect'
    | 'autoCapitalize'
    | 'autoComplete'
    | 'inputMode'
    | 'returnKeyType'
  >;
  'textAreaProps'?: Pick<
    ComponentProps,
    'autoFocus' | 'autoCorrect' | 'autoCapitalize' | 'autoComplete' | 'inputMode' | 'returnKeyType' | 'numberOfLines' | 'maxLength' | 'className'
  >;
  'secureTextEntry'?: boolean;
  'type'?: string;
  'maxLength'?: number;
  'min'?: number | string;
  'max'?: number | string;
  'minValue'?: number;
  'maxValue'?: number;
  'step'?: number;
  'showOutput'?: boolean;
  'showLabel'?: boolean;
  'width'?: number;
  'height'?: number;
  'theme'?: 'light' | 'dark' | 'system' | null;
  'showsScrollIndicator'?: boolean;
  'orientation'?: 'horizontal' | 'vertical';
  'items'?: readonly (string | ComponentOption)[];
  'options'?: readonly ComponentOption[];
  'selected'?: string;
  'item'?: string;
  'href'?: string;
  'code'?: string;
  'fallback'?: string;
  'alt'?: string;
  'defaultExpanded'?: boolean;
  'expanded'?: boolean;
  'onExpandedChange'?: (expanded: boolean) => void;
  'separator'?: boolean;
  'hasSeparator'?: boolean;
  'accessibilityLabel'?: string;
  'aria-label'?: string;
  'ariaLabel'?: string;
  'onPress'?: () => void;
  'onClick'?: () => void;
  'onAction'?: () => void;
  'onChange'?: (value: unknown) => void;
  'onValueChange'?: (value: string | number) => void;
  'onChangeText'?: (value: string) => void;
  'onSelectedChange'?: (value: boolean) => void;
  'onClose'?: () => void;
}

export interface ComponentOption {
  label: string;
  value: string;
  disabled?: boolean;
  isDisabled?: boolean;
}

export type ComponentKeyboardType =
  | 'default'
  | 'numeric'
  | 'phone-pad'
  | 'number-pad'
  | 'decimal-pad'
  | 'email-address'
  | 'url'
  | 'ascii-capable'
  | 'numbers-and-punctuation'
  | 'name-phone-pad'
  | 'twitter'
  | 'web-search'
  | 'visible-password'
  | 'ascii-capable-number-pad';

export interface ComponentNode {
  id: string;
  kind: string;
  props: Record<string, unknown>;
  children: ComponentNode[];
}

export interface ComponentSemantic {
  editor?: {
    rect?: [number, number, number, number];
    color: string;
    placeholderColor: string;
    placeholder: string;
    fontSize: number;
    fontWeight: string;
    lineHeight: number;
    padding: [number, number, number, number];
    textAlign: 'left' | 'center' | 'right';
    autoCapitalize?: string;
    autoComplete?: string;
    autoCorrect?: boolean;
    autoFocus?: boolean;
    inputMode?: string;
    returnKeyType?: string;
  };
  id: string;
  kind: string;
  label: string;
  value: unknown;
  disabled: boolean;
  rect: [number, number, number, number];
  maxLength: number | null;
  readOnly: boolean;
  secret: boolean;
  multiline: boolean;
  inputType: string;
  keyboardType?: ComponentKeyboardType;
  platformEdit: boolean;
  expanded?: boolean;
  multiple?: boolean;
  selected?: boolean;
  selectOwner?: string;
  activeDescendant?: string;
  valueLabel?: string;
  headingLevel?: number;
  min: number;
  max: number;
  step: number;
}

export interface ComponentSnapshot {
  /** An input acknowledgement replaces only the listed nodes, preserving screen geometry/resources. */
  partial?: boolean;
  /** Focus target owned by Rust, mirrored by browser accessibility controls. */
  focused?: string | null;
  /** Plain text selected in Rust; the web host mirrors it for native browser Copy commands. */
  selectionText?: string;
  /** Hover cursor selected by Rust's rendered controls and hit testing. */
  cursor?: CSSProperties['cursor'];
  /** Editable input ids in Rust layout order, including fields outside the viewport. */
  inputFields?: string[];
  contentSize?: [number, number];
  revision: number;
  nodes: ComponentSemantic[];
  events: {
    id: string;
    type: 'submit' | 'visible' | 'press' | 'pressState' | 'longPress' | 'change' | 'loadStart' | 'load' | 'error' | 'loadEnd' | 'copy';
    value?: unknown;
    sequence: number;
  }[];
  overlays?: Record<string, [number, number, number, number]>;
  overlayClips?: Record<string, [number, number, number, number]>;
  /** Visible at layout time and awaiting the primary or fallback image. */
  priorityImagesPending?: boolean;
  imageRequests?: {
    request: number;
    source: Record<string, unknown>;
    cachePolicy: string;
    decode?: { width: number; height: number; fit: number };
  }[];
}

export interface ComponentLoadingProps extends Omit<ComponentProps, 'size'> {
  /** Center within the remaining visible area, below any preceding content. */
  fill?: boolean;
  /** Ring diameter in logical points. small=20, medium=32 (default), large=48. */
  size?: 'small' | 'medium' | 'large' | number;
  /** Optional ring thickness; defaults to 10% of its diameter. */
  strokeWidth?: number;
  /** Optional caption displayed beneath the ring. */
  label?: string;
  /** Show a static ring when false. Reduced-motion preferences are automatic. */
  animating?: boolean;
}

export interface ComponentControlProps<T> extends Omit<ComponentProps, 'value' | 'defaultValue' | 'onChange' | 'onValueChange'> {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  onValueChange?: (value: T) => void;
}

export interface ComponentTextChange {
  target: { value: string };
  currentTarget: { value: string };
}

export interface ComponentInputProps extends Omit<ComponentControlProps<string>, 'onChange'> {
  onChange?: (value: ComponentTextChange) => void;
}

export type ComponentThemeColor =
  | 'background'
  | 'foreground'
  | 'surface'
  | 'surface-foreground'
  | 'surface-secondary'
  | 'surface-tertiary'
  | 'overlay'
  | 'overlay-foreground'
  | 'muted'
  | 'default'
  | 'default-foreground'
  | 'accent'
  | 'action'
  | 'action-foreground'
  | 'field-border'
  | 'accent-foreground'
  | 'field-background'
  | 'field-foreground'
  | 'field-placeholder'
  | 'success'
  | 'success-foreground'
  | 'warning'
  | 'warning-foreground'
  | 'danger'
  | 'danger-foreground'
  | 'border'
  | 'separator'
  | 'focus'
  | 'link';

export type ComponentThemeColors = Partial<Record<ComponentThemeColor, string>>;

/** Declarative style data; Rust resolves dimensions, flex layout and text properties. */
export interface ComponentStyle extends CSSProperties {
  paddingHorizontal?: number;
  paddingVertical?: number;
  marginHorizontal?: number;
  marginVertical?: number;
  elevation?: number;
  textShadowColor?: string;
  textShadowOffset?: { width: number; height: number };
  textShadowRadius?: number;
  [variable: `--${string}`]: string | number | undefined;
}

export type ComponentStyleProp = ComponentStyle | false | null | undefined | readonly ComponentStyleProp[];
