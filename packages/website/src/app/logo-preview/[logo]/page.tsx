import { notFound } from "next/navigation";
import LogoPreview from "@/components/examples/LogoPreview";
import { LOGOS } from "@/components/examples/logos";

export const metadata = { title: "Logo preview", robots: { index: false, follow: false } };

export function generateStaticParams() {
  return LOGOS.map((logo) => ({ logo: logo.id }));
}

export default async function LogoPreviewPage({ params }: { params: Promise<{ logo: string }> }) {
  const { logo } = await params;
  const item = LOGOS.find((item) => item.id === logo);
  if (!item) notFound();
  return (
    <>
      <style>{`html, body { margin: 0; overflow: hidden; } body header, body footer { display: none !important; } body main { margin: 0 !important; }`}</style>
      <LogoPreview logo={item.id} />
    </>
  );
}
