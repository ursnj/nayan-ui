// Loads asset bytes for the engine: `require("./file.ext")` assets (resolved by the bundler) or URIs.
import { Image } from "react-native";

/** A `require("./file.ext")` asset, or a URI (http(s):// or file://). */
export type AssetSource = number | string;

/** The URI an asset resolves to (a Metro dev-server URL in development, a bundle path in release). */
export function assetUri(source: AssetSource): string | undefined {
  return typeof source === "number" ? Image.resolveAssetSource(source)?.uri : source;
}

/** Fetches an asset's bytes. */
export async function loadAssetBytes(source: AssetSource): Promise<{ uri: string; bytes: ArrayBuffer }> {
  const uri = assetUri(source);
  if (!uri) throw new Error("couldn't resolve the asset (is its extension in Metro's assetExts?)");
  const response = await fetch(uri);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${uri}`);
  return { uri, bytes: await response.arrayBuffer() };
}
