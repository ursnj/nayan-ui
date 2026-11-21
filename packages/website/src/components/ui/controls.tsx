'use client';

import {
  NLink as EngineLink,
  NLoading as EngineLoading,
  NProgress as EngineProgress,
  NPress,
  NText,
  NToast,
  NView
} from 'nayan-ui/components';
import {
  useEffect,
  useId,
  useRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ComponentProps,
  type HTMLAttributes,
  type Key,
  type ReactNode
} from 'react';

const classGroup = (name: string) => {
  const prefix = name.match(/^(.*:)?([^:]+)$/);
  if (!prefix) return name;
  const [, variant = '', utility = ''] = prefix;
  const size = /^text-(?:xs|sm|base|lg|xl|[2-9]xl|\[(?:[\d.]+(?:px|rem|em)|length:.*)\])$/.test(utility);
  const group = size ? 'text-size' :
    /^(?:h|w|min-h|min-w|max-h|max-w|p[xytrbl]?|m[xytrbl]?|gap(?:-[xy])?|rounded|opacity)-/.exec(utility)?.[0];
  return group ? variant + group : name;
};

export function cn(...values: (string | false | null | undefined)[]): string {
  const classes = new Map<string, string>();
  for (const value of values) {
    if (!value) continue;
    for (const name of value.trim().split(/\s+/)) classes.set(classGroup(name), name);
  }
  return [...classes.values()].join(' ');
}
export const showToast = (message: string, title?: string) => NToast.show({ message, title });

export function NButton({
  className,
  isOutline,
  isLoading,
  loadingText,
  disabled,
  children,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { isOutline?: boolean; isLoading?: boolean; loadingText?: string }) {
  return (
    <NPress
      {...(props as ComponentProps<typeof NPress>)}
      type={props.type ?? 'button'}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      onClick={onClick as ComponentProps<typeof NPress>['onClick']}
      className={cn(
        'inline-flex h-9 flex-row items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-focus disabled:opacity-50',
        isOutline ? 'border border-default bg-transparent text-foreground hover:bg-default' : 'bg-accent text-accent-foreground hover:brightness-95',
        className
      )}
    >
      {isLoading ? (
        <>
          <EngineLoading size={14} color="currentColor" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </NPress>
  );
}

export function NCard({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: 'transparent' | 'default' | 'secondary' | 'tertiary' }) {
  return (
    <NView
      {...(props as ComponentProps<typeof NView>)}
      tag="div"
      className={cn(
        'rounded-xl border border-default p-4',
        variant === 'transparent'
          ? 'bg-transparent'
          : variant === 'secondary'
            ? 'bg-surface-secondary'
            : variant === 'tertiary'
              ? 'bg-surface-tertiary'
              : 'bg-surface',
        className
      )}
    />
  );
}

type Tone = 'default' | 'accent' | 'success' | 'warning' | 'danger';
const toneClass: Record<Tone, string> = {
  default: 'bg-default text-foreground',
  accent: 'bg-accent/15 text-accent',
  success: 'bg-success/15 text-foreground',
  warning: 'bg-warning/15 text-foreground',
  danger: 'bg-danger/15 text-foreground'
};

export function NBadge({
  color = 'default',
  className,
  size,
  variant: _variant,
  ...props
}: HTMLAttributes<HTMLElement> & { color?: Tone; size?: string; variant?: string }) {
  return (
    <NText
      {...(props as ComponentProps<typeof NText>)}
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 font-medium',
        size === 'sm' ? 'text-xs' : 'text-sm',
        toneClass[color],
        className
      )}
    />
  );
}

export const NChip = NBadge;
export const NKbd = ({ children, className }: { children?: ReactNode; className?: string }) => (
  <NText tag="kbd" className={cn('rounded border border-default bg-default px-1.5 py-0.5 font-mono text-xs', className)}>{children}</NText>
);

export const AlertTypes = { DEFAULT: 'default', INFO: 'accent', SUCCESS: 'success', WARNING: 'warning', ERROR: 'danger', DANGER: 'danger' } as const;

export function NAlert({
  type = 'default',
  title,
  message,
  children,
  className,
  icon,
  actions,
  onClose,
  titleClassName
}: {
  titleClassName?: string;
  type?: Tone;
  title?: ReactNode;
  message?: ReactNode;
  children?: ReactNode;
  className?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  onClose?: () => void;
}) {
  return (
    <NView
      role={type === 'danger' ? 'alert' : 'status'}
      className={cn('flex flex-row items-start gap-2 rounded-lg p-3 text-sm', toneClass[type], className)}
    >
      {icon}
      <NView tag="div" className="min-w-0 flex-1">
        {title && <NView tag="div" className={cn('font-semibold', titleClassName)}>{title}</NView>}
        {message}
        {children}
      </NView>
      {actions}
      {onClose && (
        <NButton isOutline onClick={onClose} aria-label="Dismiss message">
          ×
        </NButton>
      )}
    </NView>
  );
}

export function NLoading({
  children,
  ...props
}: {
  children?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
  label?: string;
}) {
  return (
    <EngineLoading
      {...props}
      size={props.size === 'sm' ? 'small' : props.size === 'lg' ? 'large' : 'medium'}
      label={props.label ?? (typeof children === 'string' ? children : undefined)}
    />
  );
}

export function NLink({
  children,
  className,
  onPress,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { onPress?: AnchorHTMLAttributes<HTMLAnchorElement>['onClick'] }) {
  return (
    <EngineLink
      {...({ ...props, onClick: onPress ?? props.onClick } as ComponentProps<typeof EngineLink>)}
      className={cn('text-accent hover:underline', className)}
    >
      {children}
    </EngineLink>
  );
}

export function NProgress({
  value,
  label,
  showLabel,
  className
}: {
  value: number;
  label?: string;
  showLabel?: boolean;
  color?: Tone;
  size?: string;
  className?: string;
}) {
  return (
    <NView tag="div" className={className}>
      {showLabel && (
        <NView tag="div" className="text-sm">
          {label} {Math.round(value)}%
        </NView>
      )}
      <EngineProgress className="w-full accent-accent" max={100} value={value} aria-label={label ?? 'Progress'} />
    </NView>
  );
}

export function NTooltip({ message, children }: { message: ReactNode; children: ReactNode; placement?: string }) {
  const id = useId();
  return (
    <NText tag="span" className="group/tooltip relative inline-flex" aria-describedby={id}>
      <NText tag="span"
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded bg-overlay px-2 py-1 text-xs text-foreground shadow-md group-hover/tooltip:block group-focus-within/tooltip:block"
      >
        {message}
      </NText>
      {children}
    </NText>
  );
}

export function NEmptyState({
  title,
  message,
  icon,
  actions,
  className,
  children,
  iconClassName,
  titleClassName,
  messageClassName
}: {
  title: ReactNode;
  titleClassName?: string;
  messageClassName?: string;
  message?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
  iconClassName?: string;
}) {
  return (
    <NView className={cn('flex flex-col items-center gap-2 p-4 text-center', className)}>
      {icon && <NView tag="div" className={iconClassName}>{icon}</NView>}
      <NText className={cn('font-semibold', titleClassName)}>{title}</NText>
      {message && <NView tag="div" className={messageClassName}>{message}</NView>}
      <NView tag="div">
        {actions}
        {children}
      </NView>
    </NView>
  );
}

export function NToggleButton({
  isSelected,
  disabled,
  className,
  onChange,
  children,
  variant,
  size: _size,
  isIconOnly: _isIconOnly,
  ...props
}: {
  isSelected?: boolean;
  disabled?: boolean;
  className?: string;
  onChange?: (value: boolean) => void;
  children: ReactNode;
  variant?: string;
  size?: string;
  isIconOnly?: boolean;
  'aria-label'?: string;
  title?: string;
}) {
  return (
    <NPress
      {...props}
      aria-pressed={isSelected}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-1 rounded-md px-2 py-1 focus-visible:outline-2 focus-visible:outline-focus disabled:opacity-50',
        isSelected ? 'bg-accent text-accent-foreground' : variant === 'ghost' ? 'hover:bg-default' : 'bg-default',
        className
      )}
      onPress={() => onChange?.(!isSelected)}
    >
      {children}
    </NPress>
  );
}

