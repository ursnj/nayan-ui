import type { LucideIcon } from 'lucide-react-native';
import { remapProps } from 'uniwind';

export function iconWithClassName(icon: LucideIcon) {
  remapProps(icon as any, {
    className: 'style'
  });
}
