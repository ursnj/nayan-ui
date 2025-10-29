import { Command } from 'commander';
import { createNewProject, interactiveNewProject } from './projects.js';

export function registerNewCommand(program: Command) {
  program
    .command('new [project-name]')
    .description('Create a new project from a template')
    .option('-t, --template <template>', 'Template to use (expo, games, vite)')
    .action(async (projectName?: string, options?: { template?: string }) => {
      // If no project name is provided, use interactive mode
      if (!projectName) {
        await interactiveNewProject();
      } else {
        // If project name is provided, use non-interactive mode
        await createNewProject(projectName, options?.template);
      }
    });
}
