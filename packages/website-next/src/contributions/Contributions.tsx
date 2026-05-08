'use client';

import { AlertTypes, NAlert, NBadge, NButton, NCard } from '@nayan-ui/react';
import { BookOpen, Bug, Code, GitPullRequest, Github, Heart, Lightbulb, Users } from 'lucide-react';

const Contributions = () => {
  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-600/10 via-purple-600/10 to-blue-600/10 border border-purple-500/15 text-center py-10 px-6">
            <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm rounded-2xl" />
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/20">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-3">
                <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">Open Source Contributions</span>
              </h1>
              <p className="text-lg text-muted max-w-2xl mx-auto">
                Nayan UI is an open source project and we welcome contributions from the community. Whether you're fixing bugs, adding features, or
                improving documentation, every contribution matters!
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NCard className="p-5 text-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md shadow-blue-500/20">
                <Github className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold">50+</div>
              <div className="text-xs text-muted">Components</div>
            </NCard>
            <NCard className="p-5 text-center">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md shadow-purple-500/20">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold">100+</div>
              <div className="text-xs text-muted">Contributors</div>
            </NCard>
            <NCard className="p-5 text-center">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md shadow-emerald-500/20">
                <GitPullRequest className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold">500+</div>
              <div className="text-xs text-muted">Pull Requests</div>
            </NCard>
            <NCard className="p-5 text-center">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md shadow-amber-500/20">
                <Code className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold">MIT</div>
              <div className="text-xs text-muted">License</div>
            </NCard>
          </div>

          {/* Ways to Contribute */}
          <div>
            <h2 className="text-2xl font-bold mb-6"><span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Ways to Contribute</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <NCard className="p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-md shadow-red-500/20 group-hover:scale-110 transition-transform">
                    <Bug className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Report Bugs</h3>
                </div>
                <p className="text-muted mb-4">Found a bug? Help us improve by reporting issues with detailed reproduction steps.</p>
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-500/12 text-red-700 dark:text-red-300 border border-red-500/20">Good First Issue</span>
              </NCard>

              <NCard className="p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Suggest Features</h3>
                </div>
                <p className="text-muted mb-4">Have an idea for a new component or feature? Share your suggestions with the community.</p>
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-500/12 text-amber-700 dark:text-amber-300 border border-amber-500/20">Enhancement</span>
              </NCard>

              <NCard className="p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    <Code className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Write Code</h3>
                </div>
                <p className="text-muted mb-4">Contribute code by fixing bugs, implementing features, or improving existing components.</p>
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-500/12 text-blue-700 dark:text-blue-300 border border-blue-500/20">Code</span>
              </NCard>

              <NCard className="p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Improve Docs</h3>
                </div>
                <p className="text-muted mb-4">Help improve documentation, add examples, or fix typos to help other developers.</p>
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">Documentation</span>
              </NCard>

              <NCard className="p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Help Others</h3>
                </div>
                <p className="text-muted mb-4">Answer questions, help with issues, and support fellow developers in the community.</p>
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-500/12 text-purple-700 dark:text-purple-300 border border-purple-500/20">Community</span>
              </NCard>

              <NCard className="p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-md shadow-pink-500/20 group-hover:scale-110 transition-transform">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Spread the Word</h3>
                </div>
                <p className="text-muted mb-4">Share Nayan UI with others, write blog posts, or create tutorials to grow our community.</p>
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-pink-500/12 text-pink-700 dark:text-pink-300 border border-pink-500/20">Advocacy</span>
              </NCard>
            </div>
          </div>

          {/* Getting Started */}
          <div>
            <h2 className="text-2xl font-bold mb-6"><span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Getting Started</span></h2>
            <NCard className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">1</div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Fork the Repository</h3>
                    <p className="text-muted">Start by forking the Nayan UI repository on GitHub to your own account.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md shadow-purple-500/20">2</div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Clone & Setup</h3>
                    <p className="text-muted mb-2">Clone your fork and install dependencies:</p>
                    <div className="bg-background p-3 rounded-md font-mono text-sm">
                      git clone https://github.com/your-username/nayan.git
                      <br />
                      cd nayan
                      <br />
                      yarn install
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md shadow-pink-500/20">3</div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Create a Branch</h3>
                    <p className="text-muted mb-2">Create a new branch for your changes:</p>
                    <div className="bg-background p-3 rounded-md font-mono text-sm">git checkout -b feature/your-feature-name</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-500/20">4</div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Make Changes</h3>
                    <p className="text-muted">Make your changes, add tests if needed, and ensure everything works properly.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md shadow-amber-500/20">5</div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Submit Pull Request</h3>
                    <p className="text-muted">Push your changes and create a pull request with a clear description of your changes.</p>
                  </div>
                </div>
              </div>
            </NCard>
          </div>

          {/* Development Guidelines */}
          <div>
            <h2 className="text-2xl font-bold mb-6"><span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Development Guidelines</span></h2>
            <div className="space-y-4">
              <NAlert type={AlertTypes.INFO}>
                <div>
                  <p className="text-sm">
                    We use ESLint and Prettier for code formatting. Formatting and linting will be auto corrected based on the configuration file.
                  </p>
                </div>
              </NAlert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NCard className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Component Guidelines</h3>
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

                <NCard className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Pull Request Guidelines</h3>
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

          {/* Community & Support */}
          <div>
            <h2 className="text-2xl font-bold mb-6"><span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Community & Support</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <NCard className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Join Our Community</h3>
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

              <NCard className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Recognition</h3>
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

          {/* Call to Action */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-center py-10 px-6 shadow-2xl shadow-purple-500/20">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Contribute?</h2>
            <p className="text-white/80 mb-6 max-w-2xl mx-auto">Join our growing community of developers and help make Nayan UI better for everyone!</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <NButton onClick={() => window.open('https://github.com/ursnj/nayan-ui', '_blank')} className="bg-white hover:bg-white/90 text-purple-700 px-6 py-2.5 font-semibold shadow-lg flex items-center gap-2">
                <Github className="w-4 h-4" />
                View on GitHub
              </NButton>
              <NButton
                onClick={() => window.open('https://github.com/ursnj/nayan-ui/issues', '_blank')}
                className="bg-white/15 hover:bg-white/25 text-white border border-white/20 px-6 py-2.5 font-semibold backdrop-blur-sm flex items-center gap-2">
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
