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
      ],
      'react-native-reanimated/plugin'
    ]
  };
};
