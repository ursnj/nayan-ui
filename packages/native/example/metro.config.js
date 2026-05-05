const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');
const { withMetroConfig } = require('react-native-monorepo-config');
const { withUniwindConfig } = require('uniwind/metro');

const root = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(__dirname, '../../..');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = withMetroConfig(getDefaultConfig(__dirname), {
  root,
  dirname: __dirname
});

// Add monorepo root node_modules for hoisted dependency resolution
config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(root, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts'
});
