import React from 'react';
import { View } from 'react-native';
import { useThemeColor, useToast } from 'heroui-native';
import { AlertCircleIcon, CheckmarkIcon, InformationCircleIcon } from '../helpers/icons';

export interface NToastShowOptions {
  type?: 'success' | 'error' | 'info' | 'warning';
  message: string;
  title?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onActionPress?: () => void;
}

export interface NToastMethods {
  show: (options: NToastShowOptions) => void;
  success: (message: string, title?: string, icon?: React.ReactNode) => void;
  error: (message: string, title?: string, icon?: React.ReactNode) => void;
  info: (message: string, title?: string, icon?: React.ReactNode) => void;
  warning: (message: string, title?: string, icon?: React.ReactNode) => void;
}

const VARIANT_MAP: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  success: 'success',
  error: 'danger',
  info: 'default',
  warning: 'warning'
};

export function useNToast(): NToastMethods {
  const { toast } = useToast();
  const [successColor, dangerColor, foregroundColor, warningColor] = useThemeColor(['success', 'danger', 'foreground', 'warning']);

  const wrapIcon = (icon: React.ReactNode): React.ReactNode => <View style={{ marginTop: 4 }}>{icon}</View>;

  const getIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'success':
        return wrapIcon(<CheckmarkIcon size={18} color={successColor} />);
      case 'error':
        return wrapIcon(<AlertCircleIcon size={18} color={dangerColor} />);
      case 'info':
        return wrapIcon(<InformationCircleIcon size={18} color={foregroundColor} />);
      case 'warning':
        return wrapIcon(<AlertCircleIcon size={18} color={warningColor} />);
      default:
        return wrapIcon(<CheckmarkIcon size={18} color={successColor} />);
    }
  };

  return {
    show: ({ message, title, type = 'success', icon, actionLabel, onActionPress }: NToastShowOptions) => {
      toast.show({
        label: title || '',
        description: message,
        variant: VARIANT_MAP[type] ?? 'default',
        icon: icon ?? getIcon(type),
        actionLabel,
        onActionPress: onActionPress
          ? ({ hide }) => {
              onActionPress();
              hide('all');
            }
          : undefined
      });
    },
    success: (message: string, title?: string, icon?: React.ReactNode) => {
      toast.show({ label: title || 'Success', description: message, variant: 'success', icon: icon ?? getIcon('success') });
    },
    error: (message: string, title?: string, icon?: React.ReactNode) => {
      toast.show({ label: title || 'Error', description: message, variant: 'danger', icon: icon ?? getIcon('error') });
    },
    info: (message: string, title?: string, icon?: React.ReactNode) => {
      toast.show({ label: title || 'Info', description: message, variant: 'default', icon: icon ?? getIcon('info') });
    },
    warning: (message: string, title?: string, icon?: React.ReactNode) => {
      toast.show({ label: title || 'Warning', description: message, variant: 'warning', icon: icon ?? getIcon('warning') });
    }
  };
}
