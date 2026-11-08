import LogoPreview from "@/components/examples/logo-animation/LogoPreview";

export const metadata = { title: "Logo animation player", robots: { index: false, follow: false } };

export default function LogoPlayerPage() {
  return (
    <>
      <style>{`html, body { margin: 0; overflow: hidden; } body header, body footer { display: none !important; } body main { margin: 0 !important; }`}</style>
      <LogoPreview />
    </>
  );
}
