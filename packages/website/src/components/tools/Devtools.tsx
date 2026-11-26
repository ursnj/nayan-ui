import { NView, NText } from 'nayan-ui/components';
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Bug,
  Crop,
  FileCode,
  FileImage,
  FileText,
  Github,
  Globe,
  ImageDown,
  Keyboard,
  Map as MapIcon,
  Package,
  Rocket,
  RotateCw,
  Scaling,
  ShieldCheck,
  Sparkles,
  Stamp,
  Wrench,
  Merge,
  Scissors,
  FileDown,
  Lock,
  Unlock,
  FileUp,
  Image,
  GripVertical,
  Code as CodeIcon,
  Presentation,
  Braces,
  Minimize2,
  FileSpreadsheet,
  Table,
  Sheet,
  GitCompareArrows,
  Hash,
  WholeWord,
  CaseSensitive,
  ScrollText,
  Undo2,
  Link2,
  Eye,
  FileSearch,
  Tag,
  Link as LinkIcon,
  Share2,
  BarChart3,
  KeyRound,
  Binary,
  Code2,
  Palette,
  Clock3,
  Radio,
  Layers,
  Pipette,
  FileSignature,
  PenTool,
  Images,
  FlipHorizontal2,
  Info,
  ImagePlus,
  Route,
  Fingerprint,
  QrCode
} from '@/design/Icons';
import Link from 'next/link';
import { DocsIntro } from '@/design/Primitives';
import { ACCENT_SOFT, BUTTON_SMALL, CARD, CARD_INTERACTIVE, GRID_GAP, H3 } from '@/design/system';
import Code from '@/components/helpers/Code';
import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import { REPO_URL } from '@/services/seo';

const SEO_TOOLS = [
  {
    icon: MapIcon,
    title: 'Sitemap generator',
    body: 'Create XML sitemaps with URLs, change frequency, and priority settings.',
    href: '/tools/sitemap-generator'
  },
  {
    icon: FileSearch,
    title: 'Sitemap validator',
    body: 'Validate XML sitemap structure, URLs, and SEO compliance.',
    href: '/tools/sitemap-validator'
  },
  {
    icon: Bot,
    title: 'Robots.txt generator',
    body: 'Build robots.txt files with user-agent rules, allow/disallow paths, and sitemap directives.',
    href: '/tools/robots-generator'
  },
  {
    icon: FileSearch,
    title: 'Robots.txt validator',
    body: 'Validate robots.txt syntax, directives, and crawler permissions.',
    href: '/tools/robots-validator'
  },
  {
    icon: Tag,
    title: 'Meta tag generator',
    body: 'Generate HTML meta tags, Open Graph, and Twitter Card tags for SEO.',
    href: '/tools/meta-tag-generator'
  },
  {
    icon: Share2,
    title: 'Open Graph preview',
    body: 'Preview how your page looks on Facebook, Twitter, Google, and Slack.',
    href: '/tools/open-graph-preview'
  },
  {
    icon: LinkIcon,
    title: 'URL encoder/decoder',
    body: 'Encode and decode URLs for proper formatting and debugging.',
    href: '/tools/url-encoder-decoder'
  },
  {
    icon: BarChart3,
    title: 'Keyword density analyzer',
    body: 'Analyze keyword frequency and density in your content for SEO.',
    href: '/tools/keyword-density'
  },
  {
    icon: Share2,
    title: 'Google SERP snippet preview',
    body: 'Preview how your title and description will look in Google search results.',
    href: '/tools/serp-snippet-preview'
  },
  {
    icon: Braces,
    title: 'Schema markup generator',
    body: 'Generate JSON-LD structured data for FAQ, Article, Product, and more.',
    href: '/tools/schema-markup-generator'
  },
  {
    icon: LinkIcon,
    title: 'UTM campaign URL builder',
    body: 'Build correctly-encoded UTM tracking URLs for your marketing campaigns.',
    href: '/tools/utm-campaign-builder'
  }
];

const AI_TOOLS = [
  {
    icon: Sparkles,
    title: 'AI code reviewer',
    body: 'Review a GitHub pull request with Codex or Claude Code, inline or as a summary.',
    href: '/tools/ai-code-reviewer'
  },
  {
    icon: ShieldCheck,
    title: 'AI code scanner',
    body: 'Scan a repository for vulnerable packages and open a pull request that fixes them.',
    href: '/tools/ai-code-scanner'
  }
];

