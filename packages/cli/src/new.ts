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

const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
  expo: 'React Native Application with Expo & Nayan UI',
  games: 'React Native Games example project',
  vite: 'React Application with Vite and Nayan UI'
};

const GITHUB_REPO = 'https://github.com/ursnj/nayan-ui';
const GITHUB_RAW = 'https://raw.githubusercontent.com/ursnj/nayan-ui/main';

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
          if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
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

export async function createNewProject(projectName: string, template?: string) {
  const spinner = ora('Creating new project...').start();

  try {
    // Check if template is provided
    if (!template) {
      spinner.stop();
      console.log('\n❌ Error: Template is required\n');
      showTemplates();
      process.exit(1);
    }

    // Validate template
    if (!TEMPLATES.includes(template as Template)) {
      spinner.fail(`Invalid template: ${template}`);
      console.log('');
      showTemplates();
      process.exit(1);
    }

    // Create target directory
    const targetDir = path.resolve(process.cwd(), projectName);

    // Check if target directory already exists
    if (fs.existsSync(targetDir)) {
      spinner.fail(`Directory already exists: ${projectName}`);
      process.exit(1);
    }

    // Create the target directory
    fs.mkdirSync(targetDir, { recursive: true });

    // Check if git is available and use degit for faster cloning
    spinner.text = `Downloading ${template} template...`;

    try {
      // Try to use degit first (faster)
      await execAsync(`npx degit ${GITHUB_REPO}/examples/${template} ${targetDir}`, {
        cwd: process.cwd()
      });
    } catch (error) {
      // Fallback to git clone if degit fails
      spinner.text = `Cloning ${template} template...`;
      const tempDir = path.join(process.cwd(), `.temp-${Date.now()}`);

      try {
        await execAsync(`git clone --depth 1 --filter=blob:none --sparse ${GITHUB_REPO} ${tempDir}`);
        await execAsync(`git sparse-checkout set examples/${template}`, { cwd: tempDir });

        // Copy the template to target directory
        const templateSource = path.join(tempDir, 'examples', template);
        copyDirectory(templateSource, targetDir);

        // Clean up temp directory
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (gitError) {
        // If both methods fail, try local fallback
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

function copyDirectory(src: string, dest: string) {
  // Create destination directory
  fs.mkdirSync(dest, { recursive: true });

  // Read all files and directories in source
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Skip node_modules, .git, and other common directories
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'build') {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
