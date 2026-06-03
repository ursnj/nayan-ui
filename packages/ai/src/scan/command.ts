import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import type { ScanOptions, DetectedProject, ProjectType, Vulnerability, ProjectScanResult } from '../common/types.js';
import { cloneRepoForScan, parseRepoReference } from '../common/github.js';
import { analyzeWithCodex } from '../common/codex.js';
import { analyzeWithClaude } from '../common/claude.js';
import { getScanPrompt } from './prompt.js';
import { VALID_LLM_PROVIDERS, checkLLMAvailability } from '../common/utils.js';
import { fixVulnerabilities, runFixWorkflow, type FixResult } from './fixer.js';

const PROJECT_MARKERS: Record<ProjectType, { manifest: string; lockFiles: string[] }> = {
  npm: { manifest: 'package.json', lockFiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'] },
  python: { manifest: 'requirements.txt', lockFiles: ['Pipfile.lock', 'poetry.lock'] },
  go: { manifest: 'go.mod', lockFiles: ['go.sum'] },
  rust: { manifest: 'Cargo.toml', lockFiles: ['Cargo.lock'] },
  ruby: { manifest: 'Gemfile', lockFiles: ['Gemfile.lock'] },
  php: { manifest: 'composer.json', lockFiles: ['composer.lock'] },
  java: { manifest: 'pom.xml', lockFiles: [] },
  dotnet: { manifest: '*.csproj', lockFiles: ['packages.lock.json'] },
  scala: { manifest: 'build.sbt', lockFiles: [] },
};

export const scanCommand = async (repoUrl: string, options: ScanOptions): Promise<void> => {
  try {
    if (!VALID_LLM_PROVIDERS.includes(options.llm as any)) {
      console.error(chalk.red(`Error: Invalid LLM provider '${options.llm}'. Valid options: ${VALID_LLM_PROVIDERS.join(', ')}`));
      process.exit(1);
    }

    checkLLMAvailability(options.llm);

    const repoInfo = parseRepoReference(repoUrl);

    console.log(chalk.bold.blue('\n🤖 Nayan AI - Vulnerability Scanner'));
    console.log('━'.repeat(40));
    console.log(`  Repository: ${chalk.cyan(`${repoInfo.owner}/${repoInfo.repo}`)}`);
    console.log(`  LLM:        ${chalk.cyan(options.llm === 'claude' ? 'Claude Code' : 'Codex')}`);
    if (repoInfo.githubUrl) console.log(`  GitHub:     ${chalk.cyan(repoInfo.githubUrl)}`);
    if (options.paths) console.log(`  Paths:      ${chalk.cyan(options.paths)}`);
    if (options.fix) console.log(`  Mode:       ${chalk.green('Auto-fix enabled (will create PR)')}`);
    console.log('━'.repeat(40) + '\n');

    // Clone repository
    let spinner = ora('Cloning repository...').start();
    const repo = await cloneRepoForScan(repoInfo, options.token);
    spinner.succeed('Repository cloned');

    const targetPath = repo.path;
    
    let projects: DetectedProject[];
    
    try {
      if (options.paths) {
        // User specified paths to scan for projects
        const scanPaths = options.paths.split(',').map(p => p.trim());
        projects = [];
        for (const scanPath of scanPaths) {
          const fullPath = path.join(targetPath, scanPath);
          spinner = ora(`Detecting projects in ${scanPath}...`).start();
          const detected = detectProjects(fullPath);
          if (detected.length > 0) {
            projects.push(...detected);
            spinner.succeed(`Found ${detected.length} project(s) in ${scanPath}`);
          } else {
            spinner.warn(`No supported projects found in ${scanPath}`);
          }
        }
      } else {
        // Auto-detect all projects in repo root
        spinner = ora('Detecting projects...').start();
        projects = detectProjects(targetPath);
        spinner.succeed(`Found ${projects.length} project(s)`);
      }

      if (projects.length === 0) {
        console.log(chalk.yellow('\nNo supported projects found.'));
        console.log(chalk.gray('Supported: npm, Python, Go, Rust, Ruby, PHP, Java (Maven), .NET'));
        return;
      }

      const results: ProjectScanResult[] = [];

      for (const project of projects) {
        const relativePath = path.relative(targetPath, project.path) || '.';
        spinner = ora(`Scanning ${chalk.cyan(project.type)} project: ${relativePath}`).start();

        try {
          // Native scanner is the ONLY source of truth for CVE detection
          // AI is only used for generating fixes, not finding vulnerabilities
          const nativeResult = await scanProjectNative(project);
          
          // Handle scan result - could be vulnerabilities or an error message
          if ('error' in nativeResult) {
            spinner.warn(`Native scan incomplete for ${project.type} (${relativePath})`);
            console.log(chalk.yellow(`    ⚠ ${nativeResult.error}`));
            if (nativeResult.suggestion) {
              console.log(chalk.gray(`    💡 ${nativeResult.suggestion}`));
            }
            results.push({
              projectPath: project.path,
              projectType: project.type,
              vulnerabilities: [],
            });
            continue;
          }
          
          const nativeVulns = nativeResult;
          spinner.succeed(`Native scan complete for ${project.type} (${relativePath}) - ${nativeVulns.length} vulnerabilities`);

          results.push({
            projectPath: project.path,
            projectType: project.type,
            vulnerabilities: nativeVulns,
          });

          if (nativeVulns.length === 0) {
            console.log(chalk.green(`  ✔ ${project.type} (${relativePath}): No vulnerabilities found`));
          } else {
            console.log(chalk.yellow(`  ⚠ ${project.type} (${relativePath}): ${nativeVulns.length} vulnerabilities found`));
          }
        } catch (error) {
          console.log(chalk.red(`  ✖ ${project.type} (${relativePath}): Scan failed`));
          console.log(chalk.gray(`    ${error instanceof Error ? error.message : String(error)}`));
        }
      }

      // Display results
      console.log(chalk.bold('\n📋 Scan Summary'));
      console.log('─'.repeat(41));

      if (options.format === 'json') {
        console.log(JSON.stringify(results, null, 2));
      } else {
        printScanResults(results, targetPath);
      }

      const totalVulns = results.reduce((sum, r) => sum + r.vulnerabilities.length, 0);
      if (totalVulns > 0) {
        console.log(chalk.yellow(`\n⚠ Found ${totalVulns} total vulnerabilities across ${results.length} project(s)`));

        // Generate fixes and show in summary
        console.log(chalk.bold.blue('\n🔧 Suggested Fixes'));
        console.log('─'.repeat(41));

        const fixResults: FixResult[] = [];

        for (const result of results) {
          if (result.vulnerabilities.length === 0) continue;

          const project = projects.find(p => p.path === result.projectPath);
          if (!project) continue;

          const relativePath = path.relative(targetPath, result.projectPath) || '.';
          console.log(chalk.cyan(`\n  Generating fixes for ${project.type} (${relativePath})...`));

          const fixResult = await fixVulnerabilities(project, result.vulnerabilities, options);
          if (fixResult) {
            fixResults.push(fixResult);
            console.log(chalk.green(`  ✔ Generated ${fixResult.fixes.length} fixes`));
            
            // Show fix details in summary
            printFixSummary(fixResult);
            
            if (fixResult.breakingChanges.length > 0) {
              console.log(chalk.yellow(`\n    ⚠ Potential breaking changes:`));
              fixResult.breakingChanges.forEach(c => console.log(chalk.yellow(`      - ${c}`)));
            }
          }
        }

        // Only create PR if --fix flag is used
        if (options.fix && fixResults.length > 0) {
          console.log(chalk.bold('\n📤 Creating Pull Request'));
          console.log('─'.repeat(41));
          await runFixWorkflow(targetPath, repoInfo, fixResults, options);
        } else if (fixResults.length > 0) {
          console.log(chalk.gray('\n  💡 Use --fix flag to automatically create a PR with these fixes'));
        } else {
          console.log(chalk.yellow('\n  No fixes could be generated'));
        }
      } else {
        console.log(chalk.green('\n✅ No vulnerabilities found!\n'));
      }
    } finally {
      await repo.cleanup();
    }
  } catch (error) {
    console.error(chalk.red('\nError:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

function detectProjects(rootPath: string, maxDepth: number = 5): DetectedProject[] {
  const projects: DetectedProject[] = [];
  const workspaceRoots = new Set<string>(); // Track monorepo roots to avoid duplicates
  
  // First, detect yarn/npm workspaces and pnpm workspaces at root
  const rootLockFile = findRootLockFile(rootPath);
  
  function scan(dir: string, depth: number): void {
    if (depth > maxDepth) return;
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      // Check for project markers in current directory
      for (const [type, markers] of Object.entries(PROJECT_MARKERS) as [ProjectType, { manifest: string; lockFiles: string[] }][]) {
        const manifestPattern = markers.manifest;
        
        let hasManifest = false;
        if (manifestPattern.includes('*')) {
          // Glob pattern (e.g., *.csproj)
          const ext = manifestPattern.replace('*', '');
          hasManifest = entries.some(e => e.isFile() && e.name.endsWith(ext));
        } else {
          hasManifest = entries.some(e => e.isFile() && e.name === manifestPattern);
        }
        
        if (hasManifest) {
          // For npm projects, check if this is a workspace package
          let lockFile = markers.lockFiles.find(lf => 
            entries.some(e => e.isFile() && e.name === lf)
          );
          
          // If no local lock file but we have a root lock file (monorepo), use that
          if (!lockFile && type === 'npm' && rootLockFile) {
            lockFile = path.basename(rootLockFile);
          }
          
          // Check if this is a monorepo root with workspaces
          if (type === 'npm') {
            const pkgJsonPath = path.join(dir, 'package.json');
            if (fs.existsSync(pkgJsonPath)) {
              try {
                const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
                if (pkgJson.workspaces) {
                  workspaceRoots.add(dir);
                  // Still add root project for scanning
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
          
          projects.push({
            path: dir,
            type,
            lockFile: lockFile ? (path.isAbsolute(lockFile) ? lockFile : path.join(dir, lockFile)) : 
                      (rootLockFile && type === 'npm' ? rootLockFile : undefined),
          });
        }
      }
      
      // Recurse into subdirectories (skip node_modules, vendor, etc.)
      const skipDirs = ['node_modules', 'vendor', '.git', 'dist', 'build', '__pycache__', 'venv', '.venv', 'target'];
      for (const entry of entries) {
        if (entry.isDirectory() && !skipDirs.includes(entry.name)) {
          scan(path.join(dir, entry.name), depth + 1);
        }
      }
    } catch {
      // Permission denied or other error, skip
    }
  }
  
  scan(rootPath, 0);
  return projects;
}

// Find root lock file for monorepo/workspace setups
function findRootLockFile(rootPath: string): string | undefined {
  const lockFiles = ['yarn.lock', 'package-lock.json', 'pnpm-lock.yaml', 'bun.lockb'];
  for (const lockFile of lockFiles) {
    const lockPath = path.join(rootPath, lockFile);
    if (fs.existsSync(lockPath)) {
      return lockPath;
    }
  }
  return undefined;
}

function detectProjectType(projectPath: string): DetectedProject | null {
  if (!fs.existsSync(projectPath)) return null;
  
  const stat = fs.statSync(projectPath);
  const dir = stat.isDirectory() ? projectPath : path.dirname(projectPath);
  
  try {
    const entries = fs.readdirSync(dir);
    
    for (const [type, markers] of Object.entries(PROJECT_MARKERS) as [ProjectType, { manifest: string; lockFiles: string[] }][]) {
      const manifestPattern = markers.manifest;
      
      let hasManifest = false;
      if (manifestPattern.includes('*')) {
        const ext = manifestPattern.replace('*', '');
        hasManifest = entries.some(e => e.endsWith(ext));
      } else {
        hasManifest = entries.includes(manifestPattern);
      }
      
      if (hasManifest) {
        const lockFile = markers.lockFiles.find(lf => entries.includes(lf));
        return {
          path: dir,
          type,
          lockFile: lockFile ? path.join(dir, lockFile) : undefined,
        };
      }
    }
  } catch {
    // Permission denied or other error
  }
  
  return null;
}

type ScanResult = Vulnerability[] | { error: string; suggestion?: string };

const scanProjectNative = async (project: DetectedProject): Promise<ScanResult> => {
  switch (project.type) {
    case 'npm': return scanNpm(project.path);
    case 'python': return scanPython(project.path);
    case 'go': return scanGo(project.path);
    case 'rust': return scanRust(project.path);
    case 'ruby': return scanRuby(project.path);
    case 'php': return scanPhp(project.path);
    case 'java': return await scanJava(project.path);
    case 'dotnet': return scanDotnet(project.path);
    case 'scala': return await scanScala(project.path);
    default: return [];
  }
};

const getManifestContent = (project: DetectedProject): string => {
  const manifestFiles: Record<ProjectType, string> = {
    npm: 'package.json',
    python: 'requirements.txt',
    go: 'go.mod',
    rust: 'Cargo.toml',
    ruby: 'Gemfile',
    php: 'composer.json',
    java: 'pom.xml',
    dotnet: '*.csproj',
    scala: 'build.sbt',
  };

  const manifestName = manifestFiles[project.type];
  
  if (manifestName.includes('*')) {
    const ext = manifestName.replace('*', '');
    const files = fs.readdirSync(project.path);
    const match = files.find(f => f.endsWith(ext));
    if (match) {
      return fs.readFileSync(path.join(project.path, match), 'utf-8');
    }
    return '';
  }

  const manifestPath = path.join(project.path, manifestName);
  if (fs.existsSync(manifestPath)) {
    return fs.readFileSync(manifestPath, 'utf-8');
  }

  if (project.lockFile && fs.existsSync(project.lockFile)) {
    return fs.readFileSync(project.lockFile, 'utf-8');
  }

  return '';
};

const scanProjectWithAI = async (
  project: DetectedProject,
  options: ScanOptions,
  nativeVulns: Vulnerability[] = []
): Promise<Vulnerability[]> => {
  const manifestContent = getManifestContent(project);
  if (!manifestContent) return [];

  const prompt = getScanPrompt(project.type, manifestContent.slice(0, 10000), nativeVulns);
  const llmOptions = { verbose: options.verbose };

  try {
    const issues = options.llm === 'claude'
      ? await analyzeWithClaude(project.path, prompt, llmOptions)
      : await analyzeWithCodex(project.path, prompt, llmOptions);

    return issues
      .filter((issue: any) => issue.package || issue.filename)
      .map((issue: any) => ({
        package: issue.package || issue.filename || 'unknown',
        version: issue.version || 'unknown',
        severity: mapSeverity(issue.severity || 'medium'),
        title: issue.title || issue.message || 'AI-detected vulnerability',
        description: issue.description || issue.suggestion,
        fixedIn: issue.fixedIn,
        cve: issue.cve,
      }));
  } catch (error) {
    console.log(chalk.gray(`    AI analysis failed: ${error instanceof Error ? error.message : String(error)}`));
    return [];
  }
};

const mergeVulnerabilities = (
  native: Vulnerability[],
  ai: Vulnerability[]
): Vulnerability[] => {
  const seen = new Set(native.map(v => `${v.package}@${v.version}`));
  const unique = ai.filter(v => !seen.has(`${v.package}@${v.version}`));
  return [...native, ...unique];
};

function scanNpm(projectPath: string): ScanResult {
  try {
    // Get the dependencies from this specific project's package.json
    const pkgJsonPath = path.join(projectPath, 'package.json');
    const projectDeps = new Set<string>();
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        // Collect all dependencies from this project
        for (const dep of Object.keys(pkgJson.dependencies || {})) projectDeps.add(dep);
        for (const dep of Object.keys(pkgJson.devDependencies || {})) projectDeps.add(dep);
        for (const dep of Object.keys(pkgJson.peerDependencies || {})) projectDeps.add(dep);
        for (const dep of Object.keys(pkgJson.optionalDependencies || {})) projectDeps.add(dep);
      } catch {
        // Ignore parse errors
      }
    }

    // Check for lock files - support monorepo/workspace setups
    const lockPath = path.join(projectPath, 'package-lock.json');
    const yarnLockPath = path.join(projectPath, 'yarn.lock');
    const pnpmLockPath = path.join(projectPath, 'pnpm-lock.yaml');
    
    // Also check parent directories for monorepo lock files
    let rootLockPath: string | undefined;
    let rootDir: string | undefined;
    let searchDir = projectPath;
    for (let i = 0; i < 5; i++) {
      const parentDir = path.dirname(searchDir);
      if (parentDir === searchDir) break;
      
      for (const lockFile of ['yarn.lock', 'package-lock.json', 'pnpm-lock.yaml']) {
        const parentLock = path.join(parentDir, lockFile);
        if (fs.existsSync(parentLock)) {
          rootLockPath = parentLock;
          rootDir = parentDir;
          break;
        }
      }
      if (rootLockPath) break;
      searchDir = parentDir;
    }
    
    const hasLocalLock = fs.existsSync(lockPath) || fs.existsSync(yarnLockPath) || fs.existsSync(pnpmLockPath);
    
    if (!hasLocalLock && !rootLockPath) {
      return {
        error: 'No lock file found (package-lock.json, yarn.lock, or pnpm-lock.yaml)',
        suggestion: 'Run "npm install", "yarn install", or "pnpm install" to generate a lock file for accurate vulnerability scanning'
      };
    }

    // Determine which audit command to use based on lock file type
    let auditCmd = 'npm audit --json 2>&1 || true';
    let auditCwd = projectPath;
    
    const effectiveLockPath = hasLocalLock ? 
      (fs.existsSync(yarnLockPath) ? yarnLockPath : fs.existsSync(pnpmLockPath) ? pnpmLockPath : lockPath) :
      rootLockPath;
    
    if (effectiveLockPath?.endsWith('yarn.lock')) {
      // Use yarn npm audit for yarn workspaces (yarn v2+/berry)
      // Or yarn audit for yarn v1 - try both
      auditCmd = 'yarn npm audit --json 2>&1 || yarn audit --json 2>&1 || true';
      // Run from the directory containing yarn.lock
      auditCwd = rootDir || projectPath;
      console.log(chalk.gray(`    Using yarn audit from ${path.relative(process.cwd(), auditCwd) || '.'}`));
    } else if (effectiveLockPath?.endsWith('pnpm-lock.yaml')) {
      // Use pnpm audit for pnpm workspaces
      auditCmd = 'pnpm audit --json 2>&1 || true';
      auditCwd = rootDir || projectPath;
    }

    const result = execSync(auditCmd, {
      cwd: auditCwd,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
    
    // Parse result - handle both npm and yarn audit formats
    const vulnerabilities: Vulnerability[] = [];
    const seenPackages = new Set<string>();
    
    // Yarn audit outputs newline-delimited JSON
    if (auditCmd.includes('yarn')) {
      const lines = result.split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.type === 'auditAdvisory' && entry.data?.advisory) {
            const adv = entry.data.advisory;
            const pkg = adv.module_name;
            if (seenPackages.has(pkg)) continue;
            
            // Filter: only include if this package is a dependency of the scanned project
            // Check both direct dep and if it's in the resolution path for this project
            const resolutionPath = entry.data.resolution?.path || '';
            const isRelevant = projectDeps.size === 0 || 
              projectDeps.has(pkg) || 
              [...projectDeps].some(dep => resolutionPath.includes(dep));
            
            if (!isRelevant) continue;
            seenPackages.add(pkg);
            
            vulnerabilities.push({
              package: pkg,
              version: entry.data.resolution?.path?.split('>').pop() || adv.vulnerable_versions || 'unknown',
              severity: mapSeverity(adv.severity),
              title: adv.title || 'Vulnerability found',
              description: adv.url,
              fixedIn: adv.patched_versions?.replace(/[>=<]/g, ''),
              cve: adv.cves?.[0] || adv.url?.match(/CVE-\d{4}-\d+/)?.[0],
            });
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
      return vulnerabilities;
    }
    
    // npm audit format
    let audit: any = {};
    try {
      audit = JSON.parse(result);
    } catch {
      // npm audit may return non-JSON on error
      return [];
    }
    
    if (audit.vulnerabilities) {
      for (const [pkg, data] of Object.entries(audit.vulnerabilities) as [string, any][]) {
        // Skip if we've already processed this package
        if (seenPackages.has(pkg)) continue;
        
        // Filter: only include if this package is a dependency of the scanned project
        // or if it's a transitive dependency of one of the project's deps
        const isRelevant = projectDeps.size === 0 || 
          projectDeps.has(pkg) || 
          (Array.isArray(data.via) && data.via.some((v: any) => 
            typeof v === 'string' ? projectDeps.has(v) : projectDeps.has(v?.name)
          ));
        
        if (!isRelevant) continue;
        seenPackages.add(pkg);
        
        const via = data.via?.[0];
        // Extract CVE from via object - only use name if it looks like a CVE ID
        let cve: string | undefined;
        if (typeof via === 'object') {
          if (via.cve) {
            cve = via.cve;
          } else if (via.name && /^CVE-\d{4}-\d+$/.test(via.name)) {
            cve = via.name;
          } else if (via.url) {
            const match = via.url.match(/CVE-\d{4}-\d+/);
            cve = match ? match[0] : undefined;
          }
        }
        
        // Get the actual installed version from nodes if available
        const installedVersion = audit.metadata?.dependencies?.[pkg]?.version || data.range || 'unknown';
        
        vulnerabilities.push({
          package: pkg,
          version: installedVersion,
          severity: mapSeverity(data.severity),
          title: typeof via === 'object' ? (via.title || 'Vulnerability found') : (via || 'Vulnerability found'),
          description: typeof via === 'object' ? via.url : undefined,
          fixedIn: data.fixAvailable?.version,
          cve: cve,
        });
      }
    }
    
    return vulnerabilities;
  } catch {
    return [];
  }
}

function scanPython(projectPath: string): ScanResult {
  try {
    // Try pip-audit first
    const result = execSync('pip-audit --format json 2>/dev/null || python -m pip_audit --format json 2>/dev/null || true', {
      cwd: projectPath,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
    
    if (!result.trim()) return [];
    
    const audit = JSON.parse(result);
    return audit.map((v: any) => ({
      package: v.name,
      version: v.version,
      severity: mapSeverity(v.vulns?.[0]?.fix_versions ? 'high' : 'medium'),
      title: v.vulns?.[0]?.id || 'Vulnerability found',
      description: v.vulns?.[0]?.description,
      fixedIn: v.vulns?.[0]?.fix_versions?.[0],
      cve: v.vulns?.[0]?.id,
    }));
  } catch {
    return [];
  }
}

function scanGo(projectPath: string): ScanResult {
  try {
    const result = execSync('govulncheck -json ./... 2>/dev/null || true', {
      cwd: projectPath,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
    
    if (!result.trim()) return [];
    
    const vulnerabilities: Vulnerability[] = [];
    const lines = result.split('\n').filter(l => l.trim());
    
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.vulnerability) {
          vulnerabilities.push({
            package: entry.vulnerability.module_path || 'unknown',
            version: entry.vulnerability.package_version || 'unknown',
            severity: mapSeverity('high'),
            title: entry.vulnerability.id || 'Vulnerability found',
            description: entry.vulnerability.details,
            cve: entry.vulnerability.id,
          });
        }
      } catch {
        // Skip non-JSON lines
      }
    }
    
    return vulnerabilities;
  } catch {
    return [];
  }
}

function scanRust(projectPath: string): ScanResult {
  try {
    const result = execSync('cargo audit --json 2>/dev/null || true', {
      cwd: projectPath,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
    
    if (!result.trim()) return [];
    
    const audit = JSON.parse(result);
    const vulnerabilities: Vulnerability[] = [];
    
    if (audit.vulnerabilities?.list) {
      for (const v of audit.vulnerabilities.list) {
        vulnerabilities.push({
          package: v.package?.name || 'unknown',
          version: v.package?.version || 'unknown',
          severity: mapSeverity(v.advisory?.severity || 'medium'),
          title: v.advisory?.title || 'Vulnerability found',
          description: v.advisory?.description,
          fixedIn: v.versions?.patched?.[0],
          cve: v.advisory?.id,
        });
      }
    }
    
    return vulnerabilities;
  } catch {
    return [];
  }
}

function scanRuby(projectPath: string): ScanResult {
  try {
    const result = execSync('bundle audit check --format json 2>/dev/null || true', {
      cwd: projectPath,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
    
    if (!result.trim()) return [];
    
    const audit = JSON.parse(result);
    return (audit.results || []).map((v: any) => ({
      package: v.gem?.name || 'unknown',
      version: v.gem?.version || 'unknown',
      severity: mapSeverity(v.advisory?.criticality || 'medium'),
      title: v.advisory?.title || 'Vulnerability found',
      description: v.advisory?.description,
      fixedIn: v.advisory?.patched_versions?.[0],
      cve: v.advisory?.cve,
    }));
  } catch {
    return [];
  }
}

function scanPhp(projectPath: string): ScanResult {
  try {
    const result = execSync('composer audit --format json 2>/dev/null || true', {
      cwd: projectPath,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
    
    if (!result.trim()) return [];
    
    const audit = JSON.parse(result);
    const vulnerabilities: Vulnerability[] = [];
    
    if (audit.advisories) {
      for (const [pkg, advisories] of Object.entries(audit.advisories) as [string, any[]][]) {
        for (const adv of advisories) {
          vulnerabilities.push({
            package: pkg,
            version: adv.affectedVersions || 'unknown',
            severity: mapSeverity('high'),
            title: adv.title || 'Vulnerability found',
            description: adv.link,
            cve: adv.cve,
          });
        }
      }
    }
    
    return vulnerabilities;
  } catch {
    return [];
  }
}

async function scanJava(projectPath: string): Promise<ScanResult> {
  try {
    // Check if pom.xml exists
    const pomPath = path.join(projectPath, 'pom.xml');
    if (!fs.existsSync(pomPath)) {
      return {
        error: 'No pom.xml found',
        suggestion: 'Java vulnerability scanning requires a Maven project with pom.xml'
      };
    }

    // First check if there's an existing dependency-check report
    const reportPath = path.join(projectPath, 'target', 'dependency-check-report.json');
    
    // Check if report already exists (from previous build)
    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
      const vulnerabilities: Vulnerability[] = [];
      
      for (const dep of report.dependencies || []) {
        for (const vuln of dep.vulnerabilities || []) {
          vulnerabilities.push({
            package: dep.fileName || 'unknown',
            version: dep.version || 'unknown',
            severity: mapSeverity(vuln.severity?.toLowerCase() || 'medium'),
            title: vuln.name || 'Vulnerability found',
            description: vuln.description,
            cve: vuln.name,
          });
        }
      }
      
      if (vulnerabilities.length > 0) {
        return vulnerabilities;
      }
    }

    // Run OWASP dependency-check
    console.log(chalk.gray('    Running OWASP dependency-check (this may take a few minutes on first run)...'));
    
    let mvnError: string | undefined;
    try {
      execSync('mvn org.owasp:dependency-check-maven:check -Dformat=JSON -DfailOnError=false -DautoUpdate=true', {
        cwd: projectPath,
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024,
        timeout: 900000, // 15 minutes for first-time NVD download
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (e: any) {
      mvnError = e.stderr || e.stdout || e.message || String(e);
      // Check if it's a timeout
      if (mvnError && (mvnError.includes('ETIMEDOUT') || mvnError.includes('timed out'))) {
        return {
          error: 'OWASP dependency-check timed out (NVD database download may take longer on first run)',
          suggestion: 'Run "mvn org.owasp:dependency-check-maven:check" manually first to download the NVD database'
        };
      }
      // Continue anyway - report might still have been generated
    }
    
    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
      const vulnerabilities: Vulnerability[] = [];
      
      for (const dep of report.dependencies || []) {
        for (const vuln of dep.vulnerabilities || []) {
          vulnerabilities.push({
            package: dep.fileName || 'unknown',
            version: dep.version || 'unknown',
            severity: mapSeverity(vuln.severity?.toLowerCase() || 'medium'),
            title: vuln.name || 'Vulnerability found',
            description: vuln.description,
            cve: vuln.name,
          });
        }
      }
      
      return vulnerabilities;
    }
    
    // Maven failed - try parsing pom.xml directly and check OSV database
    console.log(chalk.gray('    Maven failed, trying direct pom.xml analysis...'));
    
    const pomVulns = await scanPomXmlWithOSV(pomPath);
    if (pomVulns.length > 0) {
      return pomVulns;
    }
    
    // No vulnerabilities found via OSV
    if (mvnError && mvnError.includes('Could not resolve dependencies')) {
      return {
        error: 'Maven could not resolve dependencies (private/internal dependencies)',
        suggestion: 'Configure Maven settings.xml with your internal repository credentials, or run OWASP dependency-check locally'
      };
    }
    
    return [];
  } catch (e) {
    return {
      error: `Java scan failed: ${e instanceof Error ? e.message : String(e)}`,
      suggestion: 'Check Maven configuration and try running "mvn dependency:tree" manually'
    };
  }
}

// Parse pom.xml and check OSV database for vulnerabilities
async function scanPomXmlWithOSV(pomPath: string): Promise<Vulnerability[]> {
  try {
    const pomContent = fs.readFileSync(pomPath, 'utf-8');
    const vulnerabilities: Vulnerability[] = [];
    
    // Extract dependencies from pom.xml using regex (simple parsing)
    const dependencyRegex = /<dependency>\s*<groupId>([^<]+)<\/groupId>\s*<artifactId>([^<]+)<\/artifactId>\s*(?:<version>([^<]+)<\/version>)?/g;
    const dependencies: { groupId: string; artifactId: string; version: string }[] = [];
    
    let match;
    while ((match = dependencyRegex.exec(pomContent)) !== null) {
      dependencies.push({
        groupId: match[1].trim(),
        artifactId: match[2].trim(),
        version: match[3]?.trim() || 'unknown',
      });
    }
    
    if (dependencies.length === 0) {
      return [];
    }
    
    console.log(chalk.gray(`    Found ${dependencies.length} dependencies in pom.xml, checking OSV database...`));
    
    // Query OSV API for each dependency (batch query)
    // OSV API: https://api.osv.dev/v1/querybatch
    const queries = dependencies.map(dep => ({
      package: {
        name: `${dep.groupId}:${dep.artifactId}`,
        ecosystem: 'Maven',
      },
      version: dep.version !== 'unknown' ? dep.version : undefined,
    })).filter(q => q.version);
    
    if (queries.length === 0) {
      return [];
    }
    
    try {
      const response = await fetch('https://api.osv.dev/v1/querybatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries }),
      });
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json() as { results: Array<{ vulns?: Array<any> }> };
      
      for (let i = 0; i < data.results.length; i++) {
        const result = data.results[i];
        const dep = dependencies[i];
        
        if (result.vulns && result.vulns.length > 0) {
          for (const vuln of result.vulns) {
            vulnerabilities.push({
              package: `${dep.groupId}:${dep.artifactId}`,
              version: dep.version,
              severity: mapOSVSeverity(vuln.severity || vuln.database_specific?.severity),
              title: vuln.summary || vuln.id || 'Vulnerability found',
              description: vuln.details?.slice(0, 200),
              cve: vuln.aliases?.find((a: string) => a.startsWith('CVE-')) || vuln.id,
              fixedIn: vuln.affected?.[0]?.ranges?.[0]?.events?.find((e: any) => e.fixed)?.fixed,
            });
          }
        }
      }
    } catch {
      // OSV API failed, return empty
    }
    
    return vulnerabilities;
  } catch {
    return [];
  }
}

function mapOSVSeverity(severity: any): 'critical' | 'high' | 'medium' | 'low' {
  if (!severity) return 'medium';
  const score = typeof severity === 'object' ? severity.score : severity;
  if (typeof score === 'number') {
    if (score >= 9) return 'critical';
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }
  const s = String(score).toLowerCase();
  if (s === 'critical') return 'critical';
  if (s === 'high') return 'high';
  if (s === 'moderate' || s === 'medium') return 'medium';
  return 'low';
}

function scanDotnet(projectPath: string): ScanResult {
  try {
    const result = execSync('dotnet list package --vulnerable --format json 2>/dev/null || true', {
      cwd: projectPath,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
    
    if (!result.trim()) return [];
    
    const audit = JSON.parse(result);
    const vulnerabilities: Vulnerability[] = [];
    
    for (const project of audit.projects || []) {
      for (const framework of project.frameworks || []) {
        for (const pkg of framework.topLevelPackages || []) {
          for (const vuln of pkg.vulnerabilities || []) {
            vulnerabilities.push({
              package: pkg.id || 'unknown',
              version: pkg.resolvedVersion || 'unknown',
              severity: mapSeverity(vuln.severity?.toLowerCase() || 'medium'),
              title: vuln.advisoryurl || 'Vulnerability found',
              description: vuln.advisoryurl,
            });
          }
        }
      }
    }
    
    return vulnerabilities;
  } catch {
    return [];
  }
}

// Scan Scala projects using build.sbt and OSV database
async function scanScala(projectPath: string): Promise<ScanResult> {
  try {
    const buildSbtPath = path.join(projectPath, 'build.sbt');
    if (!fs.existsSync(buildSbtPath)) {
      return {
        error: 'No build.sbt found',
        suggestion: 'Scala vulnerability scanning requires a project with build.sbt'
      };
    }

    const buildSbtContent = fs.readFileSync(buildSbtPath, 'utf-8');
    const vulnerabilities: Vulnerability[] = [];
    
    // Extract dependencies from build.sbt
    // Common patterns: "org" %% "artifact" % "version" or "org" % "artifact" % "version"
    const dependencyRegex = /"([^"]+)"\s*%%?\s*"([^"]+)"\s*%\s*"([^"]+)"/g;
    const dependencies: { groupId: string; artifactId: string; version: string }[] = [];
    
    let match;
    while ((match = dependencyRegex.exec(buildSbtContent)) !== null) {
      dependencies.push({
        groupId: match[1].trim(),
        artifactId: match[2].trim(),
        version: match[3].trim(),
      });
    }
    
    if (dependencies.length === 0) {
      return [];
    }
    
    console.log(chalk.gray(`    Found ${dependencies.length} dependencies in build.sbt, checking OSV database...`));
    
    // Query OSV API for each dependency (batch query)
    const queries = dependencies.map(dep => ({
      package: {
        name: `${dep.groupId}:${dep.artifactId}`,
        ecosystem: 'Maven', // Scala uses Maven ecosystem for OSV
      },
      version: dep.version,
    }));
    
    try {
      const response = await fetch('https://api.osv.dev/v1/querybatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries }),
      });
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json() as { results: Array<{ vulns?: Array<any> }> };
      
      for (let i = 0; i < data.results.length; i++) {
        const result = data.results[i];
        const dep = dependencies[i];
        
        if (result.vulns && result.vulns.length > 0) {
          for (const vuln of result.vulns) {
            vulnerabilities.push({
              package: `${dep.groupId}:${dep.artifactId}`,
              version: dep.version,
              severity: mapOSVSeverity(vuln.severity || vuln.database_specific?.severity),
              title: vuln.summary || vuln.id || 'Vulnerability found',
              description: vuln.details?.slice(0, 200),
              cve: vuln.aliases?.find((a: string) => a.startsWith('CVE-')) || vuln.id,
              fixedIn: vuln.affected?.[0]?.ranges?.[0]?.events?.find((e: any) => e.fixed)?.fixed,
            });
          }
        }
      }
    } catch {
      // OSV API failed
    }
    
    return vulnerabilities;
  } catch (e) {
    return {
      error: `Scala scan failed: ${e instanceof Error ? e.message : String(e)}`,
      suggestion: 'Check build.sbt syntax'
    };
  }
}

function mapSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' {
  const s = severity?.toLowerCase() || 'medium';
  if (s === 'critical') return 'critical';
  if (s === 'high') return 'high';
  if (s === 'moderate' || s === 'medium') return 'medium';
  return 'low';
}

const printScanResults = (results: ProjectScanResult[], rootPath: string): void => {
  const totalVulns = results.reduce((sum, r) => sum + r.vulnerabilities.length, 0);

  if (totalVulns === 0) {
    console.log(chalk.green('  No vulnerabilities found in any project.'));
    return;
  }

  // Print per-project details
  for (const result of results) {
    if (result.vulnerabilities.length === 0) continue;

    const relativePath = path.relative(rootPath, result.projectPath) || '.';
    console.log(chalk.bold(`\n  📦 ${result.projectType.toUpperCase()} - ${relativePath}`));
    console.log('  ' + '─'.repeat(38));

    const bySeverity = {
      critical: result.vulnerabilities.filter(v => v.severity === 'critical'),
      high: result.vulnerabilities.filter(v => v.severity === 'high'),
      medium: result.vulnerabilities.filter(v => v.severity === 'medium'),
      low: result.vulnerabilities.filter(v => v.severity === 'low'),
    };

    if (bySeverity.critical.length > 0) {
      console.log(chalk.red.bold(`\n    🔴 Critical (${bySeverity.critical.length}):`));
      bySeverity.critical.forEach(printVulnerability);
    }

    if (bySeverity.high.length > 0) {
      console.log(chalk.red(`\n    🟠 High (${bySeverity.high.length}):`));
      bySeverity.high.forEach(printVulnerability);
    }

    if (bySeverity.medium.length > 0) {
      console.log(chalk.yellow(`\n    🟡 Medium (${bySeverity.medium.length}):`));
      bySeverity.medium.forEach(printVulnerability);
    }

    if (bySeverity.low.length > 0) {
      console.log(chalk.blue(`\n    🔵 Low (${bySeverity.low.length}):`));
      bySeverity.low.forEach(printVulnerability);
    }
  }

};

const printVulnerability = (vuln: Vulnerability): void => {
  console.log(`      ${chalk.bold(vuln.package)}@${vuln.version}`);
  console.log(chalk.gray(`        ${vuln.title}`));
  if (vuln.description && vuln.description !== vuln.title) {
    const desc = vuln.description.length > 80 ? vuln.description.slice(0, 77) + '...' : vuln.description;
    console.log(chalk.dim(`        ${desc}`));
  }
  if (vuln.cve) {
    console.log(chalk.cyan(`        CVE: ${vuln.cve}`));
  }
  if (vuln.fixedIn) {
    console.log(chalk.green(`        💡 Fix: upgrade to ${vuln.fixedIn}`));
  }
};

const printFixSummary = (fixResult: FixResult): void => {
  console.log(chalk.bold(`\n    📝 ${fixResult.summary}`));
  
  if (fixResult.fixes.length === 0) {
    console.log(chalk.gray('      No specific fixes generated'));
    return;
  }

  console.log();
  for (const fix of fixResult.fixes) {
    const icon = fix.type === 'update' ? '⬆️' : fix.type === 'remove' ? '🗑️' : '➕';
    const change = fix.type === 'update' 
      ? `${fix.from} → ${fix.to}`
      : fix.type === 'add' 
        ? fix.version 
        : 'removed';
    
    console.log(`      ${icon} ${chalk.bold(fix.package)}: ${chalk.cyan(change)}`);
    console.log(chalk.gray(`         ${fix.reason}`));
  }
};
