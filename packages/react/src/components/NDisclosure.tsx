import React, { ReactNode, memo } from "react";
import { Disclosure } from "@heroui/react";
import { cn } from "../lib/utils";

export interface NDisclosureProps {
  title: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  indicatorClassName?: string;
}

/** One collapsible section. `NAccordion` is a list of these with a shared open/close rule. */
const NDisclosureComponent: React.FC<NDisclosureProps> = memo(
  ({
    title,
    children,
    defaultExpanded = false,
    expanded,
    onExpandedChange,
    disabled = false,
    className = "",
    triggerClassName = "",
    contentClassName = "",
    indicatorClassName = "",
  }) => {
    return (
      <Disclosure
        defaultExpanded={defaultExpanded}
        isExpanded={expanded}
        onExpandedChange={onExpandedChange}
        isDisabled={disabled}
        className={cn("nyn-disclosure w-full", className)}
      >
        <Disclosure.Heading>
          {/* HeroUI styles .disclosure__trigger as inline-block, so the title and the
              indicator stack unless the trigger is made a row. */}
          <Disclosure.Trigger
            className={cn("flex w-full items-center justify-between gap-3", triggerClassName)}
          >
            {title}
            <Disclosure.Indicator className={cn(indicatorClassName)} />
          </Disclosure.Trigger>
        </Disclosure.Heading>
        <Disclosure.Content className={cn(contentClassName)}>
          <Disclosure.Body>{children}</Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
    );
  },
);

NDisclosureComponent.displayName = "NDisclosure";

export const NDisclosure = NDisclosureComponent;
