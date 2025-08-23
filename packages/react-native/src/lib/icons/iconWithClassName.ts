import type { LucideIcon } from 'lucide-react-native';
import { cssInterop } from 'nativewind';

export function iconWithClassName(icon: LucideIcon) {
  cssInterop(
    icon as any,
    {
      className: {
        target: 'style',
        nativeStyleToProp: {
          color: true,
          opacity: true
        }
      }
    } as any
  );
}
