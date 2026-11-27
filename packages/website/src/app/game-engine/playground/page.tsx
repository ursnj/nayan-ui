import PlaygroundPage, { playgroundMetadata } from "@/components/playground/PlaygroundPage";

import { canonicalPageAliases } from "@/services/site-routes";

const path = canonicalPageAliases["/game-engine/playground"];

export const metadata = playgroundMetadata(path);

export default function Page() {
  return <PlaygroundPage path={path} />;
}
