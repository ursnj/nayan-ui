import PlaygroundPage, { playgroundMetadata } from "@/components/playground/PlaygroundPage";

const path = "/game-engine/playground";

export const metadata = playgroundMetadata(path);

export default function Page() {
  return <PlaygroundPage path={path} />;
}
