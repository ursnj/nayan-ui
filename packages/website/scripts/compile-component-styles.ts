import { buildStyles, developStyles, type EngineStylesOptions } from "nayan-ui/styles";

const options: EngineStylesOptions = {
  source: "src/app/nayan-ui-theme.css",
  content: ["src"],
  output: "public/nayan-ui/site-styles.json",
  publicPath: "/nayan-ui/site-styles.json",
  cssOutput: "src/app/nayan-ui.css",
  lowerCss: false,
  manifest: "src/app/nayan-ui-styles.ts",
};

if (process.argv[2] === "--dev") {
  process.exitCode = await developStyles(options, ["next", "dev", ...process.argv.slice(3)]);
} else {
  const { utilities, rules } = await buildStyles(options);
  console.log(`Compiled ${utilities} engine utilities and ${rules} stylesheet rules.`);
}