const IMAGE_TOOLS = [
  {
    icon: ImageDown,
    title: 'Compress image',
    body: 'Compress JPG, PNG, SVG, and GIFs while saving space and maintaining quality.',
    href: '/tools/compress-image'
  },
  {
    icon: Scaling,
    title: 'Resize image',
    body: 'Define your dimensions by percent or pixel, and resize your images.',
    href: '/tools/resize-image'
  },
  {
    icon: Crop,
    title: 'Crop image',
    body: 'Crop JPG, PNG, or GIFs with ease using pixels or a visual editor.',
    href: '/tools/crop-image'
  },
  {
    icon: FileImage,
    title: 'Convert image',
    body: 'Convert images between JPG, PNG, WebP, GIF, and other formats.',
    href: '/tools/convert-image'
  },
  {
    icon: Stamp,
    title: 'Watermark image',
    body: 'Stamp text over your images with custom typography, transparency, and position.',
    href: '/tools/watermark-image'
  },
  {
    icon: RotateCw,
    title: 'Rotate image',
    body: 'Rotate or flip JPG, PNG, or GIF images individually or in bulk.',
    href: '/tools/rotate-image'
  },
  {
    icon: Globe,
    title: 'HTML to image',
    body: 'Capture a full webpage or part of it as a PNG or JPEG.',
    href: '/tools/html-to-image'
  },
  {
    icon: FileCode,
    title: 'Image to Base64',
    body: 'Convert images to Base64 strings or decode Base64 back into an image.',
    href: '/tools/image-to-base64'
  },
  {
    icon: FlipHorizontal2,
    title: 'Flip image',
    body: 'Flip JPG, PNG, or WebP images horizontally or vertically.',
    href: '/tools/flip-image'
  },
  {
    icon: Pipette,
    title: 'Image color picker',
    body: 'Pick exact pixel colors from an image and extract its dominant palette.',
    href: '/tools/image-color-picker'
  },
  {
    icon: Info,
    title: 'Image EXIF viewer',
    body: 'View camera, exposure, and GPS metadata embedded in JPEG photos.',
    href: '/tools/image-exif-viewer'
  },
  {
    icon: ImagePlus,
    title: 'Favicon generator',
    body: 'Generate a full favicon set (16px to 512px) plus webmanifest and HTML markup.',
    href: '/tools/favicon-generator'
  }
];

