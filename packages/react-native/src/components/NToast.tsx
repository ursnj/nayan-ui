import { useToast } from 'heroui-native';

export type NToastVariant = 'default' | 'success' | 'danger' | 'warning';

export interface NToastShowOptions {
  variant?: NToastVariant;
  message: string;
  title?: string;
  icon?: React.ReactElement;
}

export function useNToast() {
  const { toast } = useToast();

  return {
    show: ({ message, title, variant = 'default', icon }: NToastShowOptions) => {
      toast.show({
        variant,
        label: title || message,
        description: title ? message : undefined,
        icon,
        placement: 'bottom'
      });
    },

    success: (message: string, title?: string) => {
      toast.show({
        variant: 'success',
        label: title || message,
        description: title ? message : undefined,
        placement: 'bottom'
      });
    },

    error: (message: string, title?: string) => {
      toast.show({
        variant: 'danger',
        label: title || message,
        description: title ? message : undefined,
        placement: 'bottom'
      });
    },

    info: (message: string, title?: string) => {
      toast.show({
        variant: 'default',
        label: title || message,
        description: title ? message : undefined,
        placement: 'bottom'
      });
    },

    warning: (message: string, title?: string) => {
      toast.show({
        variant: 'warning',
        label: title || message,
        description: title ? message : undefined,
        placement: 'bottom'
      });
    },

    hide: () => toast.hide('all')
  };
}
