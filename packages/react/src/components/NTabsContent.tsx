import { ReactNode, memo } from "react";
import { Tabs } from "@heroui/react";
import { cn } from "../lib/utils";

export interface NTabsContentProps {
  item: string;
  className?: string;
  children: ReactNode;
}

const NTabsContentComponent = memo(({ item, className = "", children }: NTabsContentProps) => (
  <Tabs.Panel id={item} className={cn("nyn-tab-content", className)}>
    {children}
  </Tabs.Panel>
));

NTabsContentComponent.displayName = "NTabsContent";

export const NTabsContent = NTabsContentComponent;
