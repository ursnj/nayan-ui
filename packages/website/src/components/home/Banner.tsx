import { NImage, NText, NView } from 'nayan-ui/components';
import Link from 'next/link';
import Code from '@/components/helpers/Code';
import { ArrowRight, Github, Layers3, Play } from '@/design/Icons';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CONTAINER } from '@/design/system';
import { moduleReferences } from '@/services/nayan-ui/module-reference';
import { REPO_URL } from '@/services/seo';
import InstallCommand from './InstallCommand';

const scene = moduleReferences.find(({ slug }) => slug === 'games')!;

export default function Banner() {
  return (
    <NView tag="section" className="home-hero">
      <NView tag="div" className={CONTAINER}>
        <NView tag="div" className="home-hero-layout">
          <NView tag="div" className="home-hero-copy">
            <NText tag="p" className="home-engine-label">
              <Layers3 aria-hidden size={17} />
              Nayan UI
            </NText>
            <NText tag="h1" className="home-title">
              Build apps.
              <NText tag="span">Make games.</NText>
            </NText>
            <NText tag="p" className="home-intro">
              Build interfaces and 3D games for the web, iOS and Android. Use one TypeScript API for React and React Native, with rendering powered by
              Rust.
            </NText>
            <NView tag="div" className="home-actions">
              <Link href="/game-engine/installation" className={BUTTON_PRIMARY}>
                Start building <ArrowRight aria-hidden size={17} />
              </Link>
              <Link href="/playground" className={BUTTON_SECONDARY}>
                <Play aria-hidden size={16} /> Try the playground
              </Link>
            </NView>
            <InstallCommand />
          </NView>
          <NView tag="div" className="home-hero-media">
            <NView tag="div" className="home-hero-artwork">
              <NImage src="/home/engine-shapes.webp" alt="" width={1448} height={1086} priority />
            </NView>
            <NView tag="div" className="home-hero-code">
              <Code code={scene.code} filename="Scene.tsx" tone="ink" />
            </NView>
          </NView>
        </NView>
        <NView tag="nav" aria-label="Platform guides" className="home-platforms">
          <NText tag="span">Quickstarts</NText>
          <Link href="/game-engine/react">
            React <ArrowRight aria-hidden size={15} />
          </Link>
          <Link href="/game-engine/react-native">
            React Native <ArrowRight aria-hidden size={15} />
          </Link>
          <Link href={REPO_URL} target="_blank" rel="noopener noreferrer">
            <Github aria-hidden size={16} /> GitHub
          </Link>
        </NView>
      </NView>
    </NView>
  );
}
