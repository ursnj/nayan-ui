import {
  cloneElement,
  isValidElement,
  type ComponentType,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState
} from 'react';
import { ContextBridge, useSurfaceContextValues } from './contextBridge';
import { NButton } from './NButton';
import { NPage } from './NPage';
import { NPress } from './NPress';
import { NText } from './NText';
import { NView } from './NView';
import { PresentationHost, usePresentationSize } from './PresentationHost';
import { PageContext } from './theme/contexts';
import { ComponentThemeContext } from './ThemeContext';

export interface OverlayProps {
  children?: ReactNode;
  trigger?: ReactNode;
  title?: string;
  description?: string;
  isOpen?: boolean;
  isDefaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  contentClassName?: string;
  /** With content fitting, the first snap point limits the maximum sheet height. */
  snapPoints?: (string | number)[];
  /** Sheets fit Rust-measured content by default; false retains a fixed snap-point height. */
  fitContent?: boolean;
  maxWidth?: number;
  isSwipeable?: boolean;
  /** Hide the header button while retaining backdrop and swipe dismissal. */
  showCloseButton?: boolean;
  /** Hide the content's scroll indicator while preserving scroll gestures. */
  showsVerticalScrollIndicator?: boolean;
  /** Use the theme's translucent presentation background inside the panel. */
  blurred?: boolean;
  /** Override the theme's platform backdrop for this presentation. */
  presentationBackground?: ComponentType;
}

/** OS modal ownership is a platform adapter; its content uses the shared Rust components. */
function Presentation({
  children,
  isOpen: controlledOpen,
  isDefaultOpen = false,
  trigger,
  onOpenChange,
  title,
  description,
  className = '',
  contentClassName = '',
  titleClassName = '',
  descriptionClassName = '',
  sheet = false,
  maxWidth,
  isSwipeable = true,
  showCloseButton = true,
  showsVerticalScrollIndicator,
  blurred = false,
  presentationBackground,
  fitContent = true,
  snapPoints
}: OverlayProps & { sheet?: boolean }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(isDefaultOpen);
  const isOpen = controlledOpen ?? uncontrolledOpen;
  const changeOpen = useCallback(
    (open: boolean) => {
      if (controlledOpen === undefined) setUncontrolledOpen(open);
      onOpenChange?.(open);
    },
    [controlledOpen, onOpenChange]
  );
  const page = useContext(PageContext);
  const id = useId();
  const theme = useContext(ComponentThemeContext);
  const contextValues = useSurfaceContextValues(theme?.contexts);
  const mode = theme?.resolvedTheme ?? (theme?.theme === 'dark' ? 'dark' : 'light');
  const colors = { ...theme?.colors, ...theme?.themes?.[mode] };
  const palette = {
    border: colors.border ?? 'transparent',
    sheetSurface: sheet ? (colors.background ?? (mode === 'dark' ? '#18181b' : '#fff')) : (colors.surface ?? '#fff')
  };
  const Background = presentationBackground ?? theme?.presentationBackground;
  const surfaceBackground = sheet && blurred && Background ? 'transparent' : palette.sheetSurface;
  const window = usePresentationSize();

  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const onContentSizeChange = useCallback((_width: number, height: number) => {
    if (!Number.isFinite(height) || height <= 0) return;
    setContentHeight((previous) => (previous === Math.ceil(height) ? previous : Math.ceil(height)));
  }, []);
  useEffect(() => {
    if (!isOpen) setContentHeight(null);
  }, [isOpen]);
  const bottomInset = sheet ? Math.max(16, theme?.presentationInsets?.bottom ?? 0) : 0;
  const dismissible = controlledOpen === undefined || typeof onOpenChange === 'function';
  const swipeable = sheet && isSwipeable && dismissible;
  const chromeHeight = sheet ? (swipeable ? 33 : 17) + bottomInset : 2;
  const screenLimit = Math.max(1, Math.min(window.height * 0.9, window.height - (theme?.presentationInsets?.top ?? 0) - 16));
  const requested = snapPoints?.[0];
  const requestedHeight =
    typeof requested === 'number'
      ? requested
      : typeof requested === 'string' && /^\d+(?:\.\d+)?%$/.test(requested.trim())
        ? (window.height * parseFloat(requested)) / 100
        : undefined;
  const sheetLimit =
    requestedHeight != null && Number.isFinite(requestedHeight) && requestedHeight > 0 ? Math.min(screenLimit, requestedHeight) : screenLimit;
  const height = sheet
    ? Math.min(sheetLimit, fitContent ? (contentHeight == null ? sheetLimit : contentHeight + chromeHeight) : sheetLimit)
    : Math.min(window.height * 0.7, contentHeight === null ? 220 : contentHeight + chromeHeight);

  const dragAreaHeight = Math.min(height, title || description ? 112 : 32);

  const element = useMemo(
    () =>
      isOpen ? (
        <ContextBridge values={contextValues}>
          <ComponentThemeContext.Provider value={theme}>
            <PresentationHost
              sheet={sheet}
              height={height}
              width={Math.min(sheet ? window.width : window.width - 32, maxWidth ?? (sheet ? 640 : 425))}
              bottomInset={bottomInset}
              handleColor={colors.muted}
              dismissible={dismissible}
              swipeable={swipeable}
              dragAreaHeight={dragAreaHeight}
              ready={contentHeight !== null || (sheet && !fitContent)}
              border={palette.border}
              background={surfaceBackground}
              onClose={() => changeOpen(false)}
              backdrop={(!sheet || blurred) && Background ? <Background /> : undefined}>
              <NPage
                safeArea={sheet}
                showsVerticalScrollIndicator={showsVerticalScrollIndicator}
                keyboard={!sheet}
                background={sheet ? surfaceBackground : undefined}
                onContentSizeChange={onContentSizeChange}
                className={`${sheet ? 'gap-0 px-5 pt-1 pb-4' : 'gap-0 px-4 py-3'} ${className}`}>
                {(!sheet || title || description) && (
                  <NView className={`nayan-presentation-header w-full flex-row items-center justify-between ${sheet ? 'mb-4 gap-3' : 'mb-3'}`}>
                    <NView className="flex-1">
                      {title && <NText className={`text-lg font-semibold ${titleClassName}`}>{title}</NText>}
                      {description && <NText className={`text-muted mt-1 text-sm ${descriptionClassName}`}>{description}</NText>}
                    </NView>
                    {dismissible && showCloseButton && (
                      <NPress
                        onPress={() => changeOpen(false)}
                        accessibilityLabel="Close"
                        className={
                          sheet ? 'bg-default h-11 w-11 items-center justify-center rounded-full' : 'ml-2 h-9 w-9 items-center justify-center'
                        }>
                        <NText className={sheet ? 'text-xl' : undefined}>×</NText>
                      </NPress>
                    )}
                  </NView>
                )}
                <NView className={`w-full gap-0 ${contentClassName}`}>{children}</NView>
              </NPage>
            </PresentationHost>
          </ComponentThemeContext.Provider>
        </ContextBridge>
      ) : null,
    [
      isOpen,
      changeOpen,
      sheet,
      height,
      window.width,
      maxWidth,
      bottomInset,
      dismissible,
      showCloseButton,
      showsVerticalScrollIndicator,
      blurred,
      surfaceBackground,
      swipeable,
      dragAreaHeight,
      fitContent,
      contentHeight,
      Background,
      palette.border,
      colors.muted,
      className,
      title,
      description,
      titleClassName,
      descriptionClassName,
      contentClassName,
      children,
      onContentSizeChange,
      theme,
      contextValues
    ]
  );

  useEffect(() => {
    if (!page) return;
    page.portal(id, element);
    return () => page.portal(id, null);
  }, [page, id, element]);

  // A controlled presentation can also be a native screen sibling.
  const activator = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<{ onPress?: (...args: unknown[]) => void }>, {
        onPress: (...args: unknown[]) => {
          (trigger.props as { onPress?: (...args: unknown[]) => void }).onPress?.(...args);
          changeOpen(true);
        }
      })
    : trigger;
  return (
    <>
      {activator}
      {page ? null : element}
    </>
  );
}

