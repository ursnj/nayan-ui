import { Toast, useToast } from 'heroui-native';

export interface NToastShowOptions {
  type?: 'success' | 'error' | 'info' | 'warning';
  message: string;
  title?: string;
}

export interface NToastMethods {
  show: (options: NToastShowOptions) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

export function useNToast(): NToastMethods {
  const toast = useToast();

  return {
    show: ({ message, title, type = 'success' }: NToastShowOptions) => {
      toast.show({ title: title || '', description: message, variant: type === 'error' ? 'danger' : 'default' });
    },
    success: (message: string, title?: string) => {
      toast.show({ title: title || 'Success', description: message, variant: 'default' });
    },
    error: (message: string, title?: string) => {
      toast.show({ title: title || 'Error', description: message, variant: 'danger' });
    },
    info: (message: string, title?: string) => {
      toast.show({ title: title || 'Info', description: message, variant: 'default' });
    },
    warning: (message: string, title?: string) => {
      toast.show({ title: title || 'Warning', description: message, variant: 'default' });
    },
  };
}

export { Toast as NToast };
