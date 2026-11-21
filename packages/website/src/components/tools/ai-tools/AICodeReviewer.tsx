import { NView, NText } from 'nayan-ui/components';
import { H2_DOC, H3_DOC } from "@/design/system";
import Code from "@/components/helpers/Code";

const AICodeReviewer = () => {
  return (
    <NView tag="div">
      <NView tag="div" className="mb-10 max-w-3xl text-base leading-relaxed text-muted">
        A CLI tool that uses <NText tag="strong">Codex</NText> or <NText tag="strong">Claude Code</NText> to review GitHub
        Pull Requests with AI-powered agentic analysis. It performs deep code review including bug
        detection, security analysis, performance checks, error handling, and test coverage.
      </NView>

      <NText tag="h2" className={H2_DOC}>Installation</NText>
      <NView tag="div" className="mb-5">Install the AI CLI globally:</NView>
      <Code language="bash" code={`npm install -g @nayan-ui/ai`} />
      <NView tag="div" className="mb-5 mt-5">Or use directly with npx:</NView>
      <Code language="bash" code={`npx @nayan-ui/ai review <pr-url> --token ghp_xxx`} />

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
      <NView tag="div" className="mb-5">Review a GitHub Pull Request for code issues:</NView>
      <Code
        language="bash"
        code={`nayan-ai review https://github.com/owner/repo/pull/123 --token ghp_xxx`}
      />

      <NView tag="div" className="mb-5 mt-5">Dry run (analyze without posting comments):</NView>
      <Code
        language="bash"
        code={`nayan-ai review https://github.com/owner/repo/pull/123 --token ghp_xxx --dry`}
      />

      <NView tag="div" className="mb-5 mt-5">Post inline comments on files instead of summary:</NView>
      <Code
        language="bash"
        code={`nayan-ai review https://github.com/owner/repo/pull/123 --token ghp_xxx --inline`}
      />

      <NView tag="div" className="mb-5 mt-5">Use Claude Code instead of Codex:</NView>
      <Code
        language="bash"
        code={`nayan-ai review https://github.com/owner/repo/pull/123 --token ghp_xxx --llm claude`}
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
              <NView tag="td" className="p-3 border-b border-default font-mono text-xs">-d, --dry</NView>
              <NView tag="td" className="p-3 border-b border-default">
                Analyze without posting comments to GitHub
              </NView>
            </NView>
            <NView tag="tr">
              <NView tag="td" className="p-3 font-mono text-xs">-i, --inline</NView>
              <NView tag="td" className="p-3">Post inline comments on files instead of summary</NView>
            </NView>
          </NView>
        </NView>
      </NView>

      <NText tag="h2" className={H2_DOC}>What It Checks</NText>
      <NView tag="div" className="grid sm:grid-cols-2 gap-4 mb-5">
        <NView tag="div" className="bg-surface border border-default rounded-lg p-4">
          <NText tag="h3" className={H3_DOC}>Bug Detection</NText>
          <NText tag="p" className="text-sm text-muted">
            Logic errors, null pointer issues, race conditions, and edge cases
          </NText>
        </NView>
        <NView tag="div" className="bg-surface border border-default rounded-lg p-4">
          <NText tag="h3" className={H3_DOC}>Security Analysis</NText>
          <NText tag="p" className="text-sm text-muted">
            SQL injection, XSS, hardcoded secrets, and auth issues
          </NText>
        </NView>
        <NView tag="div" className="bg-surface border border-default rounded-lg p-4">
          <NText tag="h3" className={H3_DOC}>Performance Checks</NText>
          <NText tag="p" className="text-sm text-muted">
            Memory leaks, N+1 queries, and unnecessary computations
          </NText>
        </NView>
        <NView tag="div" className="bg-surface border border-default rounded-lg p-4">
          <NText tag="h3" className={H3_DOC}>Error Handling</NText>
          <NText tag="p" className="text-sm text-muted">
            Missing try/catch, unhandled promises, and silent failures
          </NText>
        </NView>
        <NView tag="div" className="bg-surface border border-default rounded-lg p-4">
          <NText tag="h3" className={H3_DOC}>Test Coverage</NText>
          <NText tag="p" className="text-sm text-muted">Checks if tests are added for new functionality</NText>
        </NView>
        <NView tag="div" className="bg-surface border border-default rounded-lg p-4">
          <NText tag="h3" className={H3_DOC}>Summary Report</NText>
          <NText tag="p" className="text-sm text-muted">Provides an overview of all issues found in the PR</NText>
        </NView>
      </NView>
    </NView>
  );
};

export default AICodeReviewer;
