import { PlatformTags, platformTagsMetadata } from "@/components/tags/PlatformTags";

export const metadata = platformTagsMetadata("react-native");

export default function TagsPage() {
  return <PlatformTags platform="react-native" />;
}
