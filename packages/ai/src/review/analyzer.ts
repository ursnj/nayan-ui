import type { CodeIssue, ReviewComment } from '../common/types.js';

export function issuesToReviewComments(issues: CodeIssue[]): ReviewComment[] {
  return issues.map(issue => {
    const severityIcon = issue.severity === 'error' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
    const categoryIcon = issue.category === 'functionality' ? '🐛' : issue.category === 'readability' ? '📖' : '⚡';

    let body = `${severityIcon} **${categoryIcon} ${capitalize(issue.category)}**\n\n${issue.message}`;
    if (issue.suggestion) {
      body += `\n\n💡 **Suggestion:** ${issue.suggestion}`;
    }

    return {
      path: issue.filename,
      line: issue.line,
      side: 'RIGHT' as const,
      body
    };
  });
}

export function generateSummary(issues: CodeIssue[]): string {
  if (issues.length === 0) {
    return '## ✅ AI Code Review Complete\n\nNo issues found. The code looks good!';
  }

  const bySeverity = {
    error: issues.filter(i => i.severity === 'error'),
    warning: issues.filter(i => i.severity === 'warning'),
    info: issues.filter(i => i.severity === 'info')
  };

  let summary = `## 🤖 AI Code Review Complete\n\nFound **${issues.length}** issue(s) in this PR.\n\n`;

  // Group issues by severity and list them
  if (bySeverity.error.length > 0) {
    summary += `### 🔴 Errors (${bySeverity.error.length})\n\n`;
    bySeverity.error.forEach(issue => {
      const icon = issue.category === 'functionality' ? '🐛' : issue.category === 'readability' ? '📖' : '⚡';
      summary += `- ${icon} **\`${issue.filename}:${issue.line}\`**\n  ${issue.message}`;
      if (issue.suggestion) {
        summary += `\n  💡 *${issue.suggestion}*`;
      }
      summary += '\n\n';
    });
  }

  if (bySeverity.warning.length > 0) {
    summary += `### 🟡 Warnings (${bySeverity.warning.length})\n\n`;
    bySeverity.warning.forEach(issue => {
      const icon = issue.category === 'functionality' ? '🐛' : issue.category === 'readability' ? '📖' : '⚡';
      summary += `- ${icon} **\`${issue.filename}:${issue.line}\`**\n  ${issue.message}`;
      if (issue.suggestion) {
        summary += `\n  💡 *${issue.suggestion}*`;
      }
      summary += '\n\n';
    });
  }

  if (bySeverity.info.length > 0) {
    summary += `### 🔵 Info (${bySeverity.info.length})\n\n`;
    bySeverity.info.forEach(issue => {
      const icon = issue.category === 'functionality' ? '🐛' : issue.category === 'readability' ? '📖' : '⚡';
      summary += `- ${icon} **\`${issue.filename}:${issue.line}\`**\n  ${issue.message}`;
      if (issue.suggestion) {
        summary += `\n  💡 *${issue.suggestion}*`;
      }
      summary += '\n\n';
    });
  }

  return summary.trim();
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
