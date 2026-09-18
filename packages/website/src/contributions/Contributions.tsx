'use client';

import { AlertTypes, NAlert, NBadge, NButton, NCard } from '@nayan-ui/react';
import { BookOpen, Bug, Code, GitPullRequest, Github, Heart, Lightbulb, Users } from 'lucide-react';
import { GRADIENT_TEXT, H1, H2, H3, H4_CARD } from '@/design/system';
import { TOTAL_COMPONENT_COUNT } from '@/services/Counts';

const Contributions = () => {
  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-8">
          <div className="relative overflow-hidden rounded-2xl bg-surface border border-default text-center py-8 sm:py-10 px-4 sm:px-6">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                <Heart className="w-7 h-7 text-current" />
              </div>
              <h1 className={`${H1} mb-3`}>Open Source Contributions</h1>
              <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto">
                Nayan UI is an open source project and we welcome contributions from the community. Whether you're fixing bugs, adding features, or
                improving documentation, every contribution matters!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <NCard className="p-5 text-center">
              <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                <Code className="w-5 h-5 text-current" />
              </div>
              <div className="text-2xl font-bold">{TOTAL_COMPONENT_COUNT}</div>
              <div className="text-xs text-muted">Components</div>
            </NCard>
            <NCard className="p-5 text-center">
              <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                <Users className="w-5 h-5 text-current" />
              </div>
              <div className="text-2xl font-bold">2</div>
              <div className="text-xs text-muted">Platforms</div>
            </NCard>
            <NCard className="p-5 text-center">
              <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                <GitPullRequest className="w-5 h-5 text-current" />
              </div>
              <div className="text-2xl font-bold">Open</div>
              <div className="text-xs text-muted">To pull requests</div>
            </NCard>
            <NCard className="p-5 text-center">
              <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                <Github className="w-5 h-5 text-current" />
              </div>
              <div className="text-2xl font-bold">MIT</div>
              <div className="text-xs text-muted">Licence</div>
            </NCard>
          </div>

          <div>
            <h2 className={`${H2} mb-6`}>Ways to Contribute</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <NCard className="p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                    <Bug className="w-5 h-5 text-current" />
                  </div>
                  <h3 className={H3}>Report Bugs</h3>
                </div>
                <p className="text-muted mb-4">Found a bug? Help us improve by reporting issues with detailed reproduction steps.</p>
                <span className="self-start w-fit px-2.5 py-1 text-xs font-medium rounded-full bg-red-500/12 text-red-700 dark:text-red-300 border border-red-500/20">
                  Good First Issue
                </span>
              </NCard>

              <NCard className="p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                    <Lightbulb className="w-5 h-5 text-current" />
                  </div>
                  <h3 className={H3}>Suggest Features</h3>
                </div>
                <p className="text-muted mb-4">Have an idea for a new component or feature? Share your suggestions with the community.</p>
                <span className="self-start w-fit px-2.5 py-1 text-xs font-medium rounded-full bg-amber-500/12 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  Enhancement
                </span>
              </NCard>

              <NCard className="p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                    <Code className="w-5 h-5 text-current" />
                  </div>
                  <h3 className={H3}>Write Code</h3>
                </div>
                <p className="text-muted mb-4">Contribute code by fixing bugs, implementing features, or improving existing components.</p>
                <span className="self-start w-fit px-2.5 py-1 text-xs font-medium rounded-full bg-blue-500/12 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                  Code
                </span>
              </NCard>

              <NCard className="p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                    <BookOpen className="w-5 h-5 text-current" />
                  </div>
                  <h3 className={H3}>Improve Docs</h3>
                </div>
                <p className="text-muted mb-4">Help improve documentation, add examples, or fix typos to help other developers.</p>
                <span className="self-start w-fit px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  Documentation
                </span>
              </NCard>

              <NCard className="p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                    <Users className="w-5 h-5 text-current" />
                  </div>
                  <h3 className={H3}>Help Others</h3>
                </div>
                <p className="text-muted mb-4">Answer questions, help with issues, and support fellow developers in the community.</p>
                <span className="self-start w-fit px-2.5 py-1 text-xs font-medium rounded-full bg-purple-500/12 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                  Community
                </span>
              </NCard>

              <NCard className="p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                    <Heart className="w-5 h-5 text-current" />
                  </div>
                  <h3 className={H3}>Spread the Word</h3>
                </div>
                <p className="text-muted mb-4">Share Nayan UI with others, write blog posts, or create tutorials to grow our community.</p>
                <span className="self-start w-fit px-2.5 py-1 text-xs font-medium rounded-full bg-pink-500/12 text-pink-700 dark:text-pink-300 border border-pink-500/20">
                  Advocacy
                </span>
              </NCard>
            </div>
          </div>

          <div>
            <h2 className={`${H2} mb-6`}>Getting Started</h2>
            <NCard className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                    1
                  </div>
                  <div>
                    <h3 className={`mb-2 ${H4_CARD}`}>Fork the Repository</h3>
                    <p className="text-muted">Start by forking the Nayan UI repository on GitHub to your own account.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                    2
                  </div>
                  <div>
                    <h3 className={`mb-2 ${H4_CARD}`}>Clone & Setup</h3>
                    <p className="text-muted mb-2">Clone your fork and install dependencies:</p>
                    <div className="bg-background p-3 rounded-md font-mono text-sm overflow-x-auto">
                      git clone https://github.com/your-username/nayan.git
                      <br />
                      cd nayan
                      <br />
                      yarn install
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                    3
                  </div>
                  <div>
                    <h3 className={`mb-2 ${H4_CARD}`}>Create a Branch</h3>
                    <p className="text-muted mb-2">Create a new branch for your changes:</p>
                    <div className="bg-background p-3 rounded-md font-mono text-sm overflow-x-auto">git checkout -b feature/your-feature-name</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                    4
                  </div>
                  <div>
                    <h3 className={`mb-2 ${H4_CARD}`}>Make Changes</h3>
                    <p className="text-muted">Make your changes, add tests if needed, and ensure everything works properly.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                    5
                  </div>
                  <div>
                    <h3 className={`mb-2 ${H4_CARD}`}>Submit Pull Request</h3>
                    <p className="text-muted">Push your changes and create a pull request with a clear description of your changes.</p>
                  </div>
                </div>
              </div>
            </NCard>
          </div>

          <div>
            <h2 className={`${H2} mb-6`}>Development Guidelines</h2>
            <div className="space-y-4">
              <NAlert type={AlertTypes.INFO}>
                <div>
                  <p className="text-sm">
                    We use ESLint and Prettier for code formatting. Formatting and linting will be auto corrected based on the configuration file.
                  </p>
                </div>
              </NAlert>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <NCard className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Component Guidelines</h3>
                  <ul className="space-y-2 text-muted">
                    <li>• Follow the existing component structure and naming conventions</li>
                    <li>• Include TypeScript types for all props and interfaces</li>
                    <li>• Add comprehensive documentation and examples</li>
                    <li>• Ensure components work in both React and React Native</li>
                    <li>• Include accessibility features (ARIA labels, keyboard navigation)</li>
                    <li>• Write unit tests for new components and features</li>
                    <li>• Follow responsive design principles</li>
                  </ul>
                </NCard>

                <NCard className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Pull Request Guidelines</h3>
                  <ul className="space-y-2 text-muted">
                    <li>• Provide a clear and descriptive title</li>
                    <li>• Include a detailed description of changes</li>
                    <li>• Reference related issues using #issue-number</li>
                    <li>• Add screenshots for UI changes</li>
                    <li>• Ensure all tests pass</li>
                    <li>• Keep pull requests focused and atomic</li>
                    <li>• Be responsive to code review feedback</li>
                  </ul>
                </NCard>
              </div>
            </div>
          </div>

          <div>
            <h2 className={`${H2} mb-6`}>Community & Support</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <NCard className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Join Our Community</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Github className="w-5 h-5" />
                    <a href="https://github.com/ursnj/nayan-ui" className="text-accent hover:underline">
                      GitHub Repository
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5" />
                    <span className="text-muted">Discord Community (Coming Soon)</span>
                  </div>
                </div>
              </NCard>

              <NCard className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Recognition</h3>
                <p className="text-muted mb-4">We value every contribution! Contributors are recognized in:</p>
                <ul className="space-y-1 text-muted text-sm">
                  <li>• GitHub contributors list</li>
                  <li>• Release notes and changelogs</li>
                  <li>• Project documentation</li>
                  <li>• Social media shoutouts</li>
                </ul>
              </NCard>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 px-4 py-12 text-center sm:px-6">
            <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-indigo-600/15 via-violet-600/10 to-fuchsia-600/15" />
            <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div aria-hidden className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="relative">
              <h2 className={`${H2} mb-4`}>
                <span className={GRADIENT_TEXT}>Ready to contribute?</span>
              </h2>
              <p className="mx-auto mb-6 max-w-2xl text-muted">
                Join our growing community of developers and help make Nayan UI better for everyone!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <NButton
                  onClick={() => window.open('https://github.com/ursnj/nayan-ui', '_blank')}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-violet-600">
                  <Github className="w-4 h-4" />
                  View on GitHub
                </NButton>
                <NButton
                  onClick={() => window.open('https://github.com/ursnj/nayan-ui/issues', '_blank')}
                  className="flex items-center gap-2 border border-default bg-surface/70 px-6 py-2.5 font-semibold text-foreground backdrop-blur hover:bg-default/50">
                  <Bug className="w-4 h-4" />
                  Report Issues
                </NButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contributions;
