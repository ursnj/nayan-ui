const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const reactNativePkgSrc = path.resolve(monorepoRoot, 'packages/react-native/src');

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo so Metro can access workspace packages
config.watchFolders = [monorepoRoot];

// Resolve node_modules from both the project and monorepo root
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules'), path.resolve(monorepoRoot, 'node_modules')];

// Force a single instance of stateful native modules so workspace packages
// (e.g. @nayan-ui/react-native compiled from source) don't pick up nested
// copies and end up with two JS instances of reanimated/worklets, which
// causes worklet runtime crashes (SIGABRT in worklets::scheduleOnUI).
const projectNodeModules = path.resolve(projectRoot, 'node_modules');
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  react: path.resolve(projectNodeModules, 'react'),
  'react-native': path.resolve(projectNodeModules, 'react-native'),
  'react-native-reanimated': path.resolve(projectNodeModules, 'react-native-reanimated'),
  'react-native-worklets': path.resolve(projectNodeModules, 'react-native-worklets'),
  'react-native-gesture-handler': path.resolve(projectNodeModules, 'react-native-gesture-handler'),
  'react-native-safe-area-context': path.resolve(projectNodeModules, 'react-native-safe-area-context'),
  'react-native-svg': path.resolve(projectNodeModules, 'react-native-svg')
};

// Uniwind must be the outermost wrapper
const finalConfig = withUniwindConfig(config, {
  cssEntryFile: path.resolve(projectRoot, 'global.css')
});

// Chain after Uniwind: redirect @nayan-ui/react-native to source and resolve @/ aliases
const uniwindResolver = finalConfig.resolver.resolveRequest;
finalConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect @nayan-ui/react-native to source entry point
  if (moduleName === '@nayan-ui/react-native') {
    return { type: 'sourceFile', filePath: path.resolve(reactNativePkgSrc, 'index.ts') };
  }
  // Resolve @/ path alias used inside @nayan-ui/react-native source files
  if (moduleName.startsWith('@/')) {
    return context.resolveRequest(context, path.resolve(reactNativePkgSrc, moduleName.slice(2)), platform);
  }
  return uniwindResolver(context, moduleName, platform);
};

module.exports = finalConfig;