export function NButtonGroup<T>({
  items,
  selected,
  value,
  onChange,
  getKey,
  renderItem,
  ariaLabel,
  className,
  buttonClassName,
  disabled
}: {
  items: readonly T[];
  selected?: T;
  value?: T;
  onChange: (item: T) => void;
  getKey?: (item: T, index: number) => Key;
  renderItem?: (item: T, index: number) => ReactNode;
  ariaLabel?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  size?: string;
}) {
  return (
    <NView role="group" aria-label={ariaLabel} className={cn('flex flex-row gap-1', className)}>
      {items.map((item, index) => (
        <NToggleButton
          key={getKey?.(item, index) ?? String(item)}
          className={buttonClassName}
          isSelected={Object.is(item, selected ?? value)}
          disabled={disabled}
          onChange={() => onChange(item)}
        >
          {renderItem?.(item, index) ?? String(item)}
        </NToggleButton>
      ))}
    </NView>
  );
}

export const DialogSize = { SM: 'sm', MD: 'md', LG: 'lg', XL: 'xl', FULL: 'full' } as const;
type DialogSize = (typeof DialogSize)[keyof typeof DialogSize];

export function NDialog({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  className,
  contentClassName,
  headerClassName,
  titleClassName
}: {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  size?: DialogSize;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
}) {
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (isOpen && dialog && !dialog.open) dialog.showModal();
    else if (!isOpen && dialog?.open) dialog.close();
  }, [isOpen]);
  return (
    <NView tag="dialog"
      ref={ref}
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={cn(
        'm-auto max-h-[90dvh] w-[calc(100%-2rem)] rounded-xl border border-default bg-overlay text-foreground shadow-xl backdrop:bg-black/50',
        { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl', full: '' }[size],
        className
      )}
    >
      {isOpen && (
        <>
          <NView tag="header" className={cn('flex items-center justify-between gap-3 border-b border-default p-4', headerClassName)}>
            <NText tag="h2" id={id} className={cn('font-semibold', titleClassName)}>
              {title}
            </NText>
            <NButton isOutline aria-label="Close dialog" onClick={onClose}>
              ×
            </NButton>
          </NView>
          <NView tag="div" className={cn('p-4', contentClassName)}>{children}</NView>
        </>
      )}
    </NView>
  );
}

export function NConfirmAlert({
  isOpen,
  onClose,
  onResult,
  title = 'Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}: {
  isOpen: boolean;
  onClose: () => void;
  onResult: (value: boolean) => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}) {
  const answer = (value: boolean) => {
    onResult(value);
    onClose();
  };
  return (
    <NDialog isOpen={isOpen} onClose={() => answer(false)} title={title} size="sm">
      <NText tag="p">{message}</NText>
      <NView tag="div" className="mt-4 flex justify-end gap-2">
        <NButton isOutline onClick={() => answer(false)}>
          {cancelText}
        </NButton>
        <NButton onClick={() => answer(true)}>{confirmText}</NButton>
      </NView>
    </NDialog>
  );
}
