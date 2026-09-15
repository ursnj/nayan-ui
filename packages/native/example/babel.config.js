const path = require('path');
const { getConfig } = require('react-native-builder-bob/babel-config');
const pkg = require('../package.json');

const root = path.resolve(__dirname, '..');

module.exports = function (api) {
  api.cache(true);

  // NOTE: babel-preset-expo (SDK 54+) automatically adds the
  // react-native-worklets/plugin when react-native-worklets is installed,
  // so the legacy manual 'react-native-reanimated/plugin' must NOT be added
  // here (doing so double-applies the worklets transform).
  return getConfig(
    {
      presets: ['babel-preset-expo']
    },
    { root, pkg }
  );
};
