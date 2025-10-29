#!/usr/bin/env node --no-warnings
import { Command } from 'commander';
import packageJSON from '../package.json' with { type: 'json' };
import { registerCreateCommands } from './create.js';
import { registerNewCommand } from './new.js';
import { generateRobots, validateRobots } from './robots.js';
import { generateSitemap, validateSitemap } from './sitemaps.js';
import { registerValidateCommands } from './validate.js';

const { name, version, description } = packageJSON;

const program = new Command();

program
  .name(name)
  .description(description)
  .version(version)
  .action(function (this: Command) {
    this.help();
  });

// Register all commands
registerNewCommand(program);
registerCreateCommands(program);
registerValidateCommands(program);

export { generateRobots, generateSitemap, validateRobots, validateSitemap };

program.parse(process.argv);
