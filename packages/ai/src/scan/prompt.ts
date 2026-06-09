import type { ProjectType, Vulnerability } from '../common/types.js';

export const getScanPrompt = (projectType: string, manifestContent: string, nativeVulns: Vulnerability[] = []): string => {
  const nativeVulnSection =
    nativeVulns.length > 0
      ? `
CONFIRMED VULNERABILITIES (MUST INCLUDE ALL):
${nativeVulns.map(v => `- ${v.package}@${v.version}: ${v.title}${v.cve ? ` [${v.cve}]` : ''}${v.fixedIn ? ` (fix: ${v.fixedIn})` : ''} [SEVERITY: ${v.severity}]`).join('\n')}

You MUST include ALL the above in your response. Then find additional CVEs.
`
      : '';

  return `
You are a security vulnerability scanner. Analyze EVERY package in the manifest and check for known CVEs.

CRITICAL INSTRUCTIONS:
1. Check EACH package against known vulnerability databases (NVD, GitHub Advisory, Snyk, etc.)
2. For npm packages, check: lodash, axios, express, typeorm, @nestjs/*, sequelize, mongoose, etc.
3. Report ALL known CVEs - do not skip any
4. Be thorough and consistent - same packages should always report same CVEs
${nativeVulnSection}
Project type: ${projectType}
Manifest content:
\`\`\`
${manifestContent}
\`\`\`

IMPORTANT CONTEXT FOR SEVERITY ASSESSMENT:
Before reporting a vulnerability, evaluate the project type and deployment context:

1. **Bundled/Static Projects** (React, Vue, Angular, static websites, SPAs):
   - DevDependencies vulnerabilities are LOW impact (not in production bundle)
   - Build-time only tools (webpack, babel, eslint, prettier, jest, etc.) are LOW impact
   - Only runtime dependencies that end up in the client bundle are HIGH impact
   - Prototype pollution in dev tools = LOW (doesn't affect end users)

2. **Server-side Projects** (Node.js APIs, Express, backend services):
   - All runtime dependencies are potentially HIGH impact
   - DevDependencies are still LOW impact

3. **Libraries/Packages** (published to npm/pypi):
   - Runtime dependencies are HIGH impact (affects consumers)
   - DevDependencies are LOW impact

SEVERITY GUIDELINES:
- Mark as LOW if: devDependency, build-tool only, test framework, linter, formatter
- Mark as MEDIUM if: runtime dep but requires specific conditions to exploit
- Mark as HIGH/CRITICAL only if: runtime dependency with real attack vector in production

For each vulnerability found, provide:
- Package name
- Current version (if identifiable)
- Severity (critical, high, medium, low) - adjusted based on context above
- Brief description of the vulnerability
- Recommended fix (upgrade version or alternative package)

Return your findings as JSON in this exact format:
{
  "vulnerabilities": [
    {
      "package": "package-name",
      "version": "current-version",
      "severity": "high",
      "title": "Brief vulnerability title",
      "description": "Description of the security issue",
      "fixedIn": "version-that-fixes-it",
      "cve": "CVE-XXXX-XXXXX"
    }
  ]
}

IMPORTANT: 
- Check EVERY package in the manifest against the list above
- Include CVE IDs for all known vulnerabilities
- Only return the JSON object, no other text
`;
};

export const getFixPrompt = (projectType: ProjectType, manifestContent: string, vulnerabilities: Vulnerability[]): string => {
  const vulnList = vulnerabilities
    .map(v => `- ${v.package}@${v.version}: ${v.title}${v.fixedIn ? ` (fix: ${v.fixedIn})` : ''}${v.cve ? ` [${v.cve}]` : ''}`)
    .join('\n');

  return `
You are a security expert fixing vulnerabilities in a ${projectType} project.

Current manifest file content:
\`\`\`
${manifestContent}
\`\`\`

Vulnerabilities to fix:
${vulnList}

Your task:
1. Analyze each vulnerability and determine the best fix
2. Update package versions to secure versions
3. Remove packages if they are unnecessary or have no secure alternative
4. Add any missing security-related packages if needed
5. Ensure compatibility - don't break the project

For each fix, consider:
- Use the exact fixed version if provided
- If no fixed version, use the latest secure version
- Check for breaking changes between versions
- Consider alternative packages if the original is abandoned

Return your fixes as JSON in this exact format:
{
  "fixes": [
    {
      "type": "update",
      "package": "package-name",
      "from": "old-version",
      "to": "new-version",
      "reason": "Brief explanation"
    },
    {
      "type": "remove",
      "package": "package-name",
      "reason": "Brief explanation"
    },
    {
      "type": "add",
      "package": "package-name",
      "version": "version",
      "reason": "Brief explanation"
    }
  ],
  "updatedManifest": "The complete updated manifest file content",
  "summary": "Brief summary of all changes made",
  "breakingChanges": ["List of potential breaking changes to watch for"]
}

IMPORTANT:
- The updatedManifest must be the COMPLETE file content, not a diff
- Preserve all formatting and structure of the original file
- Only return the JSON object, no other text
`;
};

export const getCodeFixPrompt = (projectType: ProjectType, filePath: string, fileContent: string, vulnerability: Vulnerability): string => `
You are a security expert fixing a vulnerability in code.

File: ${filePath}
Project type: ${projectType}

Current file content:
\`\`\`
${fileContent}
\`\`\`

Vulnerability to fix:
- Package: ${vulnerability.package}
- Issue: ${vulnerability.title}
- Description: ${vulnerability.description || 'N/A'}
${vulnerability.cve ? `- CVE: ${vulnerability.cve}` : ''}

Your task:
1. Analyze the code for usage of the vulnerable package/pattern
2. Fix the vulnerability while maintaining functionality
3. Add any necessary imports or dependencies
4. Follow best security practices

Return your fix as JSON:
{
  "fixed": true,
  "updatedContent": "The complete updated file content",
  "changes": ["List of changes made"],
  "notes": "Any important notes about the fix"
}

If the file doesn't need changes:
{
  "fixed": false,
  "reason": "Why no changes are needed"
}

IMPORTANT: Only return the JSON object, no other text.
`;
