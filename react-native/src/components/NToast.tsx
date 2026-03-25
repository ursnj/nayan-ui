import React, { useMemo } from 'react';
import Toast, { BaseToast, ErrorToast, type ToastConfig, type ToastShowParams } from 'react-native-toast-message';
import { useNTheme } from '@/hooks/useNTheme';

export interface NToastConfig {
  config?: ToastConfig;
  successIcon?: React.ComponentType<any> | React.ReactElement;
  errorIcon?: React.ComponentType<any> | React.ReactElement;
  infoIcon?: React.ComponentType<any> | React.ReactElement;
  warningIcon?: React.ComponentType<any> | React.ReactElement;
}

export interface NToastShowOptions extends Omit<ToastShowParams, 'type'> {
  type?: 'success' | 'error' | 'info' | 'warning';
  message: string;
  title?: string;
  icon?: React.ComponentType<any> | React.ReactElement;
}

export interface NToastMethods {
  show: (options: NToastShowOptions) => void;
  hide: () => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const createToastConfig = (colors: any, icons: Partial<NToastConfig> = {}): ToastConfig => ({
  success: (props: any) => {
    const IconComponent = icons.successIcon;
    const iconElement = IconComponent ? (
      React.isValidElement(IconComponent) ? (
        IconComponent
      ) : (
        <IconComponent size={20} color={colors.primary} />
      )
    ) : null;

    return (
      <BaseToast
        {...props}
        style={{ borderLeftColor: colors.primary }}
        contentContainerStyle={{
          paddingHorizontal: 10,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border
        }}
        text2NumberOfLines={2}
        text1Style={{ height: 0 }}
        text2Style={{
          marginTop: -3,
          fontSize: 16,
          lineHeight: 25,
          color: colors.text
        }}
        renderLeadingIcon={() => iconElement}
      />
    );
  },
  error: (props: any) => {
    const IconComponent = icons.errorIcon;
    const iconElement = IconComponent ? React.isValidElement(IconComponent) ? IconComponent : <IconComponent size={20} color="red" /> : null;

    return (
      <ErrorToast
        {...props}
        style={{ borderLeftColor: 'red' }}
        contentContainerStyle={{
          paddingHorizontal: 10,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border
        }}
        text2NumberOfLines={2}
        text1Style={{ height: 0 }}
        text2Style={{
          marginTop: -3,
          fontSize: 16,
          lineHeight: 25,
          color: colors.text
        }}
        renderLeadingIcon={() => iconElement}
      />
    );
  },
  info: (props: any) => {
    const IconComponent = icons.infoIcon;
    const iconElement = IconComponent ? (
      React.isValidElement(IconComponent) ? (
        IconComponent
      ) : (
        <IconComponent size={20} color={colors.primary} />
      )
    ) : null;

    return (
      <BaseToast
        {...props}
        style={{ borderLeftColor: colors.primary }}
        contentContainerStyle={{
          paddingHorizontal: 10,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border
        }}
        text2NumberOfLines={2}
        text1Style={{ height: 0 }}
        text2Style={{
          marginTop: -3,
          fontSize: 16,
          lineHeight: 25,
          color: colors.text
        }}
        renderLeadingIcon={() => iconElement}
      />
    );
  },
  warning: (props: any) => {
    const IconComponent = icons.warningIcon;
    const iconElement = IconComponent ? React.isValidElement(IconComponent) ? IconComponent : <IconComponent size={20} color="orange" /> : null;

    return (
      <BaseToast
        {...props}
        style={{ borderLeftColor: 'orange' }}
        contentContainerStyle={{
          paddingHorizontal: 10,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border
        }}
        text2NumberOfLines={2}
        text1Style={{ height: 0 }}
        text2Style={{
          marginTop: -3,
          fontSize: 16,
          lineHeight: 25,
          color: colors.text
        }}
        renderLeadingIcon={() => iconElement}
      />
    );
  }
});

const NToastComponent = React.memo<NToastConfig>(({ config, successIcon, errorIcon, infoIcon, warningIcon }) => {
  const { colors } = useNTheme();

  const toastConfig = useMemo(
    () => config || createToastConfig(colors, { successIcon, errorIcon, infoIcon, warningIcon }),
    [colors, config, successIcon, errorIcon, infoIcon, warningIcon]
  );

  return <Toast config={toastConfig} />;
});

NToastComponent.displayName = 'NToast';

const toastMethods: NToastMethods = {
  show: ({ message, title, type = 'success', icon, ...options }: NToastShowOptions) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      position: 'bottom',
      bottomOffset: 50,
      ...options
    });
  },

  hide: () => Toast.hide(),

  success: (message: string, title?: string) => {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      position: 'bottom',
      bottomOffset: 50
    });
  },

  error: (message: string, title?: string) => {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      position: 'bottom',
      bottomOffset: 50
    });
  },

  info: (message: string, title?: string) => {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      position: 'bottom',
      bottomOffset: 50
    });
  },

  warning: (message: string, title?: string) => {
    Toast.show({
      type: 'warning',
      text1: title,
      text2: message,
      position: 'bottom',
      bottomOffset: 50
    });
  }
};

export const NToast = Object.assign(NToastComponent, toastMethods);
