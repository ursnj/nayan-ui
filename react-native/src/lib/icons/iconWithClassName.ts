import type { LucideIcon } from 'lucide-react-native';
import { withUniwind } from 'uniwind';

export function iconWithClassName<T extends LucideIcon>(icon: T): T {
  return withUniwind(icon as any, {
    color: { fromClassName: 'className', styleProperty: 'color' },
    opacity: { fromClassName: 'className', styleProperty: 'opacity' }
  }) as T;
}
