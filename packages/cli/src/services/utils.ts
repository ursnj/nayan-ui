/**
 * Utility Service - Validation functions for CLI options
 */
import { existsSync } from 'fs';
import { URL } from 'url';

const VALID_CHANGEFREQ = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'] as const;
const MIN_DEPTH = 1;

/**
 * Validate depth is a positive integer
 * @param depth - Depth value as string
 * @returns Parsed depth as number
 * @throws Error if depth is invalid
 */
export const validateDepth = (depth: string): number => {
  const parsedDepth = parseInt(depth, 10);
  if (isNaN(parsedDepth) || parsedDepth < MIN_DEPTH) {
    throw new Error(`Depth must be a positive integer greater than or equal to ${MIN_DEPTH}`);
  }
  return parsedDepth;
};

/**
 * Validate changefreq value for sitemap
 * @param changefreq - Change frequency value
 * @returns Validated changefreq
 * @throws Error if changefreq is invalid
 */
export const validateChangefreq = (changefreq: string): string => {
  if (!VALID_CHANGEFREQ.includes(changefreq as any)) {
    throw new Error(`Invalid changefreq. Accepted values: ${VALID_CHANGEFREQ.join(', ')}`);
  }
  return changefreq;
};

/**
 * Validate website URL format
 * @param website - Website URL
 * @returns Validated URL
 * @throws Error if URL is invalid
 */
export const validateWebsite = (website: string): string => {
  try {
    new URL(website);
    return website;
  } catch {
    throw new Error(`Invalid URL format: ${website}`);
  }
};

/**
 * Validate output path and check if directory exists
 * @param output - Output file path
 * @returns Validated path
 * @throws Error if directory doesn't exist
 */
export const validateOutput = (output: string): string => {
  const pathParts = output.split('/');
  const dirPath = pathParts.slice(0, -1).join('/');

  if (dirPath && !existsSync(dirPath)) {
    throw new Error(`Directory does not exist: ${dirPath}`);
  }

  return output;
};
