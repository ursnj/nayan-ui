import { ArrowRight, Github } from '@/design/Icons';
import Link from 'next/link';
import { CtaPanel } from '@/design/Primitives';
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/design/system';
import { REPO_URL } from '@/services/seo';

export default function CallToAction() {
  return (
    <CtaPanel
      title="Get started with Nayan UI"
      lead="Create a starter workspace with a shared landing page and theme for React and Expo."
    >
      <Link href="/game-engine/installation#start-from-the-template" className={BUTTON_PRIMARY}>
        Create a starter project <ArrowRight aria-hidden size={16} className="ml-2" />
      </Link>
      <Link href={REPO_URL} target="_blank" rel="noopener noreferrer" className={BUTTON_SECONDARY}>
        <Github aria-hidden size={16} className="mr-2" />
        View source
      </Link>
    </CtaPanel>
  );
}