const PDF_TOOLS = [
  {
    icon: Merge,
    title: 'Merge PDF',
    body: 'Combine multiple PDF files into a single document.',
    href: '/tools/merge-pdf'
  },
  {
    icon: Scissors,
    title: 'Split PDF',
    body: 'Extract page ranges from a PDF into separate files.',
    href: '/tools/split-pdf'
  },
  {
    icon: FileDown,
    title: 'Compress PDF',
    body: 'Reduce PDF file size while preserving content quality.',
    href: '/tools/compress-pdf'
  },
  {
    icon: RotateCw,
    title: 'Rotate PDF',
    body: 'Rotate PDF pages by 90°, 180°, or 270°.',
    href: '/tools/rotate-pdf'
  },
  {
    icon: Stamp,
    title: 'Watermark PDF',
    body: 'Add text watermarks to every page of a PDF.',
    href: '/tools/watermark-pdf'
  },
  {
    icon: Hash,
    title: 'Page Numbers',
    body: 'Add page numbers to PDF documents with custom formatting.',
    href: '/tools/page-numbers-pdf'
  },
  {
    icon: Lock,
    title: 'Protect PDF',
    body: 'Secure PDF files with password protection.',
    href: '/tools/protect-pdf'
  },
  {
    icon: Unlock,
    title: 'Unlock PDF',
    body: 'Remove password protection from PDF files.',
    href: '/tools/unlock-pdf'
  },
  {
    icon: FileUp,
    title: 'Image to PDF',
    body: 'Convert JPG, PNG, and WebP images to PDF documents.',
    href: '/tools/image-to-pdf'
  },
  {
    icon: Image,
    title: 'PDF to Image',
    body: 'Extract PDF pages as individual image files.',
    href: '/tools/pdf-to-image'
  },
  {
    icon: GripVertical,
    title: 'Organize PDF',
    body: 'Reorder, delete, and rearrange PDF pages.',
    href: '/tools/organize-pdf'
  },
  {
    icon: Crop,
    title: 'Crop PDF',
    body: 'Crop margins and trim PDF page borders.',
    href: '/tools/crop-pdf'
  },
  {
    icon: Wrench,
    title: 'Repair PDF',
    body: 'Fix and recover corrupted or damaged PDF files.',
    href: '/tools/repair-pdf'
  },
  {
    icon: CodeIcon,
    title: 'HTML to PDF',
    body: 'Convert HTML content to PDF documents.',
    href: '/tools/html-to-pdf'
  },
  {
    icon: FileText,
    title: 'Word to PDF',
    body: 'Convert Word documents (DOC, DOCX) to PDF.',
    href: '/tools/word-to-pdf'
  },
  {
    icon: FileText,
    title: 'PDF to Word',
    body: 'Convert PDF files to editable Word (DOCX) documents.',
    href: '/tools/pdf-to-word'
  },
  {
    icon: Sheet,
    title: 'Excel to PDF',
    body: 'Convert Excel spreadsheets (XLS, XLSX) to PDF.',
    href: '/tools/excel-to-pdf'
  },
  {
    icon: Sheet,
    title: 'PDF to Excel',
    body: 'Convert PDF files to Excel (XLSX) spreadsheets.',
    href: '/tools/pdf-to-excel'
  },
  {
    icon: Presentation,
    title: 'PowerPoint to PDF',
    body: 'Convert PowerPoint presentations (PPT, PPTX) to PDF.',
    href: '/tools/ppt-to-pdf'
  },
  {
    icon: Presentation,
    title: 'PDF to PowerPoint',
    body: 'Convert PDF files to PowerPoint (PPTX) presentations.',
    href: '/tools/pdf-to-ppt'
  },
  {
    icon: FileText,
    title: 'PDF to Text',
    body: 'Extract the real text content from any PDF.',
    href: '/tools/pdf-to-text'
  },
  {
    icon: FileSignature,
    title: 'PDF metadata editor',
    body: "View and edit a PDF's title, author, subject, and keywords.",
    href: '/tools/pdf-metadata-editor'
  },
  {
    icon: FileSearch,
    title: 'PDF info',
    body: 'Check page count, file size, version, encryption, and word count.',
    href: '/tools/pdf-info'
  },
  {
    icon: PenTool,
    title: 'Sign PDF',
    body: 'Draw a signature and stamp it onto any page of a PDF.',
    href: '/tools/sign-pdf'
  },
  {
    icon: Images,
    title: 'Extract images from PDF',
    body: 'Find and download every embedded image from a PDF.',
    href: '/tools/extract-images-from-pdf'
  }
];

const JSON_TOOLS = [
  {
    icon: Braces,
    title: 'JSON formatter',
    body: 'Format and beautify JSON with customizable indentation.',
    href: '/tools/json-formatter'
  },
  {
    icon: Minimize2,
    title: 'JSON minifier',
    body: 'Minify JSON by removing whitespace and reducing file size.',
    href: '/tools/json-minifier'
  },
  {
    icon: ShieldCheck,
    title: 'JSON validator',
    body: 'Validate JSON syntax and analyze structure with error location.',
    href: '/tools/json-validator'
  },
  {
    icon: FileSpreadsheet,
    title: 'JSON to CSV',
    body: 'Convert JSON arrays to CSV format for spreadsheets.',
    href: '/tools/json-to-csv'
  },
  {
    icon: FileText,
    title: 'JSON to YAML',
    body: 'Convert JSON to YAML format for configuration files.',
    href: '/tools/json-to-yaml'
  },
  {
    icon: FileCode,
    title: 'JSON to XML',
    body: 'Convert JSON to XML format with custom root tags.',
    href: '/tools/json-to-xml'
  },
  {
    icon: Table,
    title: 'JSON to TSV',
    body: 'Convert JSON arrays to tab-separated values.',
    href: '/tools/json-to-tsv'
  },
  {
    icon: Sheet,
    title: 'JSON to Excel',
    body: 'Convert JSON data to Excel (XLSX) spreadsheets.',
    href: '/tools/json-to-excel'
  },
  {
    icon: FileCode,
    title: 'JSON to TypeScript',
    body: 'Generate TypeScript interfaces from JSON automatically.',
    href: '/tools/json-to-typescript'
  },
  {
    icon: Layers,
    title: 'JSON Flatten/Unflatten',
    body: 'Flatten nested JSON into dot-notation keys, or unflatten it back.',
    href: '/tools/json-flatten-unflatten'
  },
  {
    icon: Link2,
    title: 'JSON ⇄ Query String',
    body: 'Convert JSON objects to URL query strings and back.',
    href: '/tools/json-query-string-converter'
  }
];

