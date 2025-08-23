import { AlertTypes, NAlert, NBadge, NButton, NCard } from '@nayan-ui/react';
import { BookOpen, Bug, Code, GitPullRequest, Github, Heart, Lightbulb, Users } from 'lucide-react';
import Footer from '@/helpers/Footer';
import Meta from '../helpers/Meta';

const Contributions = () => {
  return (
    <>
      <div className="contributions container mx-auto pt-8 mb-8">
        <Meta
          title="Contributing to Nayan UI"
          description="Learn how to contribute to Nayan UI, an open source React and React Native component library. Guidelines for bug reports, feature requests, and code contributions."
        />

        <div className="space-y-8">
          {/* Hero Section */}
          <NCard className="text-center py-8">
            <div className="flex justify-center items-center gap-2 mb-4">
              <Heart className="w-8 h-8 text-red-500" />
              <h1 className="text-3xl font-bold text-text">Open Source Contributions</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nayan UI is an open source project and we welcome contributions from the community. Whether you're fixing bugs, adding features, or
              improving documentation, every contribution matters!
            </p>
          </NCard>

          {/* Quick Stats */}
          <NCard className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <Github className="w-8 h-8 text-primary" />
                <div className="text-2xl font-bold text-text">50+</div>
                <div className="text-sm text-muted-foreground">Components</div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Users className="w-8 h-8 text-primary" />
                <div className="text-2xl font-bold text-text">100+</div>
                <div className="text-sm text-muted-foreground">Contributors</div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <GitPullRequest className="w-8 h-8 text-primary" />
                <div className="text-2xl font-bold text-text">500+</div>
                <div className="text-sm text-muted-foreground">Pull Requests</div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Code className="w-8 h-8 text-primary" />
                <div className="text-2xl font-bold text-text">MIT</div>
                <div className="text-sm text-muted-foreground">License</div>
              </div>
            </div>
          </NCard>

          {/* Ways to Contribute */}
          <div>
            <h2 className="text-2xl font-bold text-text mb-6">Ways to Contribute</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <NCard className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <Bug className="w-6 h-6 text-red-500" />
                  <h3 className="text-lg font-semibold text-text">Report Bugs</h3>
                </div>
                <p className="text-muted-foreground mb-4">Found a bug? Help us improve by reporting issues with detailed reproduction steps.</p>
                <NBadge>Good First Issue</NBadge>
              </NCard>

              <NCard className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <Lightbulb className="w-6 h-6 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-text">Suggest Features</h3>
                </div>
                <p className="text-muted-foreground mb-4">Have an idea for a new component or feature? Share your suggestions with the community.</p>
                <NBadge>Enhancement</NBadge>
              </NCard>

              <NCard className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <Code className="w-6 h-6 text-blue-500" />
                  <h3 className="text-lg font-semibold text-text">Write Code</h3>
                </div>
                <p className="text-muted-foreground mb-4">Contribute code by fixing bugs, implementing features, or improving existing components.</p>
                <NBadge>Code</NBadge>
              </NCard>

              <NCard className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-6 h-6 text-green-500" />
                  <h3 className="text-lg font-semibold text-text">Improve Docs</h3>
                </div>
                <p className="text-muted-foreground mb-4">Help improve documentation, add examples, or fix typos to help other developers.</p>
                <NBadge>Documentation</NBadge>
              </NCard>

              <NCard className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-6 h-6 text-purple-500" />
                  <h3 className="text-lg font-semibold text-text">Help Others</h3>
                </div>
                <p className="text-muted-foreground mb-4">Answer questions, help with issues, and support fellow developers in the community.</p>
                <NBadge>Community</NBadge>
              </NCard>

              <NCard className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="w-6 h-6 text-pink-500" />
                  <h3 className="text-lg font-semibold text-text">Spread the Word</h3>
                </div>
                <p className="text-muted-foreground mb-4">Share Nayan UI with others, write blog posts, or create tutorials to grow our community.</p>
                <NBadge>Advocacy</NBadge>
              </NCard>
            </div>
          </div>

          {/* Getting Started */}
          <div>
            <h2 className="text-2xl font-bold text-text mb-6">Getting Started</h2>
            <NCard className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h3 className="font-semibold text-text mb-2">Fork the Repository</h3>
                    <p className="text-muted-foreground">Start by forking the Nayan UI repository on GitHub to your own account.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h3 className="font-semibold text-text mb-2">Clone & Setup</h3>
                    <p className="text-muted-foreground mb-2">Clone your fork and install dependencies:</p>
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
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <h3 className="font-semibold text-text mb-2">Create a Branch</h3>
                    <p className="text-muted-foreground mb-2">Create a new branch for your changes:</p>
                    <div className="bg-background p-3 rounded-md font-mono text-sm">git checkout -b feature/your-feature-name</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">4</div>
                  <div>
                    <h3 className="font-semibold text-text mb-2">Make Changes</h3>
                    <p className="text-muted-foreground">Make your changes, add tests if needed, and ensure everything works properly.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">5</div>
                  <div>
                    <h3 className="font-semibold text-text mb-2">Submit Pull Request</h3>
                    <p className="text-muted-foreground">Push your changes and create a pull request with a clear description of your changes.</p>
                  </div>
                </div>
              </div>
            </NCard>
          </div>

          {/* Development Guidelines */}
          <div>
            <h2 className="text-2xl font-bold text-text mb-6">Development Guidelines</h2>
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
                  <h3 className="text-lg font-semibold text-text mb-4">Component Guidelines</h3>
                  <ul className="space-y-2 text-muted-foreground">
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
                  <h3 className="text-lg font-semibold text-text mb-4">Pull Request Guidelines</h3>
                  <ul className="space-y-2 text-muted-foreground">
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
            <h2 className="text-2xl font-bold text-text mb-6">Community & Support</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <NCard className="p-6">
                <h3 className="text-lg font-semibold text-text mb-4">Join Our Community</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Github className="w-5 h-5" />
                    <a href="https://github.com/ursnj/nayan" className="text-primary hover:underline">
                      GitHub Repository
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5" />
                    <span className="text-muted-foreground">Discord Community (Coming Soon)</span>
                  </div>
                </div>
              </NCard>

              <NCard className="p-6">
                <h3 className="text-lg font-semibold text-text mb-4">Recognition</h3>
                <p className="text-muted-foreground mb-4">We value every contribution! Contributors are recognized in:</p>
                <ul className="space-y-1 text-muted-foreground text-sm">
                  <li>• GitHub contributors list</li>
                  <li>• Release notes and changelogs</li>
                  <li>• Project documentation</li>
                  <li>• Social media shoutouts</li>
                </ul>
              </NCard>
            </div>
          </div>

          {/* Call to Action */}
          <NCard className="text-center py-8 mb-8">
            <h2 className="text-2xl font-bold text-text mb-4">Ready to Contribute?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join our growing community of developers and help make Nayan UI better for everyone!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <NButton onClick={() => window.open('https://github.com/ursnj/nayan', '_blank')} className="flex items-center gap-2">
                <Github className="w-4 h-4" />
                View on GitHub
              </NButton>
              <NButton
                isOutline={true}
                onClick={() => window.open('https://github.com/ursnj/nayan/issues', '_blank')}
                className="flex items-center gap-2">
                <Bug className="w-4 h-4" />
                Report Issues
              </NButton>
            </div>
          </NCard>
        </div>
      </div>
    </>
  );
};

export default Contributions;
