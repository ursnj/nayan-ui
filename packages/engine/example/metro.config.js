const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withMetroConfig } = require("react-native-monorepo-config");

const root = path.resolve(__dirname, "..");
const monorepoRoot = path.resolve(__dirname, "../../..");

const config = withMetroConfig(getDefaultConfig(__dirname), {
  root,
  dirname: __dirname,
});

// bun's isolated install keeps the real packages in <repo>/node_modules/.bun;
// Metro must watch and resolve through it.
config.watchFolders = [...(config.watchFolders || []), path.resolve(monorepoRoot, "node_modules")];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(root, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// 3D models loaded with loadModel(require("./model.glb")).
config.resolver.assetExts.push("glb", "gltf");

module.exports = config;
