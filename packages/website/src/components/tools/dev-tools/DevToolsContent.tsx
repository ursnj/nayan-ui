import { NView, NText } from 'nayan-ui/components';
import { H2_DOC, H3_DOC } from '@/design/system';

export const UuidGeneratorContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Generate UUIDs?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Universally Unique Identifiers (UUIDs) are 128-bit values used as primary keys, session tokens, correlation IDs, and more. Version&nbsp;4 UUIDs
      are generated from cryptographically secure random numbers, making collisions effectively impossible.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Generating primary keys for database rows without a central sequence.</NView>
      <NView tag="li">Creating unique session or request IDs for distributed systems.</NView>
      <NView tag="li">Seeding test data with realistic-looking identifiers.</NView>
      <NView tag="li">Producing correlation IDs for tracing requests across microservices.</NView>
    </NView>
  </NView>
);

export const ColorConverterContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Convert Colours?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Different tools and frameworks expect colours in different formats. Figma exports HEX, CSS gradients often use RGBA, Tailwind needs class names,
      and HSL is ideal for programmatic colour manipulation.
    </NText>

    <NText tag="h3" className={H3_DOC}>When to Use Each Format</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">
        <NText tag="strong">HEX</NText> &mdash; CSS properties, design tokens, brand guidelines.
      </NView>
      <NView tag="li">
        <NText tag="strong">RGB / RGBA</NText> &mdash; CSS <NText tag="code">rgba()</NText> functions, Canvas API, transparency control.
      </NView>
      <NView tag="li">
        <NText tag="strong">HSL</NText> &mdash; programmatic lightening/darkening, generating palettes.
      </NView>
      <NView tag="li">
        <NText tag="strong">Tailwind</NText> &mdash; utility-first CSS frameworks.
      </NView>
    </NView>
  </NView>
);

export const JwtDecoderContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Decode JWTs?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      JSON Web Tokens (JWT) are the standard for stateless authentication in modern APIs. Debugging auth issues requires inspecting the token&apos;s
      header (algorithm), payload (claims, expiry), and signature.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Debugging 401 errors by inspecting token expiration and claims.</NView>
      <NView tag="li">Verifying that OAuth providers return the expected scopes and audience.</NView>
      <NView tag="li">Checking token structure during API integration testing.</NView>
      <NView tag="li">Learning JWT anatomy for security training or documentation.</NView>
    </NView>
  </NView>
);

export const TimestampConverterContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Convert Timestamps?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Unix timestamps are the lingua franca of time in programming &mdash; compact integers that represent seconds (or milliseconds) since
      1&nbsp;January&nbsp;1970. But they&apos;re unreadable to humans.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Reading timestamps from server logs, database records, or API responses.</NView>
      <NView tag="li">Generating epoch values for cron jobs, cache TTLs, or scheduling APIs.</NView>
      <NView tag="li">Comparing timestamps across time zones in distributed systems.</NView>
      <NView tag="li">
        Debugging JWT <NText tag="code">iat</NText> / <NText tag="code">exp</NText> claims.
      </NView>
    </NView>
  </NView>
);

export const CssMinifierContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Minify CSS?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Every unnecessary byte in your stylesheet slows page rendering. Minifying CSS removes comments, collapses whitespace, and strips redundant
      semicolons &mdash; often reducing file size by 30&ndash;60&nbsp;%. The result loads faster, scores better on Lighthouse, and costs less
      bandwidth.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Preparing stylesheets for production deployment.</NView>
      <NView tag="li">
        Reducing payload size for inline <NText tag="code">&lt;style&gt;</NText> blocks in emails.
      </NView>
      <NView tag="li">Optimising critical CSS for above-the-fold rendering.</NView>
      <NView tag="li">Shrinking third-party CSS before embedding in a bundle.</NView>
    </NView>
  </NView>
);

export const HtmlMinifierContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Minify HTML?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      HTML comments, extra whitespace, and unnecessary gaps between tags add kilobytes to every page load. Minifying HTML strips all of this without
      changing the rendered output, resulting in faster time-to-first-byte and better Core Web Vitals scores.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Optimising HTML email templates that have strict size limits.</NView>
      <NView tag="li">Reducing static HTML page size before deploying to a CDN.</NView>
      <NView tag="li">Preparing server-rendered HTML for embedding in API responses.</NView>
      <NView tag="li">Cleaning up generated HTML from WYSIWYG editors.</NView>
    </NView>
  </NView>
);

export const QrCodeGeneratorContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Generate QR Codes?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      QR codes bridge the physical and digital worlds. A single scan takes a customer to your website, adds a contact, connects to Wi-Fi, or opens a
      payment link.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Adding scannable links to business cards, flyers, and posters.</NView>
      <NView tag="li">Generating Wi-Fi QR codes for office or event guest access.</NView>
      <NView tag="li">Creating payment links for invoices and point-of-sale displays.</NView>
      <NView tag="li">Encoding URLs for product packaging, menus, and event tickets.</NView>
    </NView>
  </NView>
);

export const PasswordGeneratorContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Use a Password Generator?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Reused or predictable passwords are the single biggest cause of account takeovers. A generator drawing from the browser&apos;s cryptographically
      secure random number source (<NText tag="code">crypto.getRandomValues</NText>) produces passwords that are infeasible to guess or brute-force within any
      practical timeframe.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Creating unique passwords for every account instead of reusing one.</NView>
      <NView tag="li">Generating API keys or secrets for local development and testing.</NView>
      <NView tag="li">Setting up temporary credentials for shared or guest accounts.</NView>
    </NView>
  </NView>
);

export const NumberBaseConverterContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Convert Number Bases?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Binary, octal, decimal, and hexadecimal are different representations of the same value. Use integer arithmetic to preserve precision when
      converting values larger than JavaScript’s safe integer range.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Converting Unix file permission bits between octal and decimal.</NView>
      <NView tag="li">Reading hexadecimal memory addresses or colour values as decimal.</NView>
      <NView tag="li">Working with bitmask flags defined in binary.</NView>
    </NView>
  </NView>
);

export const HtmlEntityEncoderDecoderContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Encode HTML Entities?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Characters like <NText tag="code">&lt;</NText>, <NText tag="code">&amp;</NText>, and <NText tag="code">&quot;</NText> have special meaning in HTML and must be escaped before
      they&apos;re safely rendered as literal text &mdash; otherwise they can break markup or open the door to injection issues.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Safely embedding user-supplied text inside HTML templates.</NView>
      <NView tag="li">Debugging mangled text copied from a rendered web page.</NView>
      <NView tag="li">Preparing content for XML or RSS feeds that require entity escaping.</NView>
    </NView>
  </NView>
);

export const CssGradientGeneratorContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Use a Gradient Generator?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      CSS gradients use colour stops to interpolate between colours. Linear gradients have a direction or angle, while radial and conic gradients are
      positioned around a centre.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Designing hero section or button background gradients.</NView>
      <NView tag="li">Building colour overlays for images and cards.</NView>
      <NView tag="li">Prototyping brand colour transitions without a design tool.</NView>
    </NView>
  </NView>
);

export const CronExpressionParserContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Parse Cron Expressions?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Read a cron expression field by field and check the scheduler’s syntax and time zone. Preview several execution times to catch schedule mistakes
      around midnight or daylight saving changes.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Verifying a cron schedule before deploying a scheduled job or CI pipeline.</NView>
      <NView tag="li">Understanding an unfamiliar cron expression found in legacy infrastructure code.</NView>
      <NView tag="li">Checking exactly when a backup, report, or cleanup task will next run.</NView>
    </NView>
  </NView>
);
