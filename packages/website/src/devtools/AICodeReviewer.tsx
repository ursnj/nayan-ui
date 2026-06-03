import Code from '@/helpers/Code';

const AICodeReviewer = () => {
  return (
    <div>
      <h2 className="text-xl mb-5">🤖 AI Code Reviewer</h2>
      <div className="mb-5">
        A CLI tool that uses <strong>Codex</strong> or <strong>Claude Code</strong> to review GitHub Pull Requests with AI-powered agentic analysis.
        It performs deep code review including bug detection, security analysis, performance checks, error handling, and test coverage.
      </div>

      <h2 className="text-xl mb-5">Installation</h2>
      <div className="mb-5">Install the AI CLI globally:</div>
      <Code language="bash" code={`npm install -g @nayan-ui/ai`} />
      <div className="mb-5 mt-5">Or use directly with npx:</div>
      <Code language="bash" code={`npx @nayan-ui/ai review <pr-url> --token ghp_xxx`} />

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
      <div className="mb-5">Review a GitHub Pull Request for code issues:</div>
      <Code language="bash" code={`nayan-ai review https://github.com/owner/repo/pull/123 --token ghp_xxx`} />

      <div className="mb-5 mt-5">Dry run (analyze without posting comments):</div>
      <Code language="bash" code={`nayan-ai review https://github.com/owner/repo/pull/123 --token ghp_xxx --dry`} />

      <div className="mb-5 mt-5">Post inline comments on files instead of summary:</div>
      <Code language="bash" code={`nayan-ai review https://github.com/owner/repo/pull/123 --token ghp_xxx --inline`} />

      <div className="mb-5 mt-5">Use Claude Code instead of Codex:</div>
      <Code language="bash" code={`nayan-ai review https://github.com/owner/repo/pull/123 --token ghp_xxx --llm claude`} />

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
              <td className="p-3 border-b border-default font-mono text-xs">-d, --dry</td>
              <td className="p-3 border-b border-default">Analyze without posting comments to GitHub</td>
            </tr>
            <tr>
              <td className="p-3 font-mono text-xs">-i, --inline</td>
              <td className="p-3">Post inline comments on files instead of summary</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-xl mb-5 mt-8">What It Checks</h2>
      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div className="bg-surface border border-default rounded-lg p-4">
          <h3 className="font-semibold mb-2">🐛 Bug Detection</h3>
          <p className="text-sm text-muted">Logic errors, null pointer issues, race conditions, and edge cases</p>
        </div>
        <div className="bg-surface border border-default rounded-lg p-4">
          <h3 className="font-semibold mb-2">🔐 Security Analysis</h3>
          <p className="text-sm text-muted">SQL injection, XSS, hardcoded secrets, and auth issues</p>
        </div>
        <div className="bg-surface border border-default rounded-lg p-4">
          <h3 className="font-semibold mb-2">⚡ Performance Checks</h3>
          <p className="text-sm text-muted">Memory leaks, N+1 queries, and unnecessary computations</p>
        </div>
        <div className="bg-surface border border-default rounded-lg p-4">
          <h3 className="font-semibold mb-2">🛡️ Error Handling</h3>
          <p className="text-sm text-muted">Missing try/catch, unhandled promises, and silent failures</p>
        </div>
        <div className="bg-surface border border-default rounded-lg p-4">
          <h3 className="font-semibold mb-2">✅ Test Coverage</h3>
          <p className="text-sm text-muted">Checks if tests are added for new functionality</p>
        </div>
        <div className="bg-surface border border-default rounded-lg p-4">
          <h3 className="font-semibold mb-2">📊 Summary Report</h3>
          <p className="text-sm text-muted">Provides an overview of all issues found in the PR</p>
        </div>
      </div>
    </div>
  );
};

export default AICodeReviewer;
