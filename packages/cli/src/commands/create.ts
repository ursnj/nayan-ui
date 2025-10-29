import { Command } from 'commander';
import { generateRobots } from '../services/robots.js';
import { generateSitemap } from '../services/sitemaps.js';
import { validateChangefreq, validateDepth, validateOutput, validateWebsite } from '../utils.js';

export function registerCreateCommands(program: Command) {
  const create = program
    .command('create')
    .description('Create Dev Tools')
    .action(function (this: Command) {
      this.help();
    });

  create
    .command('sitemap')
    .description('Create a sitemap for the given website')
    .option('-w, --website <url>', 'The URL of the website to crawl', validateWebsite)
    .option('-r, --replacer <url>', 'The URL of the website to be replaced', validateWebsite)
    .option('-d, --depth <number>', 'Depth of the website to crawl', validateDepth)
    .option('-o, --output <path>', 'Output path for the sitemap.xml', validateOutput)
    .option(
      '-f, --changefreq <value>',
      'Change frequency for the sitemap (always, hourly, daily, weekly, monthly, yearly, never)',
      validateChangefreq
    )
    .action(options => {
      const website = options.website || '';
      const replacer = options.replacer || '';
      const depth = options.depth || 10;
      const output = options.output || './sitemap.xml';
      const changefreq = options.changefreq || 'daily';
      generateSitemap(website, replacer, depth, output, changefreq);
    });

  create
    .command('robots')
    .description('Create robots.txt for your website.')
    .option('-a, --allowed <path>', 'Allowed paths for the robots.txt', validateOutput)
    .option('-d, --disallowed <path>', 'Disallowed paths for the robots.txt', validateOutput)
    .option('-s, --sitemap <path>', 'Sitemap url for the robots.txt', validateWebsite)
    .option('-o, --output <path>', 'Output path for the robots.txt', validateOutput)
    .action(options => {
      const allowed = options.allowed || '';
      const disallowed = options.disallowed || '';
      const sitemap = options.sitemap || '';
      const output = options.output || './robots.txt';
      generateRobots(allowed, disallowed, sitemap, output);
    });
}
