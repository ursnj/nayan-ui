import React, { ReactNode, memo } from "react";
import { ScrollShadow } from "@heroui/react";
import { cn } from "../lib/utils";

export interface NScrollShadowProps {
  children: ReactNode;
  orientation?: "horizontal" | "vertical";
  /** Shadow depth in pixels. */
  size?: number;
  /** How close to the edge counts as scrolled to it. */
  offset?: number;
  hideScrollBar?: boolean;
  isEnabled?: boolean;
  className?: string;
}

const NScrollShadowComponent: React.FC<NScrollShadowProps> = memo(
  ({
    children,
    orientation = "vertical",
    size,
    offset,
    hideScrollBar = false,
    isEnabled = true,
    className = "",
  }) => {
    return (
      <ScrollShadow
        orientation={orientation}
        size={size}
        offset={offset}
        hideScrollBar={hideScrollBar}
        isEnabled={isEnabled}
        className={cn("nyn-scroll-shadow", className)}
      >
        {children}
      </ScrollShadow>
    );
  },
);

NScrollShadowComponent.displayName = "NScrollShadow";

export const NScrollShadow = NScrollShadowComponent;