const XML_TOOLS = [
  {
    icon: FileCode,
    title: 'XML Formatter',
    body: 'Format and beautify XML with customizable indentation.',
    href: '/tools/xml-formatter'
  },
  {
    icon: Minimize2,
    title: 'XML Minifier',
    body: 'Minify XML by removing whitespace and reducing file size.',
    href: '/tools/xml-minifier'
  },
  {
    icon: ShieldCheck,
    title: 'XML Validator',
    body: 'Validate XML syntax and analyze document structure.',
    href: '/tools/xml-validator'
  },
  {
    icon: Braces,
    title: 'XML to JSON',
    body: 'Convert XML to JSON format for modern APIs.',
    href: '/tools/xml-to-json'
  },
  {
    icon: FileSpreadsheet,
    title: 'XML to CSV',
    body: 'Convert XML records to CSV format for spreadsheets.',
    href: '/tools/xml-to-csv'
  },
  {
    icon: FileText,
    title: 'XML to YAML',
    body: 'Convert XML to YAML format for configuration files.',
    href: '/tools/xml-to-yaml'
  },
  {
    icon: Table,
    title: 'XML to TSV',
    body: 'Convert XML records to tab-separated values.',
    href: '/tools/xml-to-tsv'
  },
  {
    icon: Sheet,
    title: 'XML to Excel',
    body: 'Convert XML data to Excel (XLSX) spreadsheets.',
    href: '/tools/xml-to-excel'
  },
  {
    icon: Route,
    title: 'XPath Tester',
    body: 'Test XPath expressions against XML documents and see matched nodes instantly.',
    href: '/tools/xpath-tester'
  },
  {
    icon: FileSpreadsheet,
    title: 'CSV to XML',
    body: 'Convert CSV spreadsheets to well-formed XML with configurable tag names.',
    href: '/tools/csv-to-xml'
  },
  {
    icon: FileText,
    title: 'YAML to XML',
    body: 'Convert YAML configuration files to well-formed XML.',
    href: '/tools/yaml-to-xml'
  }
];

const TEXT_TOOLS = [
  {
    icon: GitCompareArrows,
    title: 'Text Compare',
    body: 'Compare two texts side by side and find differences.',
    href: '/tools/text-compare'
  },
  {
    icon: Hash,
    title: 'Character Counter',
    body: 'Count characters, words, sentences, and paragraphs.',
    href: '/tools/character-counter'
  },
  {
    icon: WholeWord,
    title: 'Word Counter',
    body: 'Analyze word frequency and vocabulary density.',
    href: '/tools/word-counter'
  },
  {
    icon: CaseSensitive,
    title: 'Case Converter',
    body: 'Convert text between uppercase, lowercase, title case, and more.',
    href: '/tools/case-converter'
  },
  {
    icon: ScrollText,
    title: 'Lorem Ipsum Generator',
    body: 'Generate placeholder text for design and development.',
    href: '/tools/lorem-ipsum-generator'
  },
  {
    icon: Undo2,
    title: 'Text Reverser',
    body: 'Reverse text, words, or lines in various modes.',
    href: '/tools/text-reverser'
  },
  {
    icon: Link2,
    title: 'Slug Generator',
    body: 'Generate URL-friendly slugs from any text.',
    href: '/tools/slug-generator'
  },
  {
    icon: Eye,
    title: 'Markdown Preview',
    body: 'Live preview markdown with formatting.',
    href: '/tools/markdown-preview'
  },
  {
    icon: Lock,
    title: 'ROT13 / Caesar Cipher',
    body: 'Encode or decode text with a classic Caesar cipher, including ROT13.',
    href: '/tools/rot13-caesar-cipher'
  },
  {
    icon: Radio,
    title: 'Morse Code Converter',
    body: 'Convert text to Morse code and back, with full letter, digit, and punctuation support.',
    href: '/tools/morse-code-converter'
  },
  {
    icon: BarChart3,
    title: 'Letter Frequency Analyzer',
    body: 'Analyze how often each letter appears in your text, with counts and percentages.',
    href: '/tools/letter-frequency-analyzer'
  }
];

