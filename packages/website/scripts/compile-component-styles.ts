import { buildStyles, developStyles, type EngineStylesOptions } from "@nayan-ui/engine/styles";

const options: EngineStylesOptions = {
  source: "src/app/engine-theme.css",
  content: ["src/components/home"],
  output: "public/engine-ui/site-styles.json",
  publicPath: "/engine-ui/site-styles.json",
  cssOutput: "src/app/engine.css",
  manifest: "src/app/engine-styles.ts",
};

if (process.argv[2] === "--dev") {
  process.exitCode = await developStyles(options, ["next", "dev", ...process.argv.slice(3)]);
} else {
  const { utilities, rules } = await buildStyles(options);
  console.log(`Compiled ${utilities} engine utilities and ${rules} stylesheet rules.`);
}