export const NSheet = (props: OverlayProps) => <Presentation {...props} sheet />;
export const NDialog = (props: OverlayProps) => <Presentation {...props} />;

export function NConfirm({
  children,
  trigger,
  title,
  description,
  isOpen,
  isDefaultOpen,
  onOpenChange,
  onResult,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  className = '',
  titleClassName,
  descriptionClassName,
  confirmClassName = '',
  cancelClassName = ''
}: OverlayProps & {
  onResult: (result: boolean) => void;
  confirmText?: string;
  cancelText?: string;
  confirmClassName?: string;
  cancelClassName?: string;
}) {
  const [open, setOpen] = useState(!!isDefaultOpen);
  const changeOpen = (next: boolean) => {
    if (isOpen === undefined) setOpen(next);
    onOpenChange?.(next);
  };
  const result = (value: boolean) => {
    changeOpen(false);
    onResult(value);
  };

  return (
    <NDialog
      title={title}
      description={description}
      isOpen={isOpen ?? open}
      onOpenChange={changeOpen}
      trigger={trigger ?? children}
      className={className}
      titleClassName={titleClassName}
      descriptionClassName={descriptionClassName}>
      <NView className="mt-3 w-full flex-row justify-end gap-3">
        <NButton variant="outline" onPress={() => result(false)} className={cancelClassName}>
          {cancelText}
        </NButton>
        <NButton onPress={() => result(true)} className={confirmClassName}>
          {confirmText}
        </NButton>
      </NView>
    </NDialog>
  );
}
