import React, { ReactNode, memo } from "react";
import { EmptyState } from "@heroui/react";
import { cn } from "../lib/utils";

export interface NEmptyStateProps {
  title: ReactNode;
  message?: ReactNode;
  /** Shown above the title — an icon or a small illustration. */
  icon?: ReactNode;
  /** Buttons or links under the message. */
  actions?: ReactNode;
  className?: string;
  iconClassName?: string;
  titleClassName?: string;
  messageClassName?: string;
  actionsClassName?: string;
  children?: ReactNode;
}

const NEmptyStateComponent: React.FC<NEmptyStateProps> = memo(
  ({
    title,
    message,
    icon,
    actions,
    className = "",
    iconClassName = "",
    titleClassName = "",
    messageClassName = "",
    actionsClassName = "",
    children,
  }) => {
    return (
      <EmptyState
        className={cn(
          "nyn-empty-state flex flex-col items-center justify-center gap-2 p-8 text-center",
          className,
        )}
      >
        {icon && (
          <span className={cn("nyn-empty-state-icon mb-1 text-muted", iconClassName)}>{icon}</span>
        )}
        <p
          className={cn(
            "nyn-empty-state-title text-sm font-semibold text-foreground",
            titleClassName,
          )}
        >
          {title}
        </p>
        {message && (
          <p
            className={cn("nyn-empty-state-message max-w-sm text-sm text-muted", messageClassName)}
          >
            {message}
          </p>
        )}
        {children}
        {actions && (
          <div
            className={cn(
              "nyn-empty-state-actions mt-3 flex flex-wrap items-center justify-center gap-2",
              actionsClassName,
            )}
          >
            {actions}
          </div>
        )}
      </EmptyState>
    );
  },
);

NEmptyStateComponent.displayName = "NEmptyState";

export const NEmptyState = NEmptyStateComponent;
