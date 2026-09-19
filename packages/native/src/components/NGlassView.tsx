import React from "react";
import { GlassView, type GlassViewProps, cn } from "heroui-native";

export interface NGlassViewProps extends GlassViewProps {
  children?: React.ReactNode;
}

export const NGlassView = React.memo<NGlassViewProps>(({ children, className, ...props }) => {
  return (
    <GlassView className={cn(className)} {...props}>
      {children}
    </GlassView>
  );
});

NGlassView.displayName = "NGlassView";
