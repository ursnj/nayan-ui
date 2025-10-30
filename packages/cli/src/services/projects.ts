/**
 * Project Service - Handles project creation from templates
 * Supports interactive prompts and template downloading from GitHub
 */
import { exec } from 'child_process';
import fs from 'fs';
import ora from 'ora';
import path from 'path';
import prompts from 'prompts';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES = ['expo', 'games', 'vite'] as const;
type Template = (typeof TEMPLATES)[number];

const TEMPLATE_DESCRIPTIONS: Record<Template, string> = {
  expo: 'React Native Application with Expo & Nayan UI',
  games: 'React Native Games example project',
  vite: 'React Application with Vite and Nayan UI'
};

const GITHUB_REPO = 'https://github.com/ursnj/nayan-ui';
const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build'] as const;
const PROJECT_NAME_REGEX = /^[a-zA-Z0-9-_]+$/;

/**
 * Display available templates with descriptions
 */
export function showTemplates() {
  console.log('\nAvailable templates:\n');
  TEMPLATES.forEach(template => {
    console.log(`  ${template.padEnd(10)} - ${TEMPLATE_DESCRIPTIONS[template]}`);
  });
  console.log('\nUsage:');
  console.log('  nayan new <project-name> -t <template>\n');
  console.log('Example:');
  console.log('  nayan new my-app -t expo\n');
}

/**
 * Interactive mode for creating a new project
 * Prompts user for project name and template selection
 */
export async function interactiveNewProject() {
  console.log('\n🚀 Create a new Nayan UI project\n');

  const response = await prompts(
    [
      {
        type: 'text',
        name: 'projectName',
        message: 'What is your project name?',
        validate: (value: string) => {
          if (!value) return 'Project name is required';
          if (!PROJECT_NAME_REGEX.test(value)) {
            return 'Project name can only contain letters, numbers, hyphens, and underscores';
          }
          if (fs.existsSync(path.resolve(process.cwd(), value))) {
            return `Directory "${value}" already exists`;
          }
          return true;
        }
      },
      {
        type: 'select',
        name: 'template',
        message: 'Select a template',
        choices: TEMPLATES.map(template => ({
          title: `${template} - ${TEMPLATE_DESCRIPTIONS[template]}`,
          value: template
        })),
        initial: 0
      }
    ],
    {
      onCancel: () => {
        console.log('\n❌ Operation cancelled\n');
        process.exit(0);
      }
    }
  );

  if (response.projectName && response.template) {
    await createNewProject(response.projectName, response.template);
  }
}

/**
 * Create a new project from a template
 * @param projectName - Name of the project to create
 * @param template - Template to use (expo, games, vite)
 */
export async function createNewProject(projectName: string, template?: string) {
  const spinner = ora('Creating new project...').start();

  try {
    if (!template) {
      spinner.stop();
      console.log('\n❌ Error: Template is required\n');
      showTemplates();
      process.exit(1);
    }

    if (!TEMPLATES.includes(template as Template)) {
      spinner.fail(`Invalid template: ${template}`);
      console.log('');
      showTemplates();
      process.exit(1);
    }

    const targetDir = path.resolve(process.cwd(), projectName);

    if (fs.existsSync(targetDir)) {
      spinner.fail(`Directory already exists: ${projectName}`);
      process.exit(1);
    }

    fs.mkdirSync(targetDir, { recursive: true });

    spinner.text = `Downloading ${template} template...`;

    try {
      await execAsync(`npx degit ${GITHUB_REPO}/examples/${template} ${targetDir}`, {
        cwd: process.cwd()
      });
    } catch (error) {
      spinner.text = `Cloning ${template} template...`;
      const tempDir = path.join(process.cwd(), `.temp-${Date.now()}`);

      try {
        await execAsync(`git clone --depth 1 --filter=blob:none --sparse ${GITHUB_REPO} ${tempDir}`);
        await execAsync(`git sparse-checkout set examples/${template}`, { cwd: tempDir });

        const templateSource = path.join(tempDir, 'examples', template);
        copyDirectory(templateSource, targetDir);
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (gitError) {
        const localExamplesDir = path.resolve(__dirname, '../../../examples');
        const localTemplateDir = path.join(localExamplesDir, template);

        if (fs.existsSync(localTemplateDir)) {
          spinner.text = `Copying ${template} template from local...`;
          copyDirectory(localTemplateDir, targetDir);
        } else {
          throw new Error('Failed to download template. Please check your internet connection.');
        }
      }
    }

    spinner.succeed(`Project created successfully!`);
    console.log(`\nNext steps:`);
    console.log(`  cd ${projectName}`);
    console.log(`  npm install`);
    console.log(`  npm start`);
  } catch (error) {
    spinner.fail('Failed to create project');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Recursively copy directory contents
 * Skips excluded directories (node_modules, .git, dist, build)
 */
function copyDirectory(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    if (EXCLUDED_DIRS.includes(entry.name as any)) {
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
