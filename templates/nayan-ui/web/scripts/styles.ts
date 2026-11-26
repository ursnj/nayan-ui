import { buildStyles, developStyles, type EngineStylesOptions } from 'nayan-ui/styles';

const options: EngineStylesOptions = {
  content: ['src', '../shared/src'],
  recipeFiles: ['../shared/src/theme.ts'],
  cssOutput: 'src/generated-styles.css',
  lowerCss: false
};

if (process.argv[2] === '--dev') {
  process.exitCode = await developStyles(options, ['vite', '--host', '127.0.0.1', ...process.argv.slice(3)]);
} else {
  await buildStyles(options);
}
