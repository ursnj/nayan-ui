#!/usr/bin/env node --no-warnings
import { Command } from 'commander';
import packageJSON from '../package.json' with { type: 'json' };
import { generateRobots, validateRobots } from './robots.js';
import { generateSitemap, validateSitemap } from './sitemaps.js';
import { validateChangefreq, validateDepth, validateOutput, validateWebsite } from './utils.js';

const { name, version, description } = packageJSON;

const program = new Command();

program
  .name(name)
  .description(description)
  .version(version)
  .action(function (this: Command) {
    this.help();
  });

const create = program
  .command('create')
  .description('Create Dev Tools')
  .action(function (this: Command) {
    this.help();
  });
const validate = program
  .command('validate')
  .description('Validate Dev Tools')
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
  .option('-f, --changefreq <value>', 'Change frequency for the sitemap (always, hourly, daily, weekly, monthly, yearly, never)', validateChangefreq)
  .action(options => {
    const website = options.website || '';
    const replacer = options.replacer || '';
    const depth = options.depth || 10;
    const output = options.output || './sitemap.xml';
    const changefreq = options.changefreq || 'daily';
    generateSitemap(website, replacer, depth, output, changefreq);
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

export { generateSitemap, validateSitemap, generateRobots, validateRobots };

program.parse(process.argv);
