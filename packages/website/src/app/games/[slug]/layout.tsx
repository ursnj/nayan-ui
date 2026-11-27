/** The play screen owns the viewport. Game documentation retains the site layout. */
import { NView } from 'nayan-ui/components';
export default function GameScreenLayout({ children }: { children: React.ReactNode }) {
  return <NView tag="div" className="fullscreen-workspace">{children}</NView>;
}
