import Link from 'next/link';
import { ArrowRight, Github, Layers3 } from '@/design/Icons';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CONTAINER, H1_HERO, LEAD } from '@/design/system';
import { REPO_URL } from '@/services/seo';
import EnginePreview from './EnginePreview';
import InstallCommand from './InstallCommand';

export default function Banner() {
  return (
    <section className="home-hero border-b border-border">
      <div className={CONTAINER}>
        <div className="grid items-center gap-9 py-11 sm:py-16 lg:grid-cols-[1fr_1fr] lg:gap-10 lg:py-20 xl:gap-14">
          <div className="min-w-0">
            <p className="mb-5 inline-flex items-center gap-2 rounded-md border border-accent/20 bg-accent/8 px-2.5 py-1.5 font-mono text-xs font-semibold text-accent">
              <Layers3 aria-hidden size={14} />
              Open source engine
            </p>
            <h1 className={H1_HERO}>
              Build apps.
              <span className="block text-accent">Build games.</span>
            </h1>
            <p className={`mt-5 max-w-[34rem] text-base sm:text-lg ${LEAD}`}>
              Create cross-platform interfaces and 3D games for React and React Native with one TypeScript API and a Rust rendering core.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5 sm:gap-3">
              <Link href="/game-engine/installation" className={BUTTON_PRIMARY}>
                Get started
                <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
              </Link>
              <Link href={REPO_URL} target="_blank" rel="noopener noreferrer" className={BUTTON_SECONDARY}>
                <Github aria-hidden className="mr-2 h-4 w-4" />
                GitHub
              </Link>
            </div>
            <InstallCommand />
          </div>
          <div className="home-workbench min-w-0">
            <EnginePreview />
          </div>
        </div>
        <nav
          aria-label="Platform guides"
          className="home-platforms flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border py-4 text-sm sm:gap-x-8"
        >
          <span className="font-mono text-xs text-muted">Platform guides</span>
          <Link href="/game-engine/react">
            React <ArrowRight aria-hidden size={14} />
          </Link>
          <Link href="/game-engine/react-native">
            React Native <ArrowRight aria-hidden size={14} />
          </Link>
        </nav>
      </div>
    </section>
  );
}
