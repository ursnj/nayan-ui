import { Accessibility, Blocks, Paintbrush, Smartphone } from '@/design/Icons';
import { Section, SectionHeader } from '@/design/Primitives';
import { BODY, H3 } from '@/design/system';

const FEATURES = [
  {
    icon: Blocks,
    title: 'UI building blocks',
    body: 'Compose screens with buttons, dialogs, sheets, date pickers and other controls.'
  },
  {
    icon: Smartphone,
    title: 'One API across platforms',
    body: 'Share component props and interaction patterns across React and React Native.'
  },
  {
    icon: Accessibility,
    title: 'Accessible interactions',
    body: 'Use built-in keyboard navigation, focus management and screen-reader labels.'
  },
  {
    icon: Paintbrush,
    title: 'Theme with tokens',
    body: 'Customize light and dark palettes, with utility classes for individual controls.'
  }
];

export default function Features() {
  return (
    <Section id="why" labelledBy="why-heading">
      <SectionHeader id="why-heading" title="Build with engine components" />
      <div className="grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <article key={title} className="border-t border-border pt-5">
            <Icon aria-hidden size={22} strokeWidth={1.7} className="mb-3 text-accent" />
            <h3 className={H3}>{title}</h3>
            <p className={`mt-2 ${BODY}`}>{body}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
