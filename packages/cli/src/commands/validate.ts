/**
 * Validate Commands - Validate existing sitemaps and robots.txt files
 */
import { Command } from 'commander';
import { validateRobots } from '../services/robots.js';
import { validateSitemap } from '../services/sitemaps.js';
import { validateOutput } from '../services/utils.js';

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
    .option('-i, --input <path>', 'Input path for the sitemap.xml', validateOutput)
    .option('-ir, --isremote <path>', 'Set to true if sitemap is hosted remotely', validateOutput)
    .action(options => {
      const input = options.input || './sitemap.xml';
      const isRemote = options.isremote || false;
      validateSitemap(input, isRemote);
    });

  validate
    .command('robots')
    .description('Validate robots.txt for your website')
    .option('-i, --input <path>', 'Input path for the robots.txt', validateOutput)
    .option('-ir, --isremote <path>', 'Set to true if robots.txt is hosted remotely', validateOutput)
    .action(options => {
      const input = options.input || './robots.txt';
      const isRemote = options.isremote || false;
      validateRobots(input, isRemote);
    });
}
