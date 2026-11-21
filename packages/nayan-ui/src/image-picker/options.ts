import type { ImagePickerOptions } from './types';
export function imageOptions(options: ImagePickerOptions) {
  const value = { quality: 1, maxDimension: 4096, selectionLimit: 1, format: 'jpeg' as const, ...options };
  if (!Number.isFinite(value.quality) || value.quality < 0 || value.quality > 1) throw new RangeError('Image quality must be between 0 and 1');
  if (!Number.isInteger(value.maxDimension) || value.maxDimension < 64 || value.maxDimension > 8192)
    throw new RangeError('Invalid image maxDimension');
  if (!Number.isInteger(value.selectionLimit) || value.selectionLimit < 1 || value.selectionLimit > 20)
    throw new RangeError('Invalid image selectionLimit');
  if (!['jpeg', 'png'].includes(value.format)) throw new TypeError('Image format must be jpeg or png');
  for (const key of ['allowsEditing', 'multiple', 'base64'] as const)
    if (value[key] !== undefined && typeof value[key] !== 'boolean') throw new TypeError(`Image ${key} must be a boolean`);
  if (value.multiple && value.allowsEditing) throw new TypeError('Editing requires a single image');
  if (value.aspect && (value.aspect.length !== 2 || value.aspect.some((n) => !Number.isFinite(n) || n <= 0 || n > 10000)))
    throw new TypeError('Invalid image aspect');
  return value;
}