const DEV_TOOLS = [
  {
    icon: Fingerprint,
    title: 'UUID Generator',
    body: 'Generate UUIDs (v1, v4) for use in your applications.',
    href: '/tools/uuid-generator'
  },
  {
    icon: Palette,
    title: 'Color Converter',
    body: 'Convert colors between HEX, RGB, HSL, and other formats.',
    href: '/tools/color-converter'
  },
  {
    icon: ShieldCheck,
    title: 'JWT Decoder',
    body: 'Decode and inspect JSON Web Tokens without a server round-trip.',
    href: '/tools/jwt-decoder'
  },
  {
    icon: Clock3,
    title: 'Timestamp Converter',
    body: 'Convert between Unix timestamps and human-readable dates.',
    href: '/tools/timestamp-converter'
  },
  {
    icon: Minimize2,
    title: 'CSS Minifier',
    body: 'Minify CSS by removing whitespace and reducing file size.',
    href: '/tools/css-minifier'
  },
  {
    icon: CodeIcon,
    title: 'HTML Minifier',
    body: 'Minify HTML by removing whitespace and comments.',
    href: '/tools/html-minifier'
  },
  {
    icon: QrCode,
    title: 'QR Code Generator',
    body: 'Generate scannable QR codes from text or URLs.',
    href: '/tools/qr-code-generator'
  },
  {
    icon: KeyRound,
    title: 'Password Generator',
    body: 'Generate strong, cryptographically secure passwords with custom length and character sets.',
    href: '/tools/password-generator'
  },
  {
    icon: Binary,
    title: 'Number Base Converter',
    body: 'Convert numbers between binary, octal, decimal, and hexadecimal with arbitrary precision.',
    href: '/tools/number-base-converter'
  },
  {
    icon: Code2,
    title: 'HTML Entity Encoder/Decoder',
    body: 'Encode text into HTML entities or decode named and numeric entities back to text.',
    href: '/tools/html-entity-encoder-decoder'
  },
  {
    icon: Palette,
    title: 'CSS Gradient Generator',
    body: 'Design linear and radial CSS gradients visually and copy the generated CSS.',
    href: '/tools/css-gradient-generator'
  },
  {
    icon: Clock3,
    title: 'Cron Expression Parser',
    body: 'Parse, validate, and describe cron expressions, with next run-time predictions.',
    href: '/tools/cron-expression-parser'
  }
];

const PACKAGES = [
  {
    name: '@nayan-ui/cli',
    lead: 'Scaffold new projects from templates, generate XML sitemaps by crawling a site, and create or validate robots.txt files.',
    install: 'npm install -g @nayan-ui/cli\n\n# or, without installing\nnpx @nayan-ui/cli [command]',
    commands: `nayan-ui new
nayan-ui new my-app -t expo
nayan-ui create sitemap -w https://example.com
nayan-ui create robots -d /admin
nayan-ui validate sitemap -i ./sitemap.xml
nayan-ui validate robots -i ./robots.txt`,
    features: [
      {
        icon: Rocket,
        title: 'Project scaffolding',
        body: 'Create projects from the Expo, Games, Next.js and Vite templates.'
      },
      {
        icon: MapIcon,
        title: 'Sitemaps',
        body: 'Crawl a website to generate an XML sitemap, or validate an existing one.'
      },
      {
        icon: Bot,
        title: 'Robots.txt',
        body: 'Create and validate robots.txt files for crawler control.'
      },
      {
        icon: Keyboard,
        title: 'Interactive or not',
        body: 'Prompts when you want them, flags when you are scripting CI.'
      }
    ]
  },
  {
    name: '@nayan-ui/ai',
    lead: 'Codex and Claude Code agents that review GitHub pull requests and scan repositories for vulnerable dependencies, with auto-fix.',
    install: 'npm install -g @nayan-ui/ai\n\n# or, without installing\nnpx @nayan-ui/ai [command]',
    commands: `nayan-ai review <pr-url> -t ghp_xxx
nayan-ai review <pr-url> -t ghp_xxx --dry
nayan-ai review <pr-url> -t ghp_xxx --inline
nayan-ai scan <repo-url> -t ghp_xxx
nayan-ai scan <repo-url> -t ghp_xxx --fix
nayan-ai scan <repo-url> -t ghp_xxx --llm claude`,
    features: [
      {
        icon: Bug,
        title: 'AI code review',
        body: 'Deep pull-request analysis for bugs, security, performance and test coverage.'
      },
      {
        icon: ShieldCheck,
        title: 'Vulnerability scanning',
        body: 'Package vulnerabilities across npm, Python, Go, Rust and more.'
      },
      {
        icon: Wrench,
        title: 'Auto-fix and PRs',
        body: 'Fix what it finds and open a pull request describing the change.'
      },
      {
        icon: Bot,
        title: 'Two providers',
        body: 'Codex by default, or Claude Code with one flag.'
      }
    ]
  }
];

