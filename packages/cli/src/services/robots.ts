/**
 * Robots Service - Generate and validate robots.txt files
 */
import axios from 'axios';
import { readFileSync, writeFileSync } from 'fs';
import ora from 'ora';

/**
 * Generate robots.txt file with specified rules
 * @param allowed - Comma-separated list of allowed paths
 * @param disallowed - Comma-separated list of disallowed paths
 * @param sitemap - Sitemap URL to include
 * @param output - Output file path
 */
export const generateRobots = (allowed: string = '', disallowed: string = '', sitemap: string = '', output: string): void => {
  const spinner = ora(`Generating robots.txt for: ${output}`).start();

  const disallow: string[] = disallowed ? disallowed.split(',').map(item => item.trim()) : [''];
  const allow: string[] = allowed ? allowed.split(',').map(item => item.trim()) : [];

  let robotsContent = 'User-agent: *\n';

  disallow.forEach(path => {
    robotsContent += `Disallow: ${path}\n`;
  });

  allow.forEach(path => {
    robotsContent += `Allow: ${path}\n`;
  });

  if (sitemap) {
    robotsContent += `Sitemap: ${sitemap}\n`;
  }

  writeFileSync(output, robotsContent);
  spinner.succeed(`robots.txt has been generated at ${output}`);
};

/**
 * Validate robots.txt file format and required directives
 * @param url - URL or file path to robots.txt
 * @param isRemote - Whether the file is hosted remotely
 */
export const validateRobots = async (url: string, isRemote: boolean): Promise<void> => {
  const spinner = ora(`Validating robots.txt: ${url}`).start();

  try {
    const robotsTxtContent = isRemote ? (await axios.get(url)).data : readFileSync(url, 'utf-8');

    const hasUserAgent = /User-agent:/i.test(robotsTxtContent);
    const hasDisallow = /Disallow:/i.test(robotsTxtContent);
    const hasSitemap = /Sitemap:/i.test(robotsTxtContent);

    if (hasUserAgent && hasDisallow && hasSitemap) {
      spinner.succeed(`Validation passed for ${url}`);
    } else {
      const missing = [];
      if (!hasUserAgent) missing.push('User-agent');
      if (!hasDisallow) missing.push('Disallow');
      if (!hasSitemap) missing.push('Sitemap');
      spinner.fail(`Validation failed: Missing directives - ${missing.join(', ')}`);
    }
  } catch (error: any) {
    spinner.fail(`Error validating robots.txt: ${error.message}`);
  }
};
