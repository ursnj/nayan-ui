import { PlatformTag, platformTagMetadata } from "@/components/tags/PlatformTags";

type Props = { params: Promise<{ tag: string }> };

export async function generateMetadata({ params }: Props) {
  return platformTagMetadata("react-native", (await params).tag);
}

export default async function TagPage({ params }: Props) {
  return <PlatformTag platform="react-native" sku={(await params).tag} />;
}
