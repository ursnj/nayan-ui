const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const reactNativePkgRoot = path.resolve(monorepoRoot, 'packages/react-native');

const config = getDefaultConfig(projectRoot);

// Watch the monorepo packages folder
config.watchFolders = [monorepoRoot];

// Resolve node_modules from both the project and monorepo root
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules'), path.resolve(monorepoRoot, 'node_modules')];

// Use source field so Metro resolves raw .tsx source in development
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Resolve @/ path alias used in @nayan-ui/react-native source files
  if (moduleName.startsWith('@/')) {
    const resolved = path.resolve(reactNativePkgRoot, 'src', moduleName.slice(2));
    return context.resolveRequest(context, resolved, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withUniwindConfig(config, { cssEntryFile: './global.css' });
