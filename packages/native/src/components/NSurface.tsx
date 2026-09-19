import React from "react";
import { Surface, type SurfaceRootProps, cn } from "heroui-native";

export interface NSurfaceProps extends SurfaceRootProps {
  children: React.ReactNode;
}

export const NSurface = React.memo<NSurfaceProps>(({ children, className, ...props }) => {
  return (
    <Surface className={cn(className)} {...props}>
      {children}
    </Surface>
  );
});

NSurface.displayName = "NSurface";
