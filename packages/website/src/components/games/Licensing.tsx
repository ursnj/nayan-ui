"use client";

import { NText, NView } from 'nayan-ui/components';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { H2_DOC, H3_DOC } from "@/design/system";
import Sidebar from "@/components/helpers/Sidebar";
import { getMenuItem } from "@/services/Utils";
import { REPO_URL } from "@/services/seo";

const LINK = "text-accent hover:underline";
const EMAIL = "niranjan.devasani@gmail.com";

const ACKNOWLEDGMENTS: { name: string; href: string; use: string }[] = [
  {
    name: "nayan-ui",
    href: "/game-engine",
    use: "rendering, physics, animation, audio and haptics (Rust, wgpu, WebAssembly)",
  },
  { name: "wgpu", href: "https://wgpu.rs/", use: "the engine's GPU layer" },
  {
    name: "React Native Web",
    href: "https://necolas.github.io/react-native-web/",
    use: "the browser build of the shared UI",
  },
  {
    name: "3d-gen",
    href: "https://github.com/olatunde85/3d-gen",
    use: "Treasure Hunt's CC0 MakeHuman explorer, animated with CMU Graphics Lab motion capture",
  },
  { name: "Inter", href: "https://rsms.me/inter/", use: "HUD text" },
  {
    name: "react-native-builder-bob",
    href: "https://github.com/callstack/react-native-builder-bob",
    use: "packaging",
  },
];

const GamesLicensing = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Licensing"}>
      <NText tag="p" className="text-muted text-sm mb-6">
        nayan-games is dual licensed: free for non-commercial use, paid for commercial use.
      </NText>

      <NView tag="div" className="mb-8 space-y-4">
        <NView tag="div" className="bg-surface border-t border-r border-b border-default border-l-4 border-l-green-500 rounded-lg p-5">
          <NText tag="h3" className={H3_DOC}>Non-commercial (free)</NText>
          <NText tag="p" className="text-muted text-sm">
            Personal projects, learning, education and research, non-commercial open source,
            portfolios and demos.
          </NText>
        </NView>

        <NView tag="div" className="bg-surface border-t border-r border-b border-default border-l-4 border-l-blue-500 rounded-lg p-5">
          <NText tag="h3" className={H3_DOC}>Commercial (paid)</NText>
          <NText tag="p" className="text-muted text-sm mb-2">
            Required for commercial products, revenue-generating projects, monetized App Store or
            Play Store apps, and enterprise use. Includes full commercial rights, priority support
            and maintenance, consideration for custom features, and optional attribution removal.
          </NText>
          <NText tag="p" className="text-muted text-sm">
            Request one at{" "}
            <Link
              href={`mailto:${EMAIL}?subject=nayan-games%20-%20Commercial%20License%20Request`}
              className={LINK}
            >
              {EMAIL}
            </Link>
            .
          </NText>
        </NView>
      </NView>

      <NView tag="div" className="mb-8">
        <NText tag="h2" className={H2_DOC}>Acknowledgments</NText>
        <NView tag="ul" className="text-muted text-sm space-y-2">
          {ACKNOWLEDGMENTS.map((item) => (
            <NView tag="li" key={item.name}>
              •{" "}
              <Link
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                className={LINK}
              >
                {item.name}
              </Link>
              : {item.use}
            </NView>
          ))}
        </NView>
      </NView>

      <NView tag="div" className="mb-8">
        <NText tag="h2" className={H2_DOC}>Support</NText>
        <NView tag="ul" className="text-muted text-sm space-y-2">
          <NView tag="li">
            • Email:{" "}
            <Link href={`mailto:${EMAIL}`} className={LINK}>
              {EMAIL}
            </Link>
          </NView>
          <NView tag="li">
            • Issues:{" "}
            <Link href={REPO_URL} target="_blank" className={LINK}>
              GitHub Issues
            </Link>
          </NView>
          <NView tag="li">
            • Website:{" "}
            <Link href="https://www.nayanui.com/games" target="_blank" className={LINK}>
              nayanui.com/games
            </Link>
          </NView>
        </NView>
      </NView>
    </Sidebar>
  );
};

export default GamesLicensing;
