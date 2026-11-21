import { NView, NText } from 'nayan-ui/components';
import { AlertTypes, NAlert, NCard } from "@/components/ui";
import { BookOpen, Bug, Code, GitPullRequest, Github, Heart, Lightbulb, Users } from "@/design/Icons";
import { PageHero } from "@/design/Primitives";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CONTAINER, H2, H3, H4_CARD, LEAD } from "@/design/system";
import { TOTAL_COMPONENT_COUNT } from "@/services/Counts";
import { REPO_URL } from "@/services/seo";

const Contributions = () => {
  return (
    <>
      <PageHero
        tone="mint"
        title="Contribute to Nayan UI"
        lead="Help build the engine, improve the docs, or report an issue."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Contributing" }]}
        actions={
          <NView tag="a" href={REPO_URL} target="_blank" rel="noopener noreferrer" className={BUTTON_PRIMARY}>
            <Github aria-hidden className="mr-2 h-4 w-4" />
            View on GitHub
          </NView>
        }
      />
      <NView tag="div" className={`${CONTAINER} py-10 sm:py-14`}>
        <NView tag="div" className="space-y-10 sm:space-y-14">
          <NView tag="div" className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <NCard className="p-5 text-center">
              <NView tag="div" className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center border border-accent/20 bg-accent/8 text-accent">
                <Code className="w-5 h-5 text-current" />
              </NView>
              <NView tag="div" className="text-2xl font-bold">{TOTAL_COMPONENT_COUNT}</NView>
              <NView tag="div" className="text-xs text-muted">Components</NView>
            </NCard>
            <NCard className="p-5 text-center">
              <NView tag="div" className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center border border-accent/20 bg-accent/8 text-accent">
                <Users className="w-5 h-5 text-current" />
              </NView>
              <NView tag="div" className="text-2xl font-bold">2</NView>
              <NView tag="div" className="text-xs text-muted">Platforms</NView>
            </NCard>
            <NCard className="p-5 text-center">
              <NView tag="div" className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center border border-accent/20 bg-accent/8 text-accent">
                <GitPullRequest className="w-5 h-5 text-current" />
              </NView>
              <NView tag="div" className="text-2xl font-bold">Open</NView>
              <NView tag="div" className="text-xs text-muted">To pull requests</NView>
            </NCard>
            <NCard className="p-5 text-center">
              <NView tag="div" className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center border border-accent/20 bg-accent/8 text-accent">
                <Github className="w-5 h-5 text-current" />
              </NView>
              <NView tag="div" className="text-2xl font-bold">MIT</NView>
              <NView tag="div" className="text-xs text-muted">Licence</NView>
            </NCard>
          </NView>

          <NView tag="div">
            <NText tag="h2" className={`${H2} mb-6`}>Ways to Contribute</NText>
            <NView tag="div" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <NCard className="p-6 hover:shadow-xl transition-all duration-300 group">
                <NView tag="div" className="flex items-center gap-3 mb-4">
                  <NView tag="div" className="w-10 h-10 rounded-xl flex items-center justify-center border border-accent/20 bg-accent/8 text-accent">
                    <Bug className="w-5 h-5 text-current" />
                  </NView>
                  <NText tag="h3" className={H3}>Report Bugs</NText>
                </NView>
                <NText tag="p" className="text-muted mb-4">
                  Found a bug? Help us improve by reporting issues with detailed reproduction steps.
                </NText>
                <NText tag="span" className="self-start w-fit px-2.5 py-1 text-xs font-medium rounded-full bg-red-500/12 text-red-700 dark:text-red-300 border border-red-500/20">
                  Good First Issue
                </NText>
              </NCard>

              <NCard className="p-6 hover:shadow-xl transition-all duration-300 group">
                <NView tag="div" className="flex items-center gap-3 mb-4">
                  <NView tag="div" className="w-10 h-10 rounded-xl flex items-center justify-center border border-accent/20 bg-accent/8 text-accent">
                    <Lightbulb className="w-5 h-5 text-current" />
                  </NView>
                  <NText tag="h3" className={H3}>Suggest Features</NText>
                </NView>
                <NText tag="p" className="text-muted mb-4">
                  Have an idea for a new component or feature? Share your suggestions with the
                  community.
                </NText>
                <NText tag="span" className="self-start w-fit px-2.5 py-1 text-xs font-medium rounded-full bg-amber-500/12 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  Enhancement
                </NText>
              </NCard>

              <NCard className="p-6 hover:shadow-xl transition-all duration-300 group">
                <NView tag="div" className="flex items-center gap-3 mb-4">
                  <NView tag="div" className="w-10 h-10 rounded-xl flex items-center justify-center border border-accent/20 bg-accent/8 text-accent">
                    <Code className="w-5 h-5 text-current" />
                  </NView>
                  <NText tag="h3" className={H3}>Write Code</NText>
                </NView>
                <NText tag="p" className="text-muted mb-4">
                  Contribute code by fixing bugs, implementing features, or improving existing
                  components.
                </NText>
                <NText tag="span" className="self-start w-fit px-2.5 py-1 text-xs font-medium rounded-full bg-blue-500/12 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                  Code
                </NText>
              </NCard>

              <NCard className="p-6 hover:shadow-xl transition-all duration-300 group">
                <NView tag="div" className="flex items-center gap-3 mb-4">
                  <NView tag="div" className="w-10 h-10 rounded-xl flex items-center justify-center border border-accent/20 bg-accent/8 text-accent">
                    <BookOpen className="w-5 h-5 text-current" />
                  </NView>
                  <NText tag="h3" className={H3}>Improve Docs</NText>
                </NView>
                <NText tag="p" className="text-muted mb-4">
                  Help improve documentation, add examples, or fix typos to help other developers.
                </NText>
                <NText tag="span" className="self-start w-fit px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  Documentation
                </NText>
              </NCard>

              <NCard className="p-6 hover:shadow-xl transition-all duration-300 group">
                <NView tag="div" className="flex items-center gap-3 mb-4">
                  <NView tag="div" className="w-10 h-10 rounded-xl flex items-center justify-center border border-accent/20 bg-accent/8 text-accent">
                    <Users className="w-5 h-5 text-current" />
                  </NView>
                  <NText tag="h3" className={H3}>Help Others</NText>
                </NView>
                <NText tag="p" className="text-muted mb-4">
                  Answer questions, help with issues, and support fellow developers in the
                  community.
                </NText>
                <NText tag="span" className="self-start w-fit px-2.5 py-1 text-xs font-medium rounded-full bg-purple-500/12 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                  Community
                </NText>
              </NCard>

              <NCard className="p-6 hover:shadow-xl transition-all duration-300 group">
                <NView tag="div" className="flex items-center gap-3 mb-4">
                  <NView tag="div" className="w-10 h-10 rounded-xl flex items-center justify-center border border-accent/20 bg-accent/8 text-accent">
                    <Heart className="w-5 h-5 text-current" />
                  </NView>
                  <NText tag="h3" className={H3}>Spread the Word</NText>
                </NView>
                <NText tag="p" className="text-muted mb-4">
                  Share Nayan UI with others, write blog posts, or create tutorials to grow our
                  community.
                </NText>
                <NText tag="span" className="self-start w-fit px-2.5 py-1 text-xs font-medium rounded-full bg-pink-500/12 text-pink-700 dark:text-pink-300 border border-pink-500/20">
                  Advocacy
                </NText>
              </NCard>
            </NView>
          </NView>

          <NView tag="div">
            <NText tag="h2" className={`${H2} mb-6`}>Getting Started</NText>
            <NCard className="p-6">
              <NView tag="div" className="space-y-4">
                <NView tag="div" className="flex items-start gap-4">
                  <NView tag="div" className="w-8 h-8 rounded-full flex items-center justify-center border border-accent/20 bg-accent/8 text-accent">
                    1
                  </NView>
                  <NView tag="div">
                    <NText tag="h3" className={`mb-2 ${H4_CARD}`}>Fork the Repository</NText>
                    <NText tag="p" className="text-muted">
                      Start by forking the Nayan UI repository on GitHub to your own account.
                    </NText>
                  </NView>
                </NView>

                <NView tag="div" className="flex items-start gap-4">
                  <NView tag="div" className="w-8 h-8 rounded-full flex items-center justify-center border border-accent/20 bg-accent/8 text-accent">
                    2
                  </NView>
                  <NView tag="div">
                    <NText tag="h3" className={`mb-2 ${H4_CARD}`}>Clone & Setup</NText>
                    <NText tag="p" className="text-muted mb-2">Clone your fork and install dependencies:</NText>
                    <NView tag="div" className="bg-background p-3 rounded-md font-mono text-sm overflow-x-auto">
                      git clone https://github.com/your-username/nayan-ui.git
                      <NView tag="br" />
                      cd nayan-ui
                      <NView tag="br" />
                      bun install --frozen-lockfile --filter nayan-ui
                    </NView>
                  </NView>
                </NView>

                <NView tag="div" className="flex items-start gap-4">
                  <NView tag="div" className="w-8 h-8 rounded-full flex items-center justify-center border border-accent/20 bg-accent/8 text-accent">
                    3
                  </NView>
                  <NView tag="div">
                    <NText tag="h3" className={`mb-2 ${H4_CARD}`}>Create a Branch</NText>
                    <NText tag="p" className="text-muted mb-2">Create a new branch for your changes:</NText>
                    <NView tag="div" className="bg-background p-3 rounded-md font-mono text-sm overflow-x-auto">
                      git checkout -b feature/your-feature-name
                    </NView>
                  </NView>
                </NView>

                <NView tag="div" className="flex items-start gap-4">
                  <NView tag="div" className="w-8 h-8 rounded-full flex items-center justify-center border border-accent/20 bg-accent/8 text-accent">
                    4
                  </NView>
                  <NView tag="div">
                    <NText tag="h3" className={`mb-2 ${H4_CARD}`}>Make Changes</NText>
                    <NText tag="p" className="text-muted">
                      Make your changes, add tests if needed, and ensure everything works properly.
                    </NText>
                  </NView>
                </NView>

                <NView tag="div" className="flex items-start gap-4">
                  <NView tag="div" className="w-8 h-8 rounded-full flex items-center justify-center border border-accent/20 bg-accent/8 text-accent">
                    5
                  </NView>
                  <NView tag="div">
                    <NText tag="h3" className={`mb-2 ${H4_CARD}`}>Submit Pull Request</NText>
                    <NText tag="p" className="text-muted">
                      Push your changes and create a pull request with a clear description of your
                      changes.
                    </NText>
                  </NView>
                </NView>
              </NView>
            </NCard>
          </NView>

          <NView tag="div">
            <NText tag="h2" className={`${H2} mb-6`}>Development Guidelines</NText>
            <NView tag="div" className="space-y-4">
              <NAlert type={AlertTypes.INFO}>
                <NView tag="div">
                  <NText tag="p" className="text-sm">
                    We use ESLint and Prettier for code formatting. Formatting and linting will be
                    auto corrected based on the configuration file.
                  </NText>
                </NView>
              </NAlert>

              <NView tag="div" className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <NCard className="p-4 sm:p-6">
                  <NText tag="h3" className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
                    Component Guidelines
                  </NText>
                  <NView tag="ul" className="space-y-2 text-muted">
                    <NView tag="li">• Follow the existing component structure and naming conventions</NView>
                    <NView tag="li">• Include TypeScript types for all props and interfaces</NView>
                    <NView tag="li">• Add comprehensive documentation and examples</NView>
                    <NView tag="li">• Ensure components work in both React and React Native</NView>
                    <NView tag="li">• Include accessibility features (ARIA labels, keyboard navigation)</NView>
                    <NView tag="li">• Write unit tests for new components and features</NView>
                    <NView tag="li">• Follow responsive design principles</NView>
                  </NView>
                </NCard>

                <NCard className="p-4 sm:p-6">
                  <NText tag="h3" className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
                    Pull Request Guidelines
                  </NText>
                  <NView tag="ul" className="space-y-2 text-muted">
                    <NView tag="li">• Provide a clear and descriptive title</NView>
                    <NView tag="li">• Include a detailed description of changes</NView>
                    <NView tag="li">• Reference related issues using #issue-number</NView>
                    <NView tag="li">• Add screenshots for UI changes</NView>
                    <NView tag="li">• Ensure all tests pass</NView>
                    <NView tag="li">• Keep pull requests focused and atomic</NView>
                    <NView tag="li">• Be responsive to code review feedback</NView>
                  </NView>
                </NCard>
              </NView>
            </NView>
          </NView>

          <NView tag="div">
            <NText tag="h2" className={`${H2} mb-6`}>Community & Support</NText>
            <NView tag="div" className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <NCard className="p-4 sm:p-6">
                <NText tag="h3" className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
                  Join Our Community
                </NText>
                <NView tag="div" className="space-y-3">
                  <NView tag="div" className="flex items-center gap-3">
                    <Github className="w-5 h-5" />
                    <NView tag="a" href={REPO_URL} className="text-accent hover:underline">
                      GitHub Repository
                    </NView>
                  </NView>
                  <NView tag="div" className="flex items-center gap-3">
                    <Users className="w-5 h-5" />
                    <NText tag="span" className="text-muted">Discord Community (Coming Soon)</NText>
                  </NView>
                </NView>
              </NCard>

              <NCard className="p-4 sm:p-6">
                <NText tag="h3" className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
                  Recognition
                </NText>
                <NText tag="p" className="text-muted mb-4">
                  We value every contribution! Contributors are recognized in:
                </NText>
                <NView tag="ul" className="space-y-1 text-muted text-sm">
                  <NView tag="li">• GitHub contributors list</NView>
                  <NView tag="li">• Release notes and changelogs</NView>
                  <NView tag="li">• Project documentation</NView>
                  <NView tag="li">• Social media shoutouts</NView>
                </NView>
              </NCard>
            </NView>
          </NView>

          <NView tag="section" className="site-cta flex flex-wrap items-end justify-between gap-5">
            <NView tag="div">
              <NText tag="h2" className={H2}>Help improve Nayan UI</NText>
              <NText tag="p" className={`mt-3 ${LEAD}`}>Browse open issues or share what you’d like us to improve.</NText>
            </NView>
            <NView tag="a" href={`${REPO_URL}/issues`} target="_blank" rel="noopener noreferrer" className={BUTTON_SECONDARY}>
              <Bug aria-hidden className="mr-2 h-4 w-4" />
              View issues
            </NView>
          </NView>
        </NView>
      </NView>
    </>
  );
};

export default Contributions;
