const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');
const { withMetroConfig } = require('react-native-monorepo-config');
const { withUniwindConfig } = require('uniwind/metro');

const root = path.resolve(__dirname, '..');

const config = withMetroConfig(getDefaultConfig(__dirname), {
  root,
  dirname: __dirname
});

module.exports = withUniwindConfig(config, {
  cssEntryFile: path.resolve(__dirname, 'global.css'),
  dtsFile: path.resolve(__dirname, 'src/uniwind-types.d.ts')
});
