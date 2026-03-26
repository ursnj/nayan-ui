const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');
const { withMetroConfig } = require('react-native-monorepo-config');
const { withUniwindConfig } = require('uniwind/metro');

const root = path.resolve(__dirname, '..');

const config = withMetroConfig(getDefaultConfig(__dirname), {
  root,
  dirname: __dirname
});

// Keep Expo virtual modules resolvable for expo-router runtime.
// react-native-monorepo-config may block root expo path as a duplicate,
// which breaks bundle graph SHA lookup for expo/virtual/* files.
if (Array.isArray(config.resolver?.blockList)) {
  const expoVirtualProbe = path.join(root, 'node_modules', 'expo', 'virtual', 'streams.js');
  config.resolver.blockList = config.resolver.blockList.filter(pattern => {
    try {
      return !pattern.test(expoVirtualProbe);
    } catch {
      return true;
    }
  });
}

module.exports = withUniwindConfig(config, {
  cssEntryFile: path.resolve(__dirname, 'global.css'),
  dtsFile: path.resolve(__dirname, 'src/uniwind-types.d.ts')
});
