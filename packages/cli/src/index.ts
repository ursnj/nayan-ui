#!/usr/bin/env node --no-warnings
/**
 * Nayan UI CLI - Command Line Interface
 * Main entry point for the CLI application
 */
import { Command } from 'commander';
import packageJSON from '../package.json' with { type: 'json' };
import { registerCreateCommands } from './commands/create.js';
import { registerNewCommand } from './commands/new.js';
import { registerValidateCommands } from './commands/validate.js';
import { generateRobots, validateRobots } from './services/robots.js';
import { generateSitemap, validateSitemap } from './services/sitemaps.js';

const { name, version, description } = packageJSON;
const program = new Command();

program
  .name(name)
  .description(description)
  .version(version)
  .action(function (this: Command) {
    this.help();
  });

registerNewCommand(program);
registerCreateCommands(program);
registerValidateCommands(program);

export { generateRobots, generateSitemap, validateRobots, validateSitemap };

program.parse(process.argv);
