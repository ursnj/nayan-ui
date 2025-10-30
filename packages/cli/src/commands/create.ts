/**
 * Create Commands - Generate sitemaps and robots.txt files
 */
import { Command } from 'commander';
import { generateRobots } from '../services/robots.js';
import { generateSitemap } from '../services/sitemaps.js';
import { validateChangefreq, validateDepth, validateOutput, validateWebsite } from '../services/utils.js';

const DEFAULT_VALUES = {
  SITEMAP_DEPTH: 10,
  SITEMAP_OUTPUT: './sitemap.xml',
  SITEMAP_CHANGEFREQ: 'daily',
  ROBOTS_OUTPUT: './robots.txt'
} as const;

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
    .option('-w, --website <url>', 'Website URL to crawl', validateWebsite)
    .option('-r, --replacer <url>', 'URL to replace in final sitemap', validateWebsite)
    .option('-d, --depth <number>', 'Maximum crawl depth', validateDepth)
    .option('-o, --output <path>', 'Output file path', validateOutput)
    .option('-f, --changefreq <value>', 'Change frequency (always, hourly, daily, weekly, monthly, yearly, never)', validateChangefreq)
    .action(options => {
      generateSitemap(
        options.website || '',
        options.replacer || '',
        options.depth || DEFAULT_VALUES.SITEMAP_DEPTH,
        options.output || DEFAULT_VALUES.SITEMAP_OUTPUT,
        options.changefreq || DEFAULT_VALUES.SITEMAP_CHANGEFREQ
      );
    });

  create
    .command('robots')
    .description('Create robots.txt for your website')
    .option('-a, --allowed <path>', 'Comma-separated allowed paths', validateOutput)
    .option('-d, --disallowed <path>', 'Comma-separated disallowed paths', validateOutput)
    .option('-s, --sitemap <path>', 'Sitemap URL', validateWebsite)
    .option('-o, --output <path>', 'Output file path', validateOutput)
    .action(options => {
      generateRobots(options.allowed || '', options.disallowed || '', options.sitemap || '', options.output || DEFAULT_VALUES.ROBOTS_OUTPUT);
    });
}
