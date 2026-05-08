import type { Metadata } from 'next';
import Home from '@/home/Home';

export const metadata: Metadata = {
  title: 'Modern React & React Native Component Library',
  description:
    'Build beautiful, accessible, and performant applications with our comprehensive collection of React and React Native components. Designed for modern development workflows.',
  keywords: 'react components, react native, ui library, component library, design system, typescript, accessibility, cross-platform'
};

export default function HomePage() {
  return <Home />;
}
