import React from "react";
import { ThemeBackground, type ThemeBackgroundProps, cn } from "heroui-native";

export interface NThemeBackgroundProps extends ThemeBackgroundProps {
  children?: React.ReactNode;
}

export const NThemeBackground = React.memo<NThemeBackgroundProps>(
  ({ children, className, ...props }) => {
    return (
      <ThemeBackground className={cn("flex-1", className)} {...props}>
        {children}
      </ThemeBackground>
    );
  },
);

NThemeBackground.displayName = "NThemeBackground";
