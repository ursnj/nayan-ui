import { useState } from 'react';
import { NLink } from '@nayan-ui/react';
import { ArrowRight, ChevronRight, Download, ExternalLink, Github, Home, Linkedin, Mail, MapPin, Phone, Settings, Twitter, User } from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Link = () => {
  const [clickCount, setClickCount] = useState(0);
  const [lastClicked, setLastClicked] = useState<string>('');

  const handleBasicClick = () => {
    setClickCount(prev => prev + 1);
    setLastClicked('Basic Link');
  };

  const handleCustomAction = (action: string) => {
    setLastClicked(action);
    console.log(`Action performed: ${action}`);
  };

  const handleDownload = () => {
    setLastClicked('Download initiated');
    // Simulate download
    console.log('Download started...');
  };

  return (
    <ComponentWrapper>
      {/* Basic Links */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Basic Links</h2>
        <p className="text-muted-foreground mb-4">Simple anchor links and clickable elements.</p>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">External Links</h3>
            <div className="space-y-2">
              <div>
                <NLink href="https://example.com" className="text-blue-600 hover:text-blue-800 underline">
                  Basic External Link
                </NLink>
              </div>

              <div>
                <NLink
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline">
                  GitHub (opens in new tab)
                  <ExternalLink className="w-3 h-3" />
                </NLink>
              </div>

              <div>
                <NLink href="https://example.com" target="_self" rel="nofollow" className="text-blue-600 hover:text-blue-800 underline">
                  Same Tab Link (nofollow)
                </NLink>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Internal Links</h3>
            <div className="space-y-2">
              <div>
                <NLink href="/about" className="text-purple-600 hover:text-purple-800 underline">
                  About Page
                </NLink>
              </div>

              <div>
                <NLink href="/contact" className="text-purple-600 hover:text-purple-800 underline">
                  Contact Us
                </NLink>
              </div>

              <div>
                <NLink href="#section1" className="text-purple-600 hover:text-purple-800 underline">
                  Jump to Section
                </NLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clickable Elements */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Clickable Elements</h2>
        <p className="text-muted-foreground mb-4">Links that act as buttons with onClick handlers.</p>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Basic Click Actions</h3>
            <div className="space-y-2">
              <div>
                <NLink onClick={handleBasicClick} className="text-green-600 hover:text-green-800 cursor-pointer underline">
                  Click Counter Link
                </NLink>
              </div>

              <div>
                <NLink onClick={() => handleCustomAction('Custom Action')} className="text-orange-600 hover:text-orange-800 cursor-pointer underline">
                  Custom Action Link
                </NLink>
              </div>

              <div>
                <NLink
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 cursor-pointer underline">
                  <Download className="w-4 h-4" />
                  Download File
                </NLink>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Action Results</h3>
            <div className="p-3 bg-card rounded-lg text-sm">
              <p>
                <strong>Click Count:</strong> {clickCount}
              </p>
              <p>
                <strong>Last Action:</strong> {lastClicked || 'None'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Links with Icons */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Links with Icons</h2>
        <p className="text-muted-foreground mb-4">Enhanced links with icon elements for better visual appeal.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Contact Links</h3>
            <div className="space-y-3">
              <NLink href="mailto:contact@example.com" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline">
                <Mail className="w-4 h-4" />
                Send Email
              </NLink>

              <NLink href="tel:+1234567890" className="inline-flex items-center gap-2 text-green-600 hover:text-green-800 underline">
                <Phone className="w-4 h-4" />
                Call Us
              </NLink>

              <NLink
                href="https://maps.google.com"
                target="_blank"
                className="inline-flex items-center gap-2 text-red-600 hover:text-red-800 underline">
                <MapPin className="w-4 h-4" />
                View Location
                <ExternalLink className="w-3 h-3" />
              </NLink>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Social Links</h3>
            <div className="space-y-3">
              <NLink
                href="https://github.com/username"
                target="_blank"
                className="inline-flex items-center gap-2 text-gray-800 dark:text-gray-200 hover:text-gray-600 underline">
                <Github className="w-4 h-4" />
                GitHub Profile
                <ExternalLink className="w-3 h-3" />
              </NLink>

              <NLink
                href="https://twitter.com/username"
                target="_blank"
                className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-700 underline">
                <Twitter className="w-4 h-4" />
                Twitter
                <ExternalLink className="w-3 h-3" />
              </NLink>

              <NLink
                href="https://linkedin.com/in/username"
                target="_blank"
                className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-900 underline">
                <Linkedin className="w-4 h-4" />
                LinkedIn
                <ExternalLink className="w-3 h-3" />
              </NLink>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Navigation Links</h2>
        <p className="text-muted-foreground mb-4">Links styled for navigation menus and breadcrumbs.</p>

        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-3">Main Navigation</h3>
            <nav className="flex space-x-6">
              <NLink
                href="/"
                className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                <Home className="w-4 h-4" />
                Home
              </NLink>

              <NLink
                href="/profile"
                className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                <User className="w-4 h-4" />
                Profile
              </NLink>

              <NLink
                href="/settings"
                className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                <Settings className="w-4 h-4" />
                Settings
              </NLink>
            </nav>
          </div>

          <div>
            <h3 className="font-medium mb-3">Breadcrumb Navigation</h3>
            <nav className="flex items-center space-x-2 text-sm">
              <NLink href="/" className="text-blue-600 hover:text-blue-800 underline">
                Home
              </NLink>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <NLink href="/products" className="text-blue-600 hover:text-blue-800 underline">
                Products
              </NLink>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Current Page</span>
            </nav>
          </div>

          <div>
            <h3 className="font-medium mb-3">Sidebar Navigation</h3>
            <nav className="space-y-2 w-48">
              <NLink
                href="/dashboard"
                className="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600">
                Dashboard
              </NLink>
              <NLink
                href="/analytics"
                className="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600">
                Analytics
              </NLink>
              <NLink
                href="/reports"
                className="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600">
                Reports
              </NLink>
            </nav>
          </div>
        </div>
      </div>

      {/* Link Styles */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Link Styles</h2>
        <p className="text-muted-foreground mb-4">Different visual styles for various use cases.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Text Styles</h3>
            <div className="space-y-3">
              <div>
                <NLink href="#" className="text-blue-600 hover:text-blue-800 underline">
                  Default Underlined Link
                </NLink>
              </div>

              <div>
                <NLink href="#" className="text-blue-600 hover:text-blue-800 hover:underline">
                  Hover Underline Link
                </NLink>
              </div>

              <div>
                <NLink href="#" className="text-blue-600 hover:text-blue-800 no-underline font-medium">
                  No Underline Link
                </NLink>
              </div>

              <div>
                <NLink href="#" className="text-blue-600 hover:text-blue-800 underline decoration-dashed">
                  Dashed Underline
                </NLink>
              </div>

              <div>
                <NLink href="#" className="text-blue-600 hover:text-blue-800 underline decoration-dotted">
                  Dotted Underline
                </NLink>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Button-like Styles</h3>
            <div className="space-y-3">
              <div>
                <NLink href="#" className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  Primary Button Link
                </NLink>
              </div>

              <div>
                <NLink
                  href="#"
                  className="inline-block px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-500 hover:text-white transition-colors">
                  Outline Button Link
                </NLink>
              </div>

              <div>
                <NLink
                  href="#"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                  Action Link
                  <ArrowRight className="w-4 h-4" />
                </NLink>
              </div>

              <div>
                <NLink
                  href="#"
                  className="inline-block px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  Subtle Button Link
                </NLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility Features */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Accessibility Features</h2>
        <p className="text-muted-foreground mb-4">Links with proper accessibility attributes and keyboard support.</p>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Keyboard Navigation</h3>
            <p className="text-sm text-muted-foreground mb-3">All links are keyboard accessible. Use Tab to navigate and Enter/Space to activate.</p>
            <div className="space-y-2">
              <div>
                <NLink
                  onClick={() => handleCustomAction('Keyboard accessible action')}
                  className="text-blue-600 hover:text-blue-800 cursor-pointer underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded">
                  Focus me and press Enter or Space
                </NLink>
              </div>

              <div>
                <NLink
                  href="https://example.com"
                  target="_blank"
                  aria-label="Visit Example.com (opens in new tab)"
                  className="text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded">
                  Link with ARIA label
                  <ExternalLink className="w-3 h-3 ml-1 inline" />
                </NLink>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Screen Reader Support</h3>
            <div className="space-y-2">
              <div>
                <NLink href="/download/file.pdf" aria-describedby="pdf-description" className="text-blue-600 hover:text-blue-800 underline">
                  Download PDF Report
                </NLink>
                <p id="pdf-description" className="text-xs text-muted-foreground mt-1">
                  PDF file, 2.5 MB
                </p>
              </div>

              <div>
                <NLink
                  href="https://external-site.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit external site (opens in new window)"
                  className="text-blue-600 hover:text-blue-800 underline">
                  External Resource
                  <span className="sr-only"> (opens in new window)</span>
                  <ExternalLink className="w-3 h-3 ml-1 inline" />
                </NLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Demo */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Interactive Demo</h2>
        <p className="text-muted-foreground mb-4">Try different link interactions and see the results.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Test Links</h3>
            <div className="space-y-3">
              <div>
                <NLink
                  onClick={() => handleCustomAction('Primary action clicked')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer transition-colors">
                  Primary Action
                  <ArrowRight className="w-4 h-4" />
                </NLink>
              </div>

              <div>
                <NLink
                  onClick={() => handleCustomAction('Secondary action clicked')}
                  className="text-blue-600 hover:text-blue-800 cursor-pointer underline">
                  Secondary Action
                </NLink>
              </div>

              <div>
                <NLink
                  onClick={() => handleCustomAction('Danger action clicked')}
                  className="text-red-600 hover:text-red-800 cursor-pointer underline">
                  Danger Action
                </NLink>
              </div>

              <div>
                <NLink
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    handleCustomAction('Prevented default navigation');
                  }}
                  className="text-purple-600 hover:text-purple-800 underline">
                  Prevented Default Link
                </NLink>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Action Results</h3>
            <div className="p-4 bg-card rounded-lg">
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Total Clicks:</strong> {clickCount}
                </div>
                <div>
                  <strong>Last Action:</strong>
                  <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                    {lastClicked || 'None'}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setClickCount(0);
                      setLastClicked('');
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 underline">
                    Reset counters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ComponentWrapper>
  );
};

export default Link;
