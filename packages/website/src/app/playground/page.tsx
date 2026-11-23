import PlaygroundPage, { playgroundMetadata } from "@/components/nayan-playground/PlaygroundPage";

const path = "/playground";

export const metadata = playgroundMetadata(path);

export default function Page() {
  return <PlaygroundPage path={path} />;
}
