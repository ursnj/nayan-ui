import { toast } from '@heroui/react';

export const useNToast = () => {
  return (description: string, title: string = '') => {
    if (title) {
      toast(title, { description });
    } else {
      toast(description);
    }
  };
};

export function showToast(description: string, title: string = '') {
  if (title) {
    toast(title, { description });
  } else {
    toast(description);
  }
}
