module.exports = {
  presets: [['module:react-native-builder-bob/babel-preset', { modules: 'commonjs' }]],
  plugins: [
    [
      'module-resolver',
      {
        extensions: ['.tsx', '.ts', '.js', '.json'],
        alias: {
          '@': './src'
        }
      }
    ]
  ]
};