const TOOL_GROUPS = [
  { id: 'seo-tools', tone: 'mint', icon: Globe, label: 'SEO', description: 'Sitemaps, crawl directives, metadata, and URLs.', tools: SEO_TOOLS },
  { id: 'ai-tools', tone: 'violet', icon: Bot, label: 'AI', description: 'Code review and dependency scanning.', tools: AI_TOOLS },
  { id: 'image-tools', tone: 'pink', icon: Image, label: 'Image', description: 'Edit and convert images.', tools: IMAGE_TOOLS },
  { id: 'pdf-tools', tone: 'peach', icon: FileText, label: 'PDF', description: 'Merge, split, compress, convert, and protect PDFs.', tools: PDF_TOOLS },
  { id: 'json-tools', tone: 'lime', icon: Braces, label: 'JSON', description: 'Format, validate, and convert JSON.', tools: JSON_TOOLS },
  { id: 'xml-tools', tone: 'blue', icon: Code2, label: 'XML', description: 'Format, validate, and convert XML.', tools: XML_TOOLS },
  { id: 'text-tools', tone: 'pink', icon: WholeWord, label: 'Text', description: 'Compare, count, convert, and transform text.', tools: TEXT_TOOLS },
  { id: 'developer-tools', tone: 'violet', icon: Wrench, label: 'Developer', description: 'UUIDs, colors, tokens, cron, and other utilities.', tools: DEV_TOOLS }
];

