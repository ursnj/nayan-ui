/**
 * Validate Commands - Validate existing sitemaps and robots.txt files
 */
import { Command } from 'commander';
import { validateRobots } from '../services/robots.js';
import { validateSitemap } from '../services/sitemaps.js';
import { validateOutput } from '../services/utils.js';

const DEFAULT_VALUES = {
  SITEMAP_INPUT: './sitemap.xml',
  ROBOTS_INPUT: './robots.txt'
} as const;

export function registerValidateCommands(program: Command) {
  const validate = program
    .command('validate')
    .description('Validate Dev Tools')
    .action(function (this: Command) {
      this.help();
    });

  validate
    .command('sitemap')
    .description('Validate an existing sitemap')
    .option('-i, --input <path>', 'Input path or URL to sitemap.xml', validateOutput)
    .option('-ir, --isremote', 'Specify if sitemap is hosted remotely')
    .action(options => {
      validateSitemap(options.input || DEFAULT_VALUES.SITEMAP_INPUT, Boolean(options.isremote));
    });

  validate
    .command('robots')
    .description('Validate robots.txt for your website')
    .option('-i, --input <path>', 'Input path or URL to robots.txt', validateOutput)
    .option('-ir, --isremote', 'Specify if robots.txt is hosted remotely')
    .action(options => {
      validateRobots(options.input || DEFAULT_VALUES.ROBOTS_INPUT, Boolean(options.isremote));
    });
}
