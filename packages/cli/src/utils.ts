import { existsSync } from 'fs';
import { URL } from 'url';

// Helper function to validate depth is a positive integer
export const validateDepth = (depth: string) => {
  const parsedDepth = parseInt(depth, 10);
  if (isNaN(parsedDepth) || parsedDepth < 1) {
    throw new Error('Depth must be a positive integer greater than 0.');
  }
  return parsedDepth;
};

// Helper function to validate changefreq value
export const validateChangefreq = (changefreq: string) => {
  const validOptions = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
  if (!validOptions.includes(changefreq)) {
    throw new Error(`Invalid changefreq value. Accepted values are: ${validOptions.join(', ')}`);
  }
  return changefreq;
};

// Helper function to validate website URL
export const validateWebsite = (website: string) => {
  try {
    new URL(website);
    return website;
  } catch (error) {
    throw new Error('Invalid website URL.');
  }
};

// Helper function to validate output path (for example, it checks if the directory exists)
export const validateOutput = (output: string) => {
  const pathParts = output.split('/');
  const dirPath = pathParts.slice(0, -1).join('/');
  if (dirPath && !existsSync(dirPath)) {
    throw new Error(`The directory ${dirPath} does not exist.`);
  }
  return output;
};
