import { toast, useToast as useToaster } from './ui/use-toast';

export const useNToast = () => {
  const { toast: toaster } = useToaster();
  return (description: string, title: string = '') => {
    toaster(Object.assign({ description }, title && { title }));
  };
};

export function showToast(description: string, title: string = '') {
  toast(Object.assign({ description }, title && { title }));
}
