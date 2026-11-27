type ImageDescriptor = Record<string, unknown>;
type ResolveImageModule = (source: number) => { uri: string; width?: number; height?: number; scale: number } | null | undefined;

/** Normalize image descriptors at the JS/Rust boundary without fetching or decoding. */
export function normalizeImageSource(source: unknown, resolveModule?: ResolveImageModule): ImageDescriptor | readonly ImageDescriptor[] | null {
  if (source == null) return null;
  if (Array.isArray(source)) {
    return source
      .map((item) => normalizeImageSource(item, resolveModule))
      .filter((item): item is ImageDescriptor => item != null && !Array.isArray(item));
  }
  if (typeof source === 'string') return { uri: source };
  if (typeof source === 'object' && 'uri' in source) return source as ImageDescriptor;
  if (typeof source === 'number' && resolveModule) {
    const asset = resolveModule(source);
    if (!asset) return { uri: '', error: 'Image asset could not be resolved' };
    return { uri: asset.uri, width: asset.width, height: asset.height, scale: asset.scale, assetModule: source };
  }
  return { uri: '', error: 'Image source must be a URI, source object or bundled asset' };
}
