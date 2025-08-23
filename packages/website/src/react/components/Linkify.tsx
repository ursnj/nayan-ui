import { NCard, NLinkify } from '@nayan-ui/react';
import { Code, ExternalLink, Globe, Mail, MessageCircle } from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';
import { isWindowDefined } from '../../services/Utils';

const Linkify = () => {
  const sampleTexts = {
    basic: 'Visit our website at https://example.com for more information!',
    email: 'Contact us at support@example.com or sales@company.org for assistance.',
    multiple: 'Check out https://github.com/user/repo and email us at hello@example.com. Also visit www.example.com for updates.',
    social: 'Follow us on Twitter @username or visit our LinkedIn at linkedin.com/company/example',
    mixed:
      'Our main site is https://www.example.com, support email: help@example.com, and phone: +1-555-123-4567. Also check ftp://files.example.com',
    markdown: 'Visit [our website](https://example.com) and contact us at support@example.com',
    longText: `Welcome to our platform! You can find more information at https://docs.example.com/getting-started. 
    For technical support, reach out to tech-support@example.com or visit our community forum at forum.example.com. 
    Don't forget to check our blog at blog.example.com for the latest updates. 
    You can also follow us on social media: twitter.com/example and facebook.com/example.`,
    code: 'Clone the repository: git clone https://github.com/user/repo.git and install dependencies. Email bugs to bugs@example.com',
    international: 'Visit our global sites: example.co.uk, example.de, or example.com.au. Contact: international@example.com'
  };

  if (!isWindowDefined()) {
    return (
      <ComponentWrapper>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Linkify component requires browser environment</p>
        </div>
      </ComponentWrapper>
    );
  }

  return (
    <ComponentWrapper>
      {/* Basic Linkify */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Basic Linkify</h2>
        <p className="text-muted-foreground mb-4">Automatically convert URLs and email addresses to clickable links.</p>

        <div className="space-y-4">
          <NCard className="p-4">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Website URLs
            </h3>
            <div className="bg-card p-3 rounded border-l-4 border-blue-500">
              <NLinkify className="text-sm">{sampleTexts.basic}</NLinkify>
            </div>
          </NCard>

          <NCard className="p-4">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Addresses
            </h3>
            <div className="bg-card p-3 rounded border-l-4 border-green-500">
              <NLinkify className="text-sm">{sampleTexts.email}</NLinkify>
            </div>
          </NCard>
        </div>
      </div>

      {/* Multiple Links */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Multiple Links</h2>
        <p className="text-muted-foreground mb-4">Text containing multiple URLs and email addresses.</p>

        <NCard className="p-4">
          <div className="bg-card p-4 rounded border-l-4 border-purple-500">
            <NLinkify className="text-sm leading-relaxed">{sampleTexts.multiple}</NLinkify>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            <p>✓ Automatically detects and converts multiple link types</p>
            <p>✓ Preserves original text formatting</p>
          </div>
        </NCard>
      </div>

      {/* Social Media Links */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Social Media & Usernames</h2>
        <p className="text-muted-foreground mb-4">Linkify social media URLs and handles.</p>

        <NCard className="p-4">
          <div className="bg-card p-4 rounded border-l-4 border-blue-500">
            <NLinkify className="text-sm">{sampleTexts.social}</NLinkify>
          </div>
        </NCard>
      </div>

      {/* Mixed Content */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Mixed Content Types</h2>
        <p className="text-muted-foreground mb-4">Text with various types of links and protocols.</p>

        <NCard className="p-4">
          <div className="bg-card p-4 rounded border-l-4 border-orange-500">
            <NLinkify className="text-sm leading-relaxed">{sampleTexts.mixed}</NLinkify>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            <p>✓ Supports HTTP/HTTPS protocols</p>
            <p>✓ Handles FTP and other protocols</p>
            <p>✓ Preserves phone numbers as text</p>
          </div>
        </NCard>
      </div>

      {/* Long Text Content */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Long Text Content</h2>
        <p className="text-muted-foreground mb-4">Linkify in longer paragraphs and content blocks.</p>

        <NCard className="p-4">
          <div className="bg-card p-4 rounded border-l-4 border-indigo-500 max-h-48 overflow-y-auto">
            <NLinkify className="text-sm leading-relaxed whitespace-pre-line">{sampleTexts.longText}</NLinkify>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            <p>✓ Works with multi-line content</p>
            <p>✓ Maintains text formatting</p>
            <p>✓ Scrollable for long content</p>
          </div>
        </NCard>
      </div>

      {/* Code and Technical Content */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Code & Technical Content</h2>
        <p className="text-muted-foreground mb-4">Linkify URLs in code snippets and technical documentation.</p>

        <NCard className="p-4">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Code className="w-4 h-4" />
            Code Example
          </h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm border-l-4 border-green-500">
            <NLinkify>{sampleTexts.code}</NLinkify>
          </div>
        </NCard>
      </div>

      {/* International Domains */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">International Domains</h2>
        <p className="text-muted-foreground mb-4">Support for various country-code domains and international URLs.</p>

        <NCard className="p-4">
          <div className="bg-card p-4 rounded border-l-4 border-red-500">
            <NLinkify className="text-sm">{sampleTexts.international}</NLinkify>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            <p>✓ Supports country-code TLDs (.uk, .de, .au)</p>
            <p>✓ Handles international email addresses</p>
          </div>
        </NCard>
      </div>

      {/* Custom Styling */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Custom Styling</h2>
        <p className="text-muted-foreground mb-4">Linkify with custom CSS classes and styling.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NCard className="p-4">
            <h3 className="font-medium mb-2">Default Style</h3>
            <div className="bg-card p-3 rounded">
              <NLinkify className="text-sm">Visit https://example.com and email us at contact@example.com</NLinkify>
            </div>
          </NCard>

          <NCard className="p-4">
            <h3 className="font-medium mb-2">Custom Link Style</h3>
            <div className="bg-card p-3 rounded">
              <NLinkify className="text-sm" linkClassName="text-purple-600 hover:text-purple-800 font-semibold underline decoration-wavy">
                Visit https://example.com and email us at contact@example.com
              </NLinkify>
            </div>
          </NCard>
        </div>
      </div>

      {/* Real-world Examples */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Real-world Examples</h2>
        <p className="text-muted-foreground mb-4">Common use cases for linkify in applications.</p>

        <div className="space-y-4">
          <NCard className="p-4">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat Message
            </h3>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">JD</div>
              <div className="flex-1 bg-card p-3 rounded-lg">
                <div className="text-sm font-medium mb-1">John Doe</div>
                <NLinkify className="text-sm">
                  Hey team! I've pushed the latest changes to https://github.com/company/project. Please review and let me know if you have any
                  questions at john.doe@company.com
                </NLinkify>
                <div className="text-xs text-muted-foreground mt-2">2 minutes ago</div>
              </div>
            </div>
          </NCard>

          <NCard className="p-4">
            <h3 className="font-medium mb-2">User Bio</h3>
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                AS
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Alice Smith</h4>
                <p className="text-sm text-muted-foreground mb-2">Full Stack Developer</p>
                <div className="bg-card p-3 rounded">
                  <NLinkify className="text-sm">
                    Passionate developer with 5+ years of experience. Check out my portfolio at https://alicesmith.dev or connect with me at
                    alice@alicesmith.dev. Also active on twitter.com/alicesmith_dev
                  </NLinkify>
                </div>
              </div>
            </div>
          </NCard>

          <NCard className="p-4">
            <h3 className="font-medium mb-2">Support Ticket</h3>
            <div className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Ticket #12345</span>
                <span className="text-xs bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded">Open</span>
              </div>
              <NLinkify className="text-sm">
                I'm experiencing issues with the API endpoint at https://api.example.com/v1/users. The documentation at https://docs.example.com/api
                doesn't seem to match the actual response. Please contact me at user@example.com with updates.
              </NLinkify>
            </div>
          </NCard>
        </div>
      </div>

      {/* Interactive Demo */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Interactive Demo</h2>
        <p className="text-muted-foreground mb-4">Try entering text with URLs and emails to see linkify in action.</p>

        <NCard className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Enter text with URLs and emails:</label>
              <textarea
                className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Try typing: Visit https://example.com or email me at hello@example.com"
                defaultValue="Check out our new website at https://nayanui.com and contact us at hello@nayanui.com for more info!"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Linkified Result:</label>
              <div className="bg-card p-3 rounded border min-h-[80px]">
                <NLinkify className="text-sm">
                  Check out our new website at https://nayanui.com and contact us at hello@nayanui.com for more info!
                </NLinkify>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>💡 Try pasting different types of content to see how linkify handles various URL formats</p>
            </div>
          </div>
        </NCard>
      </div>

      {/* Usage Guidelines */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Usage Guidelines</h2>
        <p className="text-muted-foreground mb-4">Best practices and considerations when using linkify.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NCard className="p-4 border-green-200 bg-green-50 dark:bg-green-900/20">
            <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">✅ Do</h3>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• Use for user-generated content</li>
              <li>• Apply to chat messages and comments</li>
              <li>• Include in bio and description fields</li>
              <li>• Use with proper security measures</li>
              <li>• Test with various URL formats</li>
            </ul>
          </NCard>

          <NCard className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
            <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">❌ Don't</h3>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              <li>• Apply to already formatted HTML</li>
              <li>• Use without link validation</li>
              <li>• Forget about security implications</li>
              <li>• Apply to code blocks unnecessarily</li>
              <li>• Ignore accessibility considerations</li>
            </ul>
          </NCard>
        </div>
      </div>
    </ComponentWrapper>
  );
};

export default Linkify;
