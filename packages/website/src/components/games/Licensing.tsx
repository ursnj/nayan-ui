"use client";

import { NLink } from "@nayan-ui/react";
import { usePathname } from "next/navigation";
import { H2_DOC, H3_DOC } from "@/design/system";
import Sidebar from "@/components/helpers/Sidebar";
import { getMenuItem } from "@/services/Utils";
import { REPO_URL } from "@/services/seo";

const LINK = "text-accent hover:underline";
const EMAIL = "niranjan.devasani@gmail.com";

const ACKNOWLEDGMENTS: { name: string; href: string; use: string }[] = [
  {
    name: "@nayan-ui/engine",
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
      <p className="text-muted text-sm mb-6">
        @nayan-ui/games is dual licensed: free for non-commercial use, paid for commercial use.
      </p>

      <div className="mb-8 space-y-4">
        <div className="bg-surface border-t border-r border-b border-default border-l-4 border-l-green-500 rounded-lg p-5">
          <h3 className={H3_DOC}>Non-commercial (free)</h3>
          <p className="text-muted text-sm">
            Personal projects, learning, education and research, non-commercial open source,
            portfolios and demos.
          </p>
        </div>

        <div className="bg-surface border-t border-r border-b border-default border-l-4 border-l-blue-500 rounded-lg p-5">
          <h3 className={H3_DOC}>Commercial (paid)</h3>
          <p className="text-muted text-sm mb-2">
            Required for commercial products, revenue-generating projects, monetized App Store or
            Play Store apps, and enterprise use. Includes full commercial rights, priority support
            and maintenance, consideration for custom features, and optional attribution removal.
          </p>
          <p className="text-muted text-sm">
            Request one at{" "}
            <NLink
              href={`mailto:${EMAIL}?subject=%40nayan-ui%2Fgames%20-%20Commercial%20License%20Request`}
              className={LINK}
            >
              {EMAIL}
            </NLink>
            .
          </p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Acknowledgments</h2>
        <ul className="text-muted text-sm space-y-2">
          {ACKNOWLEDGMENTS.map((item) => (
            <li key={item.name}>
              •{" "}
              <NLink
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                className={LINK}
              >
                {item.name}
              </NLink>
              : {item.use}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Support</h2>
        <ul className="text-muted text-sm space-y-2">
          <li>
            • Email:{" "}
            <NLink href={`mailto:${EMAIL}`} className={LINK}>
              {EMAIL}
            </NLink>
          </li>
          <li>
            • Issues:{" "}
            <NLink href={REPO_URL} target="_blank" className={LINK}>
              GitHub Issues
            </NLink>
          </li>
          <li>
            • Website:{" "}
            <NLink href="https://www.nayanui.com/games" target="_blank" className={LINK}>
              nayanui.com/games
            </NLink>
          </li>
        </ul>
      </div>
    </Sidebar>
  );
};

export default GamesLicensing;
