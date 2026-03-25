import React, { useEffect } from 'react';
import { useToast, type ToastManager, type ToastShowConfig } from 'heroui-native';

export interface NToastConfig {
  config?: unknown;
  successIcon?: React.ComponentType<any> | React.ReactElement;
  errorIcon?: React.ComponentType<any> | React.ReactElement;
  infoIcon?: React.ComponentType<any> | React.ReactElement;
  warningIcon?: React.ComponentType<any> | React.ReactElement;
}

export interface NToastShowOptions {
  type?: 'success' | 'error' | 'info' | 'warning';
  message: string;
  title?: string;
  icon?: React.ComponentType<any> | React.ReactElement;
  id?: string;
  position?: 'top' | 'bottom';
  duration?: number | 'persistent';
  autoHide?: boolean;
  actionLabel?: string;
  onActionPress?: ToastShowConfig['onActionPress'];
  onShow?: () => void;
  onHide?: () => void;
}

export interface NToastMethods {
  show: (options: NToastShowOptions) => void;
  hide: (ids?: string | string[] | 'all') => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const NToastComponent = React.memo<NToastConfig>(({ config, successIcon, errorIcon, infoIcon, warningIcon }) => {
  const { toast } = useToast();

  useEffect(() => {
    toastManager = toast;
    defaultShowConfig = typeof config === 'object' && config ? (config as Partial<ToastShowConfig>) : {};
    defaultIcons = { successIcon, errorIcon, infoIcon, warningIcon };

    return () => {
      if (toastManager === toast) {
        toastManager = null;
      }
    };
  }, [toast, successIcon, errorIcon, infoIcon, warningIcon]);

  return null;
});

NToastComponent.displayName = 'NToast';

let toastManager: ToastManager | null = null;
let defaultShowConfig: Partial<ToastShowConfig> = {};
let defaultIcons: Partial<NToastConfig> = {};

const resolveIcon = (icon?: React.ComponentType<any> | React.ReactElement): React.ReactNode => {
  if (!icon) return undefined;
  if (React.isValidElement(icon)) return icon;
  const IconComponent = icon;
  return <IconComponent size={20} />;
};

const toVariant = (type: NonNullable<NToastShowOptions['type']>): ToastShowConfig['variant'] => {
  switch (type) {
    case 'success':
      return 'success';
    case 'error':
      return 'danger';
    case 'warning':
      return 'warning';
    case 'info':
    default:
      return 'accent';
  }
};

const toastMethods: NToastMethods = {
  show: ({ message, title, type = 'success', icon, position = 'bottom', duration, autoHide, id, actionLabel, onActionPress, onShow, onHide }: NToastShowOptions) => {
    if (!toastManager) return;

    const defaultIcon = type === 'success' ? defaultIcons.successIcon : type === 'error' ? defaultIcons.errorIcon : type === 'warning' ? defaultIcons.warningIcon : defaultIcons.infoIcon;
    const resolvedDuration = autoHide === false ? 'persistent' : duration;

    toastManager.show({
      ...defaultShowConfig,
      id,
      placement: position,
      variant: toVariant(type),
      label: title ?? message,
      description: title ? message : undefined,
      icon: resolveIcon(icon ?? defaultIcon),
      duration: resolvedDuration,
      actionLabel,
      onActionPress,
      onShow,
      onHide
    });
  },

  hide: ids => {
    if (!toastManager) return;
    toastManager.hide(ids);
  },

  success: (message: string, title?: string) => {
    toastMethods.show({ type: 'success', message, title });
  },

  error: (message: string, title?: string) => {
    toastMethods.show({ type: 'error', message, title });
  },

  info: (message: string, title?: string) => {
    toastMethods.show({ type: 'info', message, title });
  },

  warning: (message: string, title?: string) => {
    toastMethods.show({ type: 'warning', message, title });
  }
};

export const NToast = Object.assign(NToastComponent, toastMethods);
