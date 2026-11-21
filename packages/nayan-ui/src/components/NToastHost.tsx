import { useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { ComponentsRoot } from './ComponentsRoot';
import { NPlatformView } from './NPlatformView';
import { NToastContent } from './NToastContent';
import { announcePlatformMessage, usePlatformOverlayEnvironment, ViewHost } from './PlatformHost';
import { SafeAreaInsetsContext } from './safeAreaContext';
import { useToastHostOwnership } from './ThemeServices';
import { toastStore } from './toastService';

export interface NToastHostProps {
  /** Absolute top offset. Defaults to the top safe area plus 12 points. */
  top?: number;
  /** Centered width limit on tablets and desktop; defaults to 480 points. */
  maxWidth?: number;
}
let announced: number | undefined;

/** One toast host for all platforms; modal adapters also mount it in their own window. */
export function NToastHost({ top, maxWidth = 480 }: NToastHostProps) {
  useToastHostOwnership();
  const { toast } = useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot, toastStore.getServerSnapshot);
  const [height, setHeight] = useState(88);
  const viewport = usePlatformOverlayEnvironment(toastStore.refresh);
  const insets = useContext(SafeAreaInsetsContext);
  useEffect(() => {
    if (toast && announced !== toast.id) {
      announced = toast.id;
      announcePlatformMessage([toast.title, toast.message].filter(Boolean).join('. '));
    }
  }, [toast]);
  if (!toast) return null;
  const limit = Number.isFinite(maxWidth) && maxWidth > 0 ? maxWidth : 480;
  const inset = Math.max(8, (viewport.width - limit) / 2);
  const visibleHeight = Math.min(height, viewport.height > 0 ? viewport.height * 0.4 : height);
  const style = { position: viewport.position, top: top ?? (insets?.top ?? 0) + 12, left: inset, right: inset, height: visibleHeight, zIndex: 10000 };
  return (
    <NPlatformView style={style}>
      <ViewHost
        className="absolute z-[10000]"
        style={style}
        {...(viewport.position === 'fixed'
          ? {
              role: 'status',
              'aria-label': [toast.title, toast.message].filter(Boolean).join('. '),
              'aria-live': toast.type === 'error' ? ('assertive' as const) : ('polite' as const),
              'aria-atomic': true
            }
          : {})}
      >
        <ComponentsRoot
          background="transparent"
          style={{ flex: 1, minHeight: 0 }}
          onContentSizeChange={(_width, height) => setHeight(Math.max(64, Math.ceil(height)))}
        >
          <NToastContent toast={toast} />
        </ComponentsRoot>
      </ViewHost>
    </NPlatformView>
  );
}
