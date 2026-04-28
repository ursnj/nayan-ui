const path = require('path');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@/': path.resolve(__dirname, '../../packages/react-native/src/')
          }
        }
      ]
      // Note: do NOT add 'react-native-reanimated/plugin' here.
      // babel-preset-expo automatically includes it (and the worklets plugin)
      // when react-native-reanimated is installed. Adding it manually causes
      // double-transformation of worklets and a SIGABRT crash on the UI runtime.
    ]
  };
};
