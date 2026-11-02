/**
 * A game's own page plays without the site header, like the video editor: the root layout's fixed
 * Header and the `mt-[60px]` it reserves on `<main>` are hidden with a style injected from here. The
 * games docs pages (installation, API reference, build-a-game, licensing) are sibling routes and keep it.
 */
export default function GameScreenLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        header.fixed { display: none !important; }
        main.mt-\\[60px\\] { margin-top: 0 !important; }
      `}</style>
      {children}
    </>
  );
}
