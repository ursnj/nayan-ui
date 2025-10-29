/**
 * Utility Service - Validation functions for CLI options
 */
import { existsSync } from 'fs';
import { URL } from 'url';

/**
 * Validate depth is a positive integer
 */
export const validateDepth = (depth: string) => {
  const parsedDepth = parseInt(depth, 10);
  if (isNaN(parsedDepth) || parsedDepth < 1) {
    throw new Error('Depth must be a positive integer greater than 0.');
  }
  return parsedDepth;
};

/**
 * Validate changefreq value for sitemap
 */
export const validateChangefreq = (changefreq: string) => {
  const validOptions = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
  if (!validOptions.includes(changefreq)) {
    throw new Error(`Invalid changefreq value. Accepted values are: ${validOptions.join(', ')}`);
  }
  return changefreq;
};

/**
 * Validate website URL format
 */
export const validateWebsite = (website: string) => {
  try {
    new URL(website);
    return website;
  } catch (error) {
    throw new Error('Invalid website URL.');
  }
};

/**
 * Validate output path and check if directory exists
 */
export const validateOutput = (output: string) => {
  const pathParts = output.split('/');
  const dirPath = pathParts.slice(0, -1).join('/');
  if (dirPath && !existsSync(dirPath)) {
    throw new Error(`The directory ${dirPath} does not exist.`);
  }
  return output;
};
