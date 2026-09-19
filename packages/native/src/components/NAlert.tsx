import React from "react";
import { Alert, type AlertRootProps, cn, useThemeColor } from "heroui-native";
import { CloseIcon } from "../helpers/icons";
import { NPress } from "./NPress";

export interface NAlertProps extends AlertRootProps {
  title?: string;
  description?: string;
  /** Alias of `description`, as the React package names it. */
  message?: string;
  onClose?: () => void;
  titleClassName?: string;
  descriptionClassName?: string;
}

export const NAlert = React.memo<NAlertProps>(
  ({
    title,
    description,
    message,
    onClose,
    className,
    titleClassName,
    descriptionClassName,
    ...props
  }) => {
    const body = description ?? message;
    const mutedColor = useThemeColor("muted");

    return (
      <Alert className={cn("w-full bg-surface px-4 py-3", className)} {...props}>
        <Alert.Indicator />
        <Alert.Content>
          {title && (
            <Alert.Title className={cn("font-medium mb-1", titleClassName)}>{title}</Alert.Title>
          )}
          {body && (
            <Alert.Description className={cn("text-sm", descriptionClassName)}>
              {body}
            </Alert.Description>
          )}
        </Alert.Content>
        {onClose && (
          <NPress
            onPress={onClose}
            hitSlop={8}
            accessibilityLabel="Close"
            className="active:opacity-60"
          >
            <CloseIcon size={18} color={mutedColor} />
          </NPress>
        )}
      </Alert>
    );
  },
);

NAlert.displayName = "NAlert";
