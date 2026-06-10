import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Toast, useThemeColor, useToast } from 'heroui-native';
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

const TOAST_CLASSNAME = 'flex-row gap-3 border border-border ios:shadow-field android:shadow-md';

// --- Imperative service ---
let _registeredMethods: NToastMethods | null = null;

const _pending: (() => void)[] = [];

function _invoke(fn: (methods: NToastMethods) => void) {
  if (_registeredMethods) {
    fn(_registeredMethods);
  } else {
    _pending.push(() => fn(_registeredMethods!));
  }
}

export const NToast = {
  show: (options: NToastShowOptions) => _invoke(m => m.show(options)),
  success: (message: string, title?: string, icon?: React.ReactNode) => _invoke(m => m.success(message, title, icon)),
  error: (message: string, title?: string, icon?: React.ReactNode) => _invoke(m => m.error(message, title, icon)),
  info: (message: string, title?: string, icon?: React.ReactNode) => _invoke(m => m.info(message, title, icon)),
  warning: (message: string, title?: string, icon?: React.ReactNode) => _invoke(m => m.warning(message, title, icon))
};

// --- Hook ---
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

  const createToastComponent = (
    variant: 'default' | 'success' | 'warning' | 'danger',
    label: string,
    description: string,
    icon: React.ReactNode,
    actionLabel?: string,
    onActionPress?: () => void
  ) => {
    return (props: any) => (
      <Toast {...props} variant={variant} className={TOAST_CLASSNAME}>
        {icon && <View>{icon}</View>}
        <View className="flex-1">
          {label ? <Toast.Title>{label}</Toast.Title> : null}
          {description ? <Toast.Description>{description}</Toast.Description> : null}
        </View>
        {actionLabel && (
          <Toast.Action
            onPress={() => {
              onActionPress?.();
              props.hide?.('all');
            }}>
            {actionLabel}
          </Toast.Action>
        )}
      </Toast>
    );
  };

  const methods: NToastMethods = {
    show: ({ message, title, type = 'success', icon, actionLabel, onActionPress }: NToastShowOptions) => {
      const variant = VARIANT_MAP[type] ?? 'default';
      toast.show({
        component: createToastComponent(variant, title || '', message, icon ?? getIcon(type), actionLabel, onActionPress)
      });
    },
    success: (message: string, title?: string, icon?: React.ReactNode) => {
      toast.show({
        component: createToastComponent('success', title || 'Success', message, icon ?? getIcon('success'))
      });
    },
    error: (message: string, title?: string, icon?: React.ReactNode) => {
      toast.show({
        component: createToastComponent('danger', title || 'Error', message, icon ?? getIcon('error'))
      });
    },
    info: (message: string, title?: string, icon?: React.ReactNode) => {
      toast.show({
        component: createToastComponent('default', title || 'Info', message, icon ?? getIcon('info'))
      });
    },
    warning: (message: string, title?: string, icon?: React.ReactNode) => {
      toast.show({
        component: createToastComponent('warning', title || 'Warning', message, icon ?? getIcon('warning'))
      });
    }
  };

  const methodsRef = useRef(methods);
  methodsRef.current = methods;

  useEffect(() => {
    _registeredMethods = {
      show: (...args) => methodsRef.current.show(...args),
      success: (...args) => methodsRef.current.success(...args),
      error: (...args) => methodsRef.current.error(...args),
      info: (...args) => methodsRef.current.info(...args),
      warning: (...args) => methodsRef.current.warning(...args)
    };
    _pending.forEach(fn => fn());
    _pending.length = 0;
    return () => {
      _registeredMethods = null;
    };
  }, []);

  return methods;
}
