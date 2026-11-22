import { NText, NView } from 'nayan-ui/components';
import type { ReferencePlatform } from '@/services/nayan-ui/reference-platforms';

const platformPills = {
  android: {
    label: 'Android',
    color: 'border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-200'
  },
  ios: {
    label: 'iOS',
    color: 'border-sky-200 bg-sky-100 text-sky-900 dark:border-sky-400/30 dark:bg-sky-400/15 dark:text-sky-200'
  },
  web: {
    label: 'Web',
    color: 'border-violet-200 bg-violet-100 text-violet-900 dark:border-violet-400/30 dark:bg-violet-400/15 dark:text-violet-200'
  }
} satisfies Record<ReferencePlatform, { label: string; color: string }>;

export default function PlatformPills({ platforms }: { platforms: readonly ReferencePlatform[] }) {
  return (
    <NView tag="ul" role="list" aria-label="Supported platforms" className="flex min-w-0 list-none flex-wrap gap-1.5">
      {platforms.map((platform) => {
        const { label, color } = platformPills[platform];
        return (
          <NText tag="li" key={platform} className={`rounded-full border px-2 py-0.5 text-xs font-semibold leading-4 ${color}`}>
            {label}
          </NText>
        );
      })}
    </NView>
  );
}
