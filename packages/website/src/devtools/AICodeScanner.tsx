import Code from '@/helpers/Code';

const AICodeScanner = () => {
  return (
    <div>
      <h2 className="text-xl mb-5">🛡️ AI Code Scanner</h2>
      <div className="mb-5">
        Scan GitHub repositories for package vulnerabilities using native security tools combined with AI-powered analysis. Supports auto-fix with
        automatic PR creation.
      </div>

      <h2 className="text-xl mb-5">Installation</h2>
      <div className="mb-5">Install the AI CLI globally:</div>
      <Code language="bash" code={`npm install -g @nayan-ui/ai`} />
      <div className="mb-5 mt-5">Or use directly with npx:</div>
      <Code language="bash" code={`npx @nayan-ui/ai scan <repo-url> --token ghp_xxx`} />

      <h2 className="text-xl mb-5 mt-8">Prerequisites</h2>
      <div className="mb-5">
        <strong>Codex CLI</strong> (default LLM) — login first:
      </div>
      <Code language="bash" code={`npx @openai/codex login`} />
      <div className="mb-5 mt-5">
        <strong>Claude Code CLI</strong> (optional) — if using <code>--llm claude</code>:
      </div>
      <Code language="bash" code={`claude login`} />

      <h2 className="text-xl mb-5 mt-8">Usage</h2>
      <div className="mb-5">Basic scan — detect and analyze all projects in the repo:</div>
      <Code language="bash" code={`nayan-ai scan https://github.com/owner/repo --token ghp_xxx`} />

      <div className="mb-5 mt-5">Scan specific paths in the repo:</div>
      <Code language="bash" code={`nayan-ai scan https://github.com/owner/repo --token ghp_xxx --paths packages/api,packages/web`} />

      <div className="mb-5 mt-5">Auto-fix vulnerabilities and create a PR:</div>
      <Code language="bash" code={`nayan-ai scan https://github.com/owner/repo --token ghp_xxx --fix`} />

      <div className="mb-5 mt-5">Auto-fix with custom branch name:</div>
      <Code language="bash" code={`nayan-ai scan https://github.com/owner/repo --token ghp_xxx --fix --branch nayan-ai/security-updates`} />

      <div className="mb-5 mt-5">Use Claude Code instead of Codex:</div>
      <Code language="bash" code={`nayan-ai scan https://github.com/owner/repo --token ghp_xxx --llm claude`} />

      <h2 className="text-xl mb-5 mt-8">Options</h2>
      <div className="overflow-x-auto mb-5">
        <table className="w-full text-sm border border-default rounded-lg">
          <thead>
            <tr className="bg-default/30">
              <th className="text-left p-3 border-b border-default">Option</th>
              <th className="text-left p-3 border-b border-default">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 border-b border-default font-mono text-xs">-t, --token</td>
              <td className="p-3 border-b border-default">GitHub personal access token (required)</td>
            </tr>
            <tr>
              <td className="p-3 border-b border-default font-mono text-xs">-l, --llm</td>
              <td className="p-3 border-b border-default">
                LLM provider: <code>codex</code> (default) or <code>claude</code>
              </td>
            </tr>
            <tr>
              <td className="p-3 border-b border-default font-mono text-xs">-p, --paths</td>
              <td className="p-3 border-b border-default">Comma-separated list of paths to scan for projects</td>
            </tr>
            <tr>
              <td className="p-3 border-b border-default font-mono text-xs">-f, --fix</td>
              <td className="p-3 border-b border-default">Auto-fix vulnerabilities and create a PR</td>
            </tr>
            <tr>
              <td className="p-3 font-mono text-xs">-b, --branch</td>
              <td className="p-3">Branch name for fix PR (default: nayan-ai/security-fixes-&lt;timestamp&gt;)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-xl mb-5 mt-8">Supported Project Types</h2>
      <div className="overflow-x-auto mb-5">
        <table className="w-full text-sm border border-default rounded-lg">
          <thead>
            <tr className="bg-default/30">
              <th className="text-left p-3 border-b border-default">Type</th>
              <th className="text-left p-3 border-b border-default">Manifest</th>
              <th className="text-left p-3 border-b border-default">Native Scanner</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 border-b border-default font-semibold">npm</td>
              <td className="p-3 border-b border-default font-mono text-xs">package.json</td>
              <td className="p-3 border-b border-default font-mono text-xs">npm audit</td>
            </tr>
            <tr>
              <td className="p-3 border-b border-default font-semibold">Python</td>
              <td className="p-3 border-b border-default font-mono text-xs">requirements.txt</td>
              <td className="p-3 border-b border-default font-mono text-xs">pip-audit</td>
            </tr>
            <tr>
              <td className="p-3 border-b border-default font-semibold">Go</td>
              <td className="p-3 border-b border-default font-mono text-xs">go.mod</td>
              <td className="p-3 border-b border-default font-mono text-xs">govulncheck</td>
            </tr>
            <tr>
              <td className="p-3 border-b border-default font-semibold">Rust</td>
              <td className="p-3 border-b border-default font-mono text-xs">Cargo.toml</td>
              <td className="p-3 border-b border-default font-mono text-xs">cargo audit</td>
            </tr>
            <tr>
              <td className="p-3 border-b border-default font-semibold">Ruby</td>
              <td className="p-3 border-b border-default font-mono text-xs">Gemfile</td>
              <td className="p-3 border-b border-default font-mono text-xs">bundle audit</td>
            </tr>
            <tr>
              <td className="p-3 border-b border-default font-semibold">PHP</td>
              <td className="p-3 border-b border-default font-mono text-xs">composer.json</td>
              <td className="p-3 border-b border-default font-mono text-xs">composer audit</td>
            </tr>
            <tr>
              <td className="p-3 border-b border-default font-semibold">Java</td>
              <td className="p-3 border-b border-default font-mono text-xs">pom.xml</td>
              <td className="p-3 border-b border-default font-mono text-xs">mvn dependency-check</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold">.NET</td>
              <td className="p-3 font-mono text-xs">*.csproj</td>
              <td className="p-3 font-mono text-xs">dotnet list --vulnerable</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-xl mb-5 mt-8">Auto-Fix Workflow</h2>
      <div className="mb-5">
        When using <code>--fix</code>, Nayan AI will:
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div className="bg-surface border border-default rounded-lg p-4">
          <h3 className="font-semibold mb-2">1. Analyze</h3>
          <p className="text-sm text-muted">Analyze vulnerabilities and generate fixes using AI</p>
        </div>
        <div className="bg-surface border border-default rounded-lg p-4">
          <h3 className="font-semibold mb-2">2. Create Branch</h3>
          <p className="text-sm text-muted">Create a new branch with the security fixes</p>
        </div>
        <div className="bg-surface border border-default rounded-lg p-4">
          <h3 className="font-semibold mb-2">3. Update Files</h3>
          <p className="text-sm text-muted">Update manifest files (package.json, requirements.txt, etc.)</p>
        </div>
        <div className="bg-surface border border-default rounded-lg p-4">
          <h3 className="font-semibold mb-2">4. Create PR</h3>
          <p className="text-sm text-muted">Commit, push, and create a Pull Request with detailed description</p>
        </div>
      </div>
    </div>
  );
};

export default AICodeScanner;
