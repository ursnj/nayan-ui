import { H2_DOC, H3_DOC } from '@/design/system';

export const UuidGeneratorContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Generate UUIDs?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Universally Unique Identifiers (UUIDs) are 128-bit values used as primary keys, session tokens, correlation IDs, and more. Version&nbsp;4 UUIDs
      are generated from cryptographically secure random numbers, making collisions effectively impossible.
    </p>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Generating primary keys for database rows without a central sequence.</li>
      <li>Creating unique session or request IDs for distributed systems.</li>
      <li>Seeding test data with realistic-looking identifiers.</li>
      <li>Producing correlation IDs for tracing requests across microservices.</li>
    </ul>
  </div>
);

export const ColorConverterContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert Colours?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Different tools and frameworks expect colours in different formats. Figma exports HEX, CSS gradients often use RGBA, Tailwind needs class names,
      and HSL is ideal for programmatic colour manipulation.
    </p>

    <h3 className={H3_DOC}>When to Use Each Format</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>
        <strong>HEX</strong> &mdash; CSS properties, design tokens, brand guidelines.
      </li>
      <li>
        <strong>RGB / RGBA</strong> &mdash; CSS <code>rgba()</code> functions, Canvas API, transparency control.
      </li>
      <li>
        <strong>HSL</strong> &mdash; programmatic lightening/darkening, generating palettes.
      </li>
      <li>
        <strong>Tailwind</strong> &mdash; utility-first CSS frameworks.
      </li>
    </ul>
  </div>
);

export const JwtDecoderContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Decode JWTs?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      JSON Web Tokens (JWT) are the standard for stateless authentication in modern APIs. Debugging auth issues requires inspecting the token&apos;s
      header (algorithm), payload (claims, expiry), and signature.
    </p>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Debugging 401 errors by inspecting token expiration and claims.</li>
      <li>Verifying that OAuth providers return the expected scopes and audience.</li>
      <li>Checking token structure during API integration testing.</li>
      <li>Learning JWT anatomy for security training or documentation.</li>
    </ul>
  </div>
);

export const TimestampConverterContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert Timestamps?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Unix timestamps are the lingua franca of time in programming &mdash; compact integers that represent seconds (or milliseconds) since
      1&nbsp;January&nbsp;1970. But they&apos;re unreadable to humans.
    </p>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Reading timestamps from server logs, database records, or API responses.</li>
      <li>Generating epoch values for cron jobs, cache TTLs, or scheduling APIs.</li>
      <li>Comparing timestamps across time zones in distributed systems.</li>
      <li>
        Debugging JWT <code>iat</code> / <code>exp</code> claims.
      </li>
    </ul>
  </div>
);

export const CssMinifierContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Minify CSS?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Every unnecessary byte in your stylesheet slows page rendering. Minifying CSS removes comments, collapses whitespace, and strips redundant
      semicolons &mdash; often reducing file size by 30&ndash;60&nbsp;%. The result loads faster, scores better on Lighthouse, and costs less
      bandwidth.
    </p>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Preparing stylesheets for production deployment.</li>
      <li>
        Reducing payload size for inline <code>&lt;style&gt;</code> blocks in emails.
      </li>
      <li>Optimising critical CSS for above-the-fold rendering.</li>
      <li>Shrinking third-party CSS before embedding in a bundle.</li>
    </ul>
  </div>
);

export const HtmlMinifierContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Minify HTML?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      HTML comments, extra whitespace, and unnecessary gaps between tags add kilobytes to every page load. Minifying HTML strips all of this without
      changing the rendered output, resulting in faster time-to-first-byte and better Core Web Vitals scores.
    </p>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Optimising HTML email templates that have strict size limits.</li>
      <li>Reducing static HTML page size before deploying to a CDN.</li>
      <li>Preparing server-rendered HTML for embedding in API responses.</li>
      <li>Cleaning up generated HTML from WYSIWYG editors.</li>
    </ul>
  </div>
);

export const QrCodeGeneratorContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Generate QR Codes?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      QR codes bridge the physical and digital worlds. A single scan takes a customer to your website, adds a contact, connects to Wi-Fi, or opens a
      payment link.
    </p>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Adding scannable links to business cards, flyers, and posters.</li>
      <li>Generating Wi-Fi QR codes for office or event guest access.</li>
      <li>Creating payment links for invoices and point-of-sale displays.</li>
      <li>Encoding URLs for product packaging, menus, and event tickets.</li>
    </ul>
  </div>
);

export const PasswordGeneratorContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Use a Password Generator?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Reused or predictable passwords are the single biggest cause of account takeovers. A generator drawing from the browser&apos;s cryptographically
      secure random number source (<code>crypto.getRandomValues</code>) produces passwords that are infeasible to guess or brute-force within any
      practical timeframe.
    </p>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Creating unique passwords for every account instead of reusing one.</li>
      <li>Generating API keys or secrets for local development and testing.</li>
      <li>Setting up temporary credentials for shared or guest accounts.</li>
    </ul>
  </div>
);

export const NumberBaseConverterContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert Number Bases?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Binary, octal, decimal, and hexadecimal are different representations of the same value. Use integer arithmetic to preserve precision when
      converting values larger than JavaScript’s safe integer range.
    </p>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Converting Unix file permission bits between octal and decimal.</li>
      <li>Reading hexadecimal memory addresses or colour values as decimal.</li>
      <li>Working with bitmask flags defined in binary.</li>
    </ul>
  </div>
);

export const HtmlEntityEncoderDecoderContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Encode HTML Entities?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Characters like <code>&lt;</code>, <code>&amp;</code>, and <code>&quot;</code> have special meaning in HTML and must be escaped before
      they&apos;re safely rendered as literal text &mdash; otherwise they can break markup or open the door to injection issues.
    </p>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Safely embedding user-supplied text inside HTML templates.</li>
      <li>Debugging mangled text copied from a rendered web page.</li>
      <li>Preparing content for XML or RSS feeds that require entity escaping.</li>
    </ul>
  </div>
);

export const CssGradientGeneratorContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Use a Gradient Generator?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      CSS gradients use colour stops to interpolate between colours. Linear gradients have a direction or angle, while radial and conic gradients are
      positioned around a centre.
    </p>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Designing hero section or button background gradients.</li>
      <li>Building colour overlays for images and cards.</li>
      <li>Prototyping brand colour transitions without a design tool.</li>
    </ul>
  </div>
);

export const CronExpressionParserContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Parse Cron Expressions?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Read a cron expression field by field and check the scheduler’s syntax and time zone. Preview several execution times to catch schedule mistakes
      around midnight or daylight saving changes.
    </p>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Verifying a cron schedule before deploying a scheduled job or CI pipeline.</li>
      <li>Understanding an unfamiliar cron expression found in legacy infrastructure code.</li>
      <li>Checking exactly when a backup, report, or cleanup task will next run.</li>
    </ul>
  </div>
);
