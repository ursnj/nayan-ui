import { Accessibility, Blocks, Paintbrush, Smartphone, Sparkles } from 'lucide-react';
import { Section, SectionHeader } from '@/design/Primitives';
import { ACCENT_SOFT, BODY, CARD, CARD_PAD, GRID_GAP, H3 } from '@/design/system';
import { TOTAL_COMPONENT_COUNT } from '@/services/Counts';

const FEATURES = [
  {
    icon: Blocks,
    span: 'lg:col-span-2',
    title: `${TOTAL_COMPONENT_COUNT} components, ready to ship`,
    body: 'Buttons, forms, tables, dialogs, sheets, menus, date pickers — enough to build a real application rather than a demo. Every one arrives styled, accessible and documented, so the first thing you write is your feature, not a dropdown.'
  },
  {
    icon: Smartphone,
    title: 'Web and mobile, one API',
    body: 'The same prop names and the same design language on React and React Native, so moving between them costs you nothing.'
  },
  {
    icon: Accessibility,
    title: 'Accessible out of the box',
    body: 'Keyboard navigation, focus management and screen-reader labels are already handled — not left as an exercise for later.'
  },
  {
    icon: Paintbrush,
    title: 'Looks like your product',
    body: 'Restyle everything from one set of colour tokens — including a dark theme that was designed, not inverted. Or override a single instance with a utility class.'
  },
  {
    icon: Sparkles,
    title: 'Free, and staying free',
    body: 'MIT licensed with no paid tier, no seat count and nothing held back. Use it in client work without asking anyone.'
  }
];

const Features = () => (
  <Section id="why" labelledBy="why-heading">
    <SectionHeader
      eyebrow="Why Nayan UI"
      id="why-heading"
      title="Everything you need, nothing you don't"
      lead="Two packages, one design language, and no licence to buy."
    />
    <div className={`grid sm:grid-cols-2 lg:grid-cols-3 ${GRID_GAP}`}>
      {FEATURES.map(feature => {
        const Icon = feature.icon;
        return (
          <article
            key={feature.title}
            className={`group ${CARD} ${CARD_PAD} relative overflow-hidden transition-colors duration-200 hover:border-indigo-500/30 ${feature.span ?? ''}`}>
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
            <span className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border ${ACCENT_SOFT}`}>
              <Icon className="h-5 w-5" />
            </span>
            <h3 className={`mb-2 ${H3}`}>{feature.title}</h3>
            <p className={BODY}>{feature.body}</p>
          </article>
        );
      })}
    </div>
  </Section>
);

export default Features;