const DevtoolsMain = () => {
  return (
    <Sidebar title="Developer Tools">
      <DocsIntro
        lead="Find a guide by file format or task. The command-line examples cover scaffolding, SEO, code review and dependency checks."
        actions={
          <>
            <Link href="/game-engine/installation#start-from-the-template" className={BUTTON_SMALL}>
              <Rocket aria-hidden className="mr-2 h-4 w-4" />
              Starter CLI
            </Link>
            <Link href="https://www.npmjs.com/package/@nayan-ui/cli" target="_blank" rel="noopener noreferrer" className={BUTTON_SMALL}>
              <Package aria-hidden className="mr-2 h-4 w-4" />
              @nayan-ui/cli
            </Link>
            <Link href="https://www.npmjs.com/package/@nayan-ui/ai" target="_blank" rel="noopener noreferrer" className={BUTTON_SMALL}>
              <Package aria-hidden className="mr-2 h-4 w-4" />
              @nayan-ui/ai
            </Link>
            <Link href={REPO_URL} target="_blank" rel="noopener noreferrer" className={BUTTON_SMALL}>
              <Github aria-hidden className="mr-2 h-4 w-4" />
              View source
            </Link>
          </>
        }
      />

      <NView tag="nav" aria-label="Tool categories" className="site-category-grid grid [grid-template-columns:repeat(auto-fit,_minmax(min(100%,_8.25rem),_1fr))] [gap:0.6rem] [margin-bottom:1.85rem]">
        {TOOL_GROUPS.map(({ id, label, tone, icon: Icon }) => (
          <NView tag="a" key={id} href={`#${id}`} data-tone={tone} className="site-category-link flex items-center [gap:0.48rem] [min-height:2.95rem] [padding:0.55rem_0.65rem] [border:1px_solid_color-mix(in_srgb,_var(--tone-ink)_15%,_transparent)] [border-radius:0.7rem] [background:var(--tone-paper)] [color:var(--tone-ink)] [font-size:0.82rem] [font-weight:680] hover:[border-color:var(--tone-ink)] [&_svg]:shrink-0 [&_svg:last-child]:ml-auto">
            <Icon aria-hidden size={19} />
            <NText tag="span">{label}</NText>
            <ArrowUpRight aria-hidden size={15} />
          </NView>
        ))}
        <NView tag="a" href="#nayan-ui-cli" data-tone="blue" className="site-category-link flex items-center [gap:0.48rem] [min-height:2.95rem] [padding:0.55rem_0.65rem] [border:1px_solid_color-mix(in_srgb,_var(--tone-ink)_15%,_transparent)] [border-radius:0.7rem] [background:var(--tone-paper)] [color:var(--tone-ink)] [font-size:0.82rem] [font-weight:680] hover:[border-color:var(--tone-ink)] [&_svg]:shrink-0 [&_svg:last-child]:ml-auto">
          <Keyboard aria-hidden size={19} />
          <NText tag="span">Command line</NText>
          <ArrowUpRight aria-hidden size={15} />
        </NView>
      </NView>

      {TOOL_GROUPS.map(({ id, label, description, tone, tools }) => (
        <SubHeader key={id} id={id} title={`${label} Tools`} description={description}>
          <NView tag="div" className={`grid sm:grid-cols-2 xl:grid-cols-3 ${GRID_GAP}`}>
            {tools.map(({ href, icon: Icon, title, body }) => (
              <Link key={href} href={href} data-tone={tone} className={`${CARD_INTERACTIVE} catalog-entry [background:linear-gradient(140deg,_color-mix(in_srgb,_var(--tone-paper,_var(--surface-secondary))_34%,_var(--surface)),_var(--surface)_74%)] group block p-4 sm:p-5`}>
                <NView tag="div" className="mb-3 flex items-center justify-between gap-3">
                  <NText tag="span" className="catalog-entry-icon inline-flex justify-center items-center shrink-0 [width:2.15rem] [height:2.15rem] [border-radius:0.62rem] [background:var(--tone-paper,_var(--surface-secondary))] [color:var(--tone-ink,_var(--accent))]">
                    <Icon aria-hidden size={18} />
                  </NText>
                  <ArrowRight aria-hidden size={16} className="shrink-0 text-muted transition-colors group-hover:text-accent" />
                </NView>
                <NText tag="h3" className={H3}>{title}</NText>
                <NText tag="p" className="mt-1.5 text-sm leading-relaxed text-muted">{body}</NText>
              </Link>
            ))}
          </NView>
        </SubHeader>
      ))}

      {PACKAGES.map((pkg) => (
        <SubHeader key={pkg.name} title={pkg.name} description={pkg.lead}>
          <NView tag="div" className="grid min-w-0 gap-5 lg:grid-cols-2">
            <NView tag="div" className="min-w-0 space-y-4">
              <NView tag="div">
                <NText tag="h4" className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Install</NText>
                <Code code={pkg.install} language="bash" filename="terminal" />
              </NView>
              <NView tag="div">
                <NText tag="h4" className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Commands</NText>
                <Code code={pkg.commands} language="bash" filename="terminal" />
              </NView>
            </NView>

            <NView tag="div" className={`${CARD} p-5`}>
              <NText tag="h4" className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">What it does</NText>
              <NView tag="ul" className="space-y-4">
                {pkg.features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <NView tag="li" key={feature.title} className="flex items-start gap-3">
                      <NText tag="span" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${ACCENT_SOFT}`}>
                        <Icon className="h-4 w-4" />
                      </NText>
                      <NText tag="span">
                        <NText tag="span" className="block text-sm font-semibold text-foreground">{feature.title}</NText>
                        <NText tag="span" className="mt-0.5 block text-sm leading-relaxed text-muted">{feature.body}</NText>
                      </NText>
                    </NView>
                  );
                })}
              </NView>
            </NView>
          </NView>
        </SubHeader>
      ))}
    </Sidebar>
  );
};

export default DevtoolsMain;
