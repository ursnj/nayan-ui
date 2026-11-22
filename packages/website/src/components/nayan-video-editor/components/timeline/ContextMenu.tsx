import { NView, NText } from 'nayan-ui/components';
import { cn } from "@/components/ui";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface MenuItem {
  label: string;
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

export const ContextMenu = ({ x, y, items, onClose }: ContextMenuProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    setPosition({
      left: x + rect.width > window.innerWidth ? Math.max(4, x - rect.width) : x,
      top: y + rect.height > window.innerHeight ? Math.max(4, y - rect.height) : y,
    });
  }, [x, y]);

  useEffect(() => {
    const dismiss = (event: Event) => {
      if (ref.current?.contains(event.target as Node)) return;
      onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("pointerdown", dismiss, true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", onClose);
    return () => {
      window.removeEventListener("pointerdown", dismiss, true);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onClose);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <NView tag="div"
      ref={ref}
      role="menu"
      style={{ left: position.left, top: position.top }}
      className="animate-in animate-editor-in fixed z-[100] min-w-52 rounded-lg border border-border bg-overlay p-1 elevate-lg [box-shadow:var(--elevation-lg)]"
    >
      {items.map((item, index) => (
        <NView tag="div" key={`${item.label}-${index}`}>
          {item.separatorBefore && <NView tag="div" className="my-1 h-px bg-border" />}
          <NView tag="button"
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              item.onSelect();
              onClose();
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors",
              item.disabled && "cursor-not-allowed opacity-40",
              !item.disabled &&
                item.danger &&
                "text-danger hover:bg-danger hover:text-danger-foreground",
              !item.disabled && !item.danger && "text-foreground hover:bg-default",
            )}
          >
            {item.icon && <NText tag="span" className="shrink-0 opacity-70">{item.icon}</NText>}
            <NText tag="span" className="flex-1">{item.label}</NText>
          </NView>
        </NView>
      ))}
    </NView>,
    document.body,
  );
};
