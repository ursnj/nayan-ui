import { ArrowRight, Github } from '@/design/Icons';
import Link from 'next/link';
import { CtaPanel } from '@/design/Primitives';
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/design/system';
import { REPO_URL } from '@/services/seo';

export default function CallToAction() {
  return (
    <CtaPanel
      title="Get started with Nayan Engine"
      lead="Follow the installation guide for React or React Native. The engine is open source and MIT licensed."
    >
      <Link href="/game-engine/installation" className={BUTTON_PRIMARY}>
        Install the engine <ArrowRight aria-hidden size={16} className="ml-2" />
      </Link>
      <Link href={REPO_URL} target="_blank" rel="noopener noreferrer" className={BUTTON_SECONDARY}>
        <Github aria-hidden size={16} className="mr-2" />
        View source
      </Link>
    </CtaPanel>
  );
}
