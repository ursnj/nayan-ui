"use client";

import { NLink } from "@nayan-ui/react";
import { usePathname } from "next/navigation";
import { H2_DOC, H3_DOC } from "@/design/system";
import Sidebar from "@/components/helpers/Sidebar";
import { getMenuItem } from "@/services/Utils";
import { REPO_URL } from "@/services/seo";

const GamesLicensing = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Licensing"}>
      <div className="mb-8">
        <div className="space-y-6">
          <p className="text-muted">
            This library is available under a <strong>dual licensing model</strong>:
          </p>

          <div className="bg-surface border-t border-r border-b border-default border-l-4 border-l-green-500 rounded-lg p-6">
            <h3 className={H3_DOC}>
              <span className="mr-2">🆓</span>
              Non-Commercial License (Free)
            </h3>
            <ul className="text-muted text-sm space-y-2">
              <li>
                ✅ <strong>Personal projects</strong> and learning
              </li>
              <li>
                ✅ <strong>Educational use</strong> and research
              </li>
              <li>
                ✅ <strong>Open source projects</strong> (non-commercial)
              </li>
              <li>
                ✅ <strong>Portfolio</strong> and demonstration apps
              </li>
            </ul>
          </div>

          <div className="bg-surface border-t border-r border-b border-default border-l-4 border-l-blue-500 rounded-lg p-6">
            <h3 className={H3_DOC}>
              <span className="mr-2">💼</span>
              Commercial License (Paid)
            </h3>
            <p className="text-muted text-sm mb-3">Required for commercial use including:</p>
            <ul className="text-muted text-sm space-y-2 mb-4">
              <li>
                🏢 <strong>Commercial applications</strong> and products
              </li>
              <li>
                💰 <strong>Revenue-generating</strong> projects
              </li>
              <li>
                🏪 <strong>App Store</strong> or <strong>Play Store</strong> apps with monetization
              </li>
              <li>
                🏭 <strong>Enterprise</strong> and business applications
              </li>
            </ul>

            <div className="bg-background rounded-lg p-4 mb-4">
              <p className="text-foreground font-semibold mb-2">Commercial licensing includes:</p>
              <ul className="text-muted text-sm space-y-1">
                <li>• Full commercial usage rights</li>
                <li>• Priority support and maintenance</li>
                <li>• Custom feature development consideration</li>
                <li>• Optional attribution removal</li>
              </ul>
            </div>

            <div className="bg-accent/10 rounded-lg p-4">
              <p className="text-foreground font-semibold mb-2">Get Commercial License:</p>
              <p className="text-muted text-sm">
                📧 Email:{" "}
                <NLink
                  href="mailto:niranjan.devasani@gmail.com?subject=%40nayan-ui%2Fgames%20-%20Commercial%20License%20Request"
                  className="text-accent hover:underline"
                >
                  niranjan.devasani@gmail.com
                </NLink>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>
          <span className="mr-3">🙏</span>
          Acknowledgments
        </h2>
        <ul className="text-muted space-y-2">
          <li>
            • Rendering, physics, animation, audio and haptics by
            <NLink href="/engine" className="text-accent hover:underline">
              @nayan-ui/engine
            </NLink>
            (Rust and
            <NLink href="https://wgpu.rs/" target="_blank" className="text-accent hover:underline">
              wgpu
            </NLink>
            ), with a WebAssembly build for browsers
          </li>
          <li>
            • Browser build of the shared UI through
            <NLink
              href="https://necolas.github.io/react-native-web/"
              target="_blank"
              className="text-accent hover:underline"
            >
              React Native Web
            </NLink>
          </li>
          <li>
            • Treasure Hunt&apos;s explorer: a CC0 MakeHuman character from
            <NLink
              href="https://github.com/olatunde85/3d-gen"
              target="_blank"
              className="text-accent hover:underline"
            >
              3d-gen
            </NLink>
            , animated with motion capture from the CMU Graphics Lab Motion Capture Database
          </li>
          <li>
            • HUD text set in
            <NLink
              href="https://rsms.me/inter/"
              target="_blank"
              className="text-accent hover:underline"
            >
              Inter
            </NLink>
          </li>
          <li>
            • Packaged with
            <NLink
              href="https://github.com/callstack/react-native-builder-bob"
              target="_blank"
              className="text-accent hover:underline"
            >
              react-native-builder-bob
            </NLink>
          </li>
        </ul>
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>
          <span className="mr-3">📞</span>
          Support
        </h2>
        <ul className="text-muted space-y-3">
          <li className="flex items-center">
            <span className="mr-2">📧</span>
            <strong className="mr-2">Email:</strong>
            <NLink
              href="mailto:niranjan.devasani@gmail.com"
              className="text-accent hover:underline"
            >
              niranjan.devasani@gmail.com
            </NLink>
          </li>
          <li className="flex items-center">
            <span className="mr-2">🐛</span>
            <strong className="mr-2">Issues:</strong>
            <NLink href={REPO_URL} target="_blank" className="text-accent hover:underline">
              GitHub Issues
            </NLink>
          </li>
          <li className="flex items-center">
            <span className="mr-2">🌐</span>
            <strong className="mr-2">Website:</strong>
            <NLink
              href="https://www.nayanui.com/games"
              target="_blank"
              className="text-accent hover:underline"
            >
              https://www.nayanui.com/games
            </NLink>
          </li>
        </ul>
      </div>
    </Sidebar>
  );
};

export default GamesLicensing;
