import { NView, NText } from 'nayan-ui/components';
import { H2_DOC, H3_DOC } from "@/design/system";
import Code from "@/components/helpers/Code";

const AICodeScanner = () => {
  return (
    <NView tag="div">
      <NView tag="div" className="mb-10 max-w-3xl text-base leading-relaxed text-muted">
        Scan GitHub repositories for package vulnerabilities using native security tools combined
        with AI-powered analysis. Supports auto-fix with automatic PR creation.
      </NView>

      <NText tag="h2" className={H2_DOC}>Installation</NText>
      <NView tag="div" className="mb-5">Install the AI CLI globally:</NView>
      <Code language="bash" code={`npm install -g @nayan-ui/ai`} />
      <NView tag="div" className="mb-5 mt-5">Or use directly with npx:</NView>
      <Code language="bash" code={`npx @nayan-ui/ai scan <repo-url> --token ghp_xxx`} />

      <NText tag="h2" className={H2_DOC}>Prerequisites</NText>
      <NView tag="div" className="mb-5">
        <NText tag="strong">Codex CLI</NText> (default LLM) — login first:
      </NView>
      <Code language="bash" code={`npx @openai/codex login`} />
      <NView tag="div" className="mb-5 mt-5">
        <NText tag="strong">Claude Code CLI</NText> (optional) — if using <NText tag="code">--llm claude</NText>:
      </NView>
      <Code language="bash" code={`claude login`} />

      <NText tag="h2" className={H2_DOC}>Usage</NText>
      <NView tag="div" className="mb-5">Basic scan — detect and analyze all projects in the repo:</NView>
      <Code language="bash" code={`nayan-ai scan https://github.com/owner/repo --token ghp_xxx`} />

      <NView tag="div" className="mb-5 mt-5">Scan specific paths in the repo:</NView>
      <Code
        language="bash"
        code={`nayan-ai scan https://github.com/owner/repo --token ghp_xxx --paths packages/api,packages/web`}
      />

      <NView tag="div" className="mb-5 mt-5">Auto-fix vulnerabilities and create a PR:</NView>
      <Code
        language="bash"
        code={`nayan-ai scan https://github.com/owner/repo --token ghp_xxx --fix`}
      />

      <NView tag="div" className="mb-5 mt-5">Auto-fix with custom branch name:</NView>
      <Code
        language="bash"
        code={`nayan-ai scan https://github.com/owner/repo --token ghp_xxx --fix --branch nayan-ai/security-updates`}
      />

      <NView tag="div" className="mb-5 mt-5">Use Claude Code instead of Codex:</NView>
      <Code
        language="bash"
        code={`nayan-ai scan https://github.com/owner/repo --token ghp_xxx --llm claude`}
      />

      <NText tag="h2" className={H2_DOC}>Options</NText>
      <NView tag="div" className="overflow-x-auto mb-5">
        <NView tag="table" className="w-full text-sm border border-default rounded-lg">
          <NView tag="thead">
            <NView tag="tr" className="bg-default/30">
              <NView tag="th" className="text-left p-3 border-b border-default">Option</NView>
              <NView tag="th" className="text-left p-3 border-b border-default">Description</NView>
            </NView>
          </NView>
          <NView tag="tbody">
            <NView tag="tr">
              <NView tag="td" className="p-3 border-b border-default font-mono text-xs">-t, --token</NView>
              <NView tag="td" className="p-3 border-b border-default">
                GitHub personal access token (required)
              </NView>
            </NView>
            <NView tag="tr">
              <NView tag="td" className="p-3 border-b border-default font-mono text-xs">-l, --llm</NView>
              <NView tag="td" className="p-3 border-b border-default">
                LLM provider: <NText tag="code">codex</NText> (default) or <NText tag="code">claude</NText>
              </NView>
            </NView>
            <NView tag="tr">
              <NView tag="td" className="p-3 border-b border-default font-mono text-xs">-p, --paths</NView>
              <NView tag="td" className="p-3 border-b border-default">
                Comma-separated list of paths to scan for projects
              </NView>
            </NView>
            <NView tag="tr">
              <NView tag="td" className="p-3 border-b border-default font-mono text-xs">-f, --fix</NView>
              <NView tag="td" className="p-3 border-b border-default">
                Auto-fix vulnerabilities and create a PR
              </NView>
            </NView>
            <NView tag="tr">
              <NView tag="td" className="p-3 font-mono text-xs">-b, --branch</NView>
              <NView tag="td" className="p-3">
                Branch name for fix PR (default: nayan-ai/security-fixes-&lt;timestamp&gt;)
              </NView>
            </NView>
          </NView>
        </NView>
      </NView>

      <NText tag="h2" className={H2_DOC}>Supported Project Types</NText>
      <NView tag="div" className="overflow-x-auto mb-5">
        <NView tag="table" className="w-full text-sm border border-default rounded-lg">
          <NView tag="thead">
            <NView tag="tr" className="bg-default/30">
              <NView tag="th" className="text-left p-3 border-b border-default">Type</NView>
              <NView tag="th" className="text-left p-3 border-b border-default">Manifest</NView>
              <NView tag="th" className="text-left p-3 border-b border-default">Native Scanner</NView>
            </NView>
          </NView>
          <NView tag="tbody">
            <NView tag="tr">
              <NView tag="td" className="p-3 border-b border-default font-semibold">npm</NView>
              <NView tag="td" className="p-3 border-b border-default font-mono text-xs">package.json</NView>
              <NView tag="td" className="p-3 border-b border-default font-mono text-xs">npm audit</NView>
            </NView>
            <NView tag="tr">
              <NView tag="td" className="p-3 border-b border-default font-semibold">Python</NView>
              <NView tag="td" className="p-3 border-b border-default font-mono text-xs">requirements.txt</NView>
              <NView tag="td" className="p-3 border-b border-default font-mono text-xs">pip-audit</NView>
            </NView>
            <NView tag="tr">
              <NView tag="td" className="p-3 border-b border-default font-semibold">Go</NView>
              <NView tag="td" className="p-3 border-b border-default font-mono text-xs">go.mod</NView>
              <NView tag="td" className="p-3 border-b border-default font-mono text-xs">govulncheck</NView>
            </NView>
            <NView tag="tr">
              <NView tag="td" className="p-3 border-b border-default font-semibold">Rust</NView>
              <NView tag="td" className="p-3 border-b border-default font-mono text-xs">Cargo.toml</NView>
              <NView tag="td" className="p-3 border-b border-default font-mono text-xs">cargo audit</NView>
            </NView>
            <NView tag="tr">
              <NView tag="td" className="p-3 border-b border-default font-semibold">Ruby</NView>
              <NView tag="td" className="p-3 border-b border-default font-mono text-xs">Gemfile</NView>
              <NView tag="td" className="p-3 border-b border-default font-mono text-xs">bundle audit</NView>
            </NView>
            <NView tag="tr">
              <NView tag="td" className="p-3 border-b border-default font-semibold">PHP</NView>
              <NView tag="td" className="p-3 border-b border-default font-mono text-xs">composer.json</NView>
              <NView tag="td" className="p-3 border-b border-default font-mono text-xs">composer audit</NView>
            </NView>
            <NView tag="tr">
              <NView tag="td" className="p-3 border-b border-default font-semibold">Java</NView>
              <NView tag="td" className="p-3 border-b border-default font-mono text-xs">pom.xml</NView>
              <NView tag="td" className="p-3 border-b border-default font-mono text-xs">
                mvn dependency-check
              </NView>
            </NView>
            <NView tag="tr">
              <NView tag="td" className="p-3 font-semibold">.NET</NView>
              <NView tag="td" className="p-3 font-mono text-xs">*.csproj</NView>
              <NView tag="td" className="p-3 font-mono text-xs">dotnet list --vulnerable</NView>
            </NView>
          </NView>
        </NView>
      </NView>

      <NText tag="h2" className={H2_DOC}>Auto-Fix Workflow</NText>
      <NView tag="div" className="mb-5">
        When using <NText tag="code">--fix</NText>, Nayan AI will:
      </NView>
      <NView tag="div" className="grid sm:grid-cols-2 gap-4 mb-5">
        <NView tag="div" className="bg-surface border border-default rounded-lg p-4">
          <NText tag="h3" className={H3_DOC}>1. Analyze</NText>
          <NText tag="p" className="text-sm text-muted">Analyze vulnerabilities and generate fixes using AI</NText>
        </NView>
        <NView tag="div" className="bg-surface border border-default rounded-lg p-4">
          <NText tag="h3" className={H3_DOC}>2. Create Branch</NText>
          <NText tag="p" className="text-sm text-muted">Create a new branch with the security fixes</NText>
        </NView>
        <NView tag="div" className="bg-surface border border-default rounded-lg p-4">
          <NText tag="h3" className={H3_DOC}>3. Update Files</NText>
          <NText tag="p" className="text-sm text-muted">
            Update manifest files (package.json, requirements.txt, etc.)
          </NText>
        </NView>
        <NView tag="div" className="bg-surface border border-default rounded-lg p-4">
          <NText tag="h3" className={H3_DOC}>4. Create PR</NText>
          <NText tag="p" className="text-sm text-muted">
            Commit, push, and create a Pull Request with detailed description
          </NText>
        </NView>
      </NView>
    </NView>
  );
};

export default AICodeScanner;
