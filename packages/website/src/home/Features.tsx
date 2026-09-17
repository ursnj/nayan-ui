import { BookOpenText, Code, Layers, Moon, Palette, PencilRuler, Shield, Smartphone, Zap } from 'lucide-react';
import { FeatureCard, Section, SectionHeader } from '@/design/Primitives';
import { GRID_GAP } from '@/design/system';
import { TOTAL_COMPONENT_COUNT } from '@/services/Counts';

/**
 * Why the library, in nine claims.
 *
 * Each card used to carry its own two-colour gradient tile — nine of them in
 * a three-by-three grid, no two alike. It read as a colour swatch rather than
 * a list of reasons, and nothing in it could be emphasised because everything
 * already was. They share one accent now, and the words do the work.
 */
const FEATURES = [
  {
    icon: Smartphone,
    title: 'Cross-platform',
    body: 'Separate packages for React on the web and React Native on mobile, sharing a consistent API and design language so moving between them costs nothing.'
  },
  {
    icon: Code,
    title: 'TypeScript first',
    body: 'Written in TypeScript with full type definitions. Autocompletion on every prop and a compile error when one is wrong, with no @types package to install.'
  },
  {
    icon: Shield,
    title: 'Accessible',
    body: 'Built on HeroUI, so components arrive with the ARIA attributes, keyboard handling and focus management already in place rather than as an exercise for you.'
  },
  {
    icon: Palette,
    title: 'Themeable',
    body: 'Theming is CSS variables — colour, surface, border and field tokens. Redefine them once and every component follows, including ones you have not used yet.'
  },
  {
    icon: Moon,
    title: 'Dark mode',
    body: 'A first-class second theme, not an inverted afterthought. Wrap the tree in NTheme and switch with one prop; each token has a tuned dark counterpart.'
  },
  {
    icon: PencilRuler,
    title: 'Customisable',
    body: 'Every component takes a className, merged rather than replaced, so a Tailwind utility is enough to change one instance without forking the component.'
  },
  {
    icon: Zap,
    title: 'Lightweight',
    body: 'Tree-shakable named exports, so the bundle carries the components you imported and nothing else. Dependencies are kept few and deliberate.'
  },
  {
    icon: BookOpenText,
    title: 'Documented',
    body: 'Every component has a live demo, a copyable usage example and a complete prop table on its own page — rendered from the same library you install.'
  },
  {
    icon: Layers,
    title: `${TOTAL_COMPONENT_COUNT} components`,
    body: 'Buttons, inputs, selects, tables, dialogs, sheets, toasts, menus, popovers, sliders, date pickers and more. Enough to build an application, not just a demo.'
  }
];

const Features = () => (
  <Section id="why" labelledBy="why-heading">
    <SectionHeader
      eyebrow="Why Nayan UI"
      id="why-heading"
      title="Everything you need, nothing you don't"
      lead="Two packages, one design language, and no licence to buy. Open source and free forever."
    />
    <div className={`grid sm:grid-cols-2 lg:grid-cols-3 ${GRID_GAP}`}>
      {FEATURES.map(feature => (
        <FeatureCard key={feature.title} icon={feature.icon} title={feature.title} body={feature.body} />
      ))}
    </div>
  </Section>
);

export default Features;
