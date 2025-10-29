import { Command } from 'commander';
import { validateRobots } from './robots.js';
import { validateSitemap } from './sitemaps.js';
import { validateOutput } from './utils.js';

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
    .option('-ir, --isremote <path>', 'Pass true if robots.txt is hosted somewhere.', validateOutput)
    .action(options => {
      const input = options.input || './sitemap.xml';
      const isRemote = options.isremote || false;
      validateSitemap(input, isRemote);
    });

  validate
    .command('robots')
    .description('Validate robots.txt for your website.')
    .option('-i, --input <path>', 'Input path for the robots.txt', validateOutput)
    .option('-ir, --isremote <path>', 'Pass true if robots.txt is hosted somewhere.', validateOutput)
    .action(options => {
      const input = options.input || './robots.txt';
      const isRemote = options.isremote || false;
      validateRobots(input, isRemote);
    });
}
