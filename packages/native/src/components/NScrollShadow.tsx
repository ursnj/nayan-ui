import React from "react";
import { ScrollShadow, type ScrollShadowProps, cn } from "heroui-native";

export interface NScrollShadowProps extends Omit<ScrollShadowProps, "children"> {
  /** A single scrollable child — a `ScrollView`, `FlatList` or similar. */
  children: React.ReactElement;
  /**
   * The gradient component the shadows are drawn with, e.g. `LinearGradient`
   * from `expo-linear-gradient`. Required: HeroUI Native draws nothing without
   * it, and the library does not depend on a gradient package itself so the app
   * can pick its own.
   */
  LinearGradientComponent: ScrollShadowProps["LinearGradientComponent"];
}

export const NScrollShadow = React.memo<NScrollShadowProps>(({ children, className, ...props }) => {
  return (
    <ScrollShadow className={cn(className)} {...props}>
      {children}
    </ScrollShadow>
  );
});

NScrollShadow.displayName = "NScrollShadow";
