// Loads asset bytes for the engine: `require("./file.ext")` assets (resolved by the bundler) or URIs.
import { Image } from "react-native";

/** A `require("./file.ext")` asset, or a URI (http(s):// or file://). */
export type AssetSource = number | string;

/** The URI an asset resolves to (a Metro dev-server URL in development, a bundle path in release). */
export function assetUri(source: AssetSource): string | undefined {
  return typeof source === "number" ? Image.resolveAssetSource(source)?.uri : source;
}

/** Copies a bundled asset to a local file (Android release bundles them as res/raw resources). */
async function localAssetUri(source: number): Promise<string> {
  type ExpoAsset = { name: string; type: string; hash: string | null; uri: string; localUri: string | null; downloadAsync(): Promise<ExpoAsset> };
  let Asset: { fromModule(module: number): ExpoAsset; new (descriptor: { name: string; type: string; hash: string | null; uri: string }): ExpoAsset };
  try {
    ({ Asset } = require("expo-asset"));
  } catch {
    throw new Error("loading bundled assets in Android release builds needs expo-asset installed");
  }
  const { name, type, hash, uri } = Asset.fromModule(source);
  // fromModule marks images as "downloaded" with localUri = the drawable name (fine for <Image>, not
  // for reading bytes); an Asset without dimensions makes expo-asset copy the resource to a file.
  const asset = await new Asset({ name, type, hash, uri }).downloadAsync();
  if (!asset.localUri?.includes(":")) throw new Error(`couldn't copy the bundled asset ${name}`);
  return asset.localUri;
}

/** Fetches an asset's bytes. */
export async function loadAssetBytes(source: AssetSource): Promise<{ uri: string; bytes: ArrayBuffer }> {
  const uri = assetUri(source);
  if (!uri) throw new Error("couldn't resolve the asset (is its extension in Metro's assetExts?)");
  // In Android release builds a bundled asset resolves to a bare resource name, not a URL.
  const url = typeof source === "number" && !uri.includes(":") ? await localAssetUri(source) : uri;
  const response = await fetch(url);
  if (!response.ok && !url.startsWith("file:")) throw new Error(`HTTP ${response.status} for ${uri}`);
  return { uri, bytes: await response.arrayBuffer() };
}
