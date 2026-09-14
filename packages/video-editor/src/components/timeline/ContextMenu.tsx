import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

export interface MenuItem {
  label: string;
  shortcut?: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
  onSelect: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

/**
 * Right-click menu for the timeline.
 *
 * Positioned in viewport coordinates and flipped when it would overflow, so it
 * stays usable for clips near the bottom or right edge of the window.
 */
export const ContextMenu = ({ x, y, items, onClose }: ContextMenuProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    setPosition({
      left: x + rect.width > window.innerWidth ? Math.max(4, x - rect.width) : x,
      top: y + rect.height > window.innerHeight ? Math.max(4, y - rect.height) : y
    });
  }, [x, y]);

  useEffect(() => {
    const dismiss = (event: Event) => {
      if (ref.current?.contains(event.target as Node)) return;
      onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    // `pointerdown` rather than `click` so the menu closes before the next
    // interaction lands on whatever is underneath it.
    window.addEventListener('pointerdown', dismiss, true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('blur', onClose);
    return () => {
      window.removeEventListener('pointerdown', dismiss, true);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', onClose);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      style={{ left: position.left, top: position.top }}
      className="animate-in fixed z-[100] min-w-52 rounded-lg border border-border bg-overlay p-1 elevate-lg">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`}>
          {item.separatorBefore && <div className="my-1 h-px bg-border" />}
          <button
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              item.onSelect();
              onClose();
            }}
            className={cn(
              'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors',
              item.disabled && 'cursor-not-allowed opacity-40',
              !item.disabled && item.danger && 'text-danger hover:bg-danger hover:text-danger-foreground',
              !item.disabled && !item.danger && 'text-foreground hover:bg-default'
            )}>
            {item.icon && <span className="shrink-0 opacity-70">{item.icon}</span>}
            <span className="flex-1">{item.label}</span>
            {item.shortcut && <span className="shrink-0 font-mono text-[10px] text-muted">{item.shortcut}</span>}
          </button>
        </div>
      ))}
    </div>
  );
};
