/**
 * Patches react-native-reanimated's AnimatedComponent to gracefully handle
 * components that render nothing (return null).
 *
 * Reanimated v4's createAnimatedComponent throws when findHostInstance returns
 * null, which happens with heroui-native's Menu.Content, Popover.Content, etc.
 * when they are mounted but not yet visible (isOpen=false).
 *
 * This patch replaces the throw with a safe fallback return.
 * Patches both lib/module (compiled) and src (source) since Metro may resolve
 * the "source" field from package.json in monorepo setups.
 */
const fs = require('fs');
const path = require('path');

const reanimatedRoot = path.join(__dirname, '..', 'node_modules', 'react-native-reanimated');

const files = [
  path.join(reanimatedRoot, 'lib', 'module', 'css', 'component', 'AnimatedComponent.js'),
  path.join(reanimatedRoot, 'src', 'css', 'component', 'AnimatedComponent.tsx'),
];

const throwPattern = /throw new ReanimatedError\(\s*'Cannot find host instance for this component\. Maybe it renders nothing\?'\s*\);/;

let patched = 0;

for (const filePath of files) {
  try {
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf8');
    if (!throwPattern.test(content)) {
      console.log(`[fix-reanimated] Already patched: ${path.basename(filePath)}`);
      continue;
    }

    const replacement = filePath.endsWith('.tsx')
      ? 'return { viewTag: -1, shadowNodeWrapper: null, reactViewName: undefined } as ViewInfo;'
      : 'return { viewTag: -1, shadowNodeWrapper: null, reactViewName: undefined };';

    const result = content.replace(throwPattern, replacement);
    fs.writeFileSync(filePath, result, 'utf8');
    console.log(`[fix-reanimated] Patched: ${path.basename(filePath)}`);
    patched++;
  } catch (err) {
    console.error(`[fix-reanimated] Failed to patch ${path.basename(filePath)}:`, err.message);
  }
}

if (patched === 0) {
  console.log('[fix-reanimated] No files needed patching.');
}
