/** The play screen owns the viewport. Game documentation retains the site layout. */
export default function GameScreenLayout({ children }: { children: React.ReactNode }) {
  return <div className="fullscreen-workspace">{children}</div>;
}
