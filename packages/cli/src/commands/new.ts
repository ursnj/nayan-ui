/**
 * New Command - Create a new project from templates
 * Supports both interactive and non-interactive modes
 */
import { Command } from 'commander';
import { createNewProject, interactiveNewProject } from '../services/projects.js';

export function registerNewCommand(program: Command) {
  program
    .command('new [project-name]')
    .description('Create a new project from a template')
    .option('-t, --template <template>', 'Template to use (expo, games, vite)')
    .action(async (projectName?: string, options?: { template?: string }) => {
      if (!projectName) {
        await interactiveNewProject();
      } else {
        await createNewProject(projectName, options?.template);
      }
    });
}
