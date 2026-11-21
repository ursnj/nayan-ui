import { NImage, NText, NView } from '@nayan-ui/engine/components';
import Link from 'next/link';
import Code from '@/components/helpers/Code';
import { ArrowRight, Github, Layers3, Play } from '@/design/Icons';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CONTAINER } from '@/design/system';
import { moduleReferences } from '@/services/engine/module-reference';
import { REPO_URL } from '@/services/seo';
import InstallCommand from './InstallCommand';

const scene = moduleReferences.find(({ slug }) => slug === 'games')!;

export default function Banner() {
  return (
    <section className="home-hero">
      <div className={CONTAINER}>
        <div className="home-hero-layout">
          <NView tag="div" className="home-hero-copy">
            <NText tag="p" className="home-engine-label">
              <Layers3 aria-hidden size={17} />
              Nayan Engine
            </NText>
            <NText tag="h1" className="home-title">
              Build apps.
              <span>Make games.</span>
            </NText>
            <NText tag="p" className="home-intro">
              Build interfaces and 3D games for the web, iOS and Android. Use one TypeScript API for React and React Native, with rendering powered by
              Rust.
            </NText>
            <div className="home-actions">
              <Link href="/game-engine/installation" className={BUTTON_PRIMARY}>
                Start building <ArrowRight aria-hidden size={17} />
              </Link>
              <Link href="/game-engine/playground" className={BUTTON_SECONDARY}>
                <Play aria-hidden size={16} /> Try the playground
              </Link>
            </div>
            <InstallCommand />
          </NView>
          <div className="home-hero-media">
            <div className="home-hero-artwork">
              <NImage src="/home/engine-shapes.webp" alt="" width={1448} height={1086} priority />
            </div>
            <div className="home-hero-code">
              <Code code={scene.code} filename="Scene.tsx" tone="ink" />
            </div>
          </div>
        </div>
        <nav aria-label="Platform guides" className="home-platforms">
          <span>Quickstarts</span>
          <Link href="/game-engine/react">
            React <ArrowRight aria-hidden size={15} />
          </Link>
          <Link href="/game-engine/react-native">
            React Native <ArrowRight aria-hidden size={15} />
          </Link>
          <Link href={REPO_URL} target="_blank" rel="noopener noreferrer">
            <Github aria-hidden size={16} /> GitHub
          </Link>
        </nav>
      </div>
    </section>
  );
}
