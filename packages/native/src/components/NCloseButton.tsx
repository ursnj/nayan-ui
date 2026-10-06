import React from "react";
import { CloseButton, type CloseButtonProps, cn } from "heroui-native";

export interface NCloseButtonProps extends Omit<CloseButtonProps, "children"> {
  /** Required: the button has no visible text to name it. */
  accessibilityLabel?: string;
}

export const NCloseButton = React.memo<NCloseButtonProps>(
  ({ className, accessibilityLabel = "Close", feedbackVariant: _fv, animation: _anim, ...props }) => {
    return (
      <CloseButton className={cn(className)} accessibilityLabel={accessibilityLabel} feedbackVariant="none" {...(props as any)} />
    );
  },
);

NCloseButton.displayName = "NCloseButton";
