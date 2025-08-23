import axios from 'axios';
import { readFileSync, writeFileSync } from 'fs';
import ora from 'ora';

// Function to generate robots.txt
export const generateRobots = (allowed: string = '', disallowed: string = '', sitemap: string = '', output: string): void => {
  const spinner = ora(`Generating robots.txt for: ${output}`).start(); // Start the spinner

  // Split comma-separated values into arrays
  const disallow: string[] = disallowed ? disallowed.split(',').map(item => item.trim()) : [''];
  const allow: string[] = allowed ? allowed.split(',').map(item => item.trim()) : [];

  // Start creating the content of the robots.txt file
  let robotsContent: string = `User-agent: *\n`;

  // Add Disallow rules
  disallow.forEach((disallowPath: string) => {
    robotsContent += `Disallow: ${disallowPath}\n`;
  });

  // Add Allow rules (optional)
  allow.forEach((allowPath: string) => {
    robotsContent += `Allow: ${allowPath}\n`;
  });

  // Add Sitemap (optional)
  if (sitemap) {
    robotsContent += `Sitemap: ${sitemap}\n`;
  }

  // Write the robots.txt file to the output path
  writeFileSync(output, robotsContent);
  spinner.succeed(`robots.txt has been generated at ${output}`);
};

// Function to validate robots.txt file
export const validateRobots = async (url: string, isRemote: boolean): Promise<void> => {
  const spinner = ora(`Generating images for: ${url}`).start(); // Start the spinner

  let robotsTxtContent;

  try {
    if (isRemote) {
      const response = await axios.get(url);
      robotsTxtContent = response.data;
    } else {
      robotsTxtContent = readFileSync(url, 'utf-8');
    }

    // Check if the required fields are present
    const hasUserAgent: boolean = /User-agent:/.test(robotsTxtContent);
    const hasDisallow: boolean = /Disallow:/.test(robotsTxtContent);
    const hasSitemap: boolean = /Sitemap:/.test(robotsTxtContent);

    // Output the validation result
    if (hasUserAgent && hasDisallow && hasSitemap) {
      spinner.succeed(`Validation passed for ${url}`);
    } else {
      spinner.fail('Validation failed: Missing "User-agent" or "Disallow" or "Sitemap" directives');
    }
  } catch (error: any) {
    spinner.fail(`Error fetching or validating robots.txt: ${error.message}`);
  }
};
