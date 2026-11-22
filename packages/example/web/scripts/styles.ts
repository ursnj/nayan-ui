import { buildStyles, developStyles, type EngineStylesOptions } from 'nayan-ui/styles';

const options: EngineStylesOptions = {
  recipeFiles: ['src/styles.ts'],
  content: ['src', '../shared/src'],
  lowerCss: false,
  manifest: 'src/generated-styles.ts'
};

if (process.argv[2] === '--dev') {
  process.exitCode = await developStyles(options, ['vite', '--host', '127.0.0.1', ...process.argv.slice(3)]);
} else {
  await buildStyles(options);
}
