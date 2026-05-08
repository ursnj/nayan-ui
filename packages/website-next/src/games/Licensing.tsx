'use client';

import { NLink } from '@nayan-ui/react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/helpers/Sidebar';
import { getMenuItem } from '@/services/Utils';

const GamesLicensing = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || 'Licensing'}>
      {/* License Section */}
      <div className="mb-8">
        <div className="space-y-6">
          <p className="text-muted">
            This library is available under a <strong>dual licensing model</strong>:
          </p>

          <div className="bg-surface border-t border-r border-b border-default border-l-4 border-l-green-500 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center">
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
            <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center">
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

            <div className="bg-muted/20 rounded-lg p-4 mb-4">
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
                📧 Email:{' '}
                <NLink
                  href="mailto:niranjan.devasani@gmail.com?subject=React%20Native%20Games%20-%20Commercial%20License%20Request"
                  className="text-accent hover:underline">
                  niranjan.devasani@gmail.com
                </NLink>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Acknowledgments Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
          <span className="mr-3">🙏</span>
          Acknowledgments
        </h2>
        <ul className="text-muted space-y-2">
          <li>
            • Built with{' '}
            <NLink href="https://shopify.github.io/react-native-skia/" target="_blank" className="text-accent hover:underline">
              React Native Skia
            </NLink>{' '}
            for high-performance graphics
          </li>
          <li>
            • Powered by{' '}
            <NLink href="https://docs.swmansion.com/react-native-reanimated/" target="_blank" className="text-accent hover:underline">
              React Native Reanimated
            </NLink>{' '}
            for smooth animations
          </li>
          <li>
            • Enhanced with{' '}
            <NLink href="https://github.com/margelo/react-native-worklets" target="_blank" className="text-accent hover:underline">
              React Native Worklets
            </NLink>{' '}
            for high-performance JavaScript
          </li>
          <li>
            • State management with{' '}
            <NLink href="https://github.com/pmndrs/zustand" target="_blank" className="text-accent hover:underline">
              Zustand
            </NLink>{' '}
            and{' '}
            <NLink href="https://github.com/immerjs/immer" target="_blank" className="text-accent hover:underline">
              Immer
            </NLink>
          </li>
          <li>
            • Created with{' '}
            <NLink href="https://github.com/callstack/react-native-builder-bob" target="_blank" className="text-accent hover:underline">
              create-react-native-library
            </NLink>
          </li>
        </ul>
      </div>

      {/* Support Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
          <span className="mr-3">📞</span>
          Support
        </h2>
        <ul className="text-muted space-y-3">
          <li className="flex items-center">
            <span className="mr-2">📧</span>
            <strong className="mr-2">Email:</strong>
            <NLink href="mailto:niranjan.devasani@gmail.com" className="text-accent hover:underline">
              niranjan.devasani@gmail.com
            </NLink>
          </li>
          <li className="flex items-center">
            <span className="mr-2">🐛</span>
            <strong className="mr-2">Issues:</strong>
            <NLink href="https://github.com/ursnj/nayan-ui/issues" target="_blank" className="text-accent hover:underline">
              GitHub Issues
            </NLink>
          </li>
          <li className="flex items-center">
            <span className="mr-2">🌐</span>
            <strong className="mr-2">Website:</strong>
            <NLink href="https://www.nayanui.com/games" target="_blank" className="text-accent hover:underline">
              https://www.nayanui.com/games
            </NLink>
          </li>
        </ul>
      </div>
    </Sidebar>
  );
};

export default GamesLicensing;
