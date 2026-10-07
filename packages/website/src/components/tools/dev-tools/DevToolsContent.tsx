import { H2_DOC, H3_DOC } from "@/design/system";

export const UuidGeneratorContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Generate UUIDs?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Universally Unique Identifiers (UUIDs) are 128-bit values used as primary keys, session tokens,
      correlation IDs, and more. Version&nbsp;4 UUIDs are generated from cryptographically secure random
      numbers, making collisions effectively impossible. Our generator uses the native
      <code> crypto.randomUUID()</code> API for maximum entropy and speed.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Batch generation</strong> &mdash; create 1 to 100 UUIDs in a single click.</li>
      <li><strong>Crypto-secure</strong> &mdash; powered by the browser&apos;s native <code>crypto.randomUUID()</code>.</li>
      <li><strong>Copy individual</strong> &mdash; click any UUID to copy it to the clipboard.</li>
      <li><strong>Copy all</strong> &mdash; grab every UUID at once, separated by newlines.</li>
      <li><strong>Regenerate</strong> &mdash; get a fresh batch without reloading the page.</li>
    </ul>

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
      Different tools and frameworks expect colours in different formats. Figma exports HEX, CSS
      gradients often use RGBA, Tailwind needs class names, and HSL is ideal for programmatic
      colour manipulation. Our converter shows all formats at once so you never have to calculate
      manually.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Visual colour picker</strong> &mdash; use the native browser picker or type a hex value.</li>
      <li><strong>Five formats</strong> &mdash; HEX, RGB, RGBA, HSL, and Tailwind CSS class.</li>
      <li><strong>Live preview swatch</strong> &mdash; see the colour rendered in real time.</li>
      <li><strong>Copy individual formats</strong> &mdash; click any value to copy it.</li>
      <li><strong>Tailwind output</strong> &mdash; get the closest Tailwind utility class for your colour.</li>
    </ul>

    <h3 className={H3_DOC}>When to Use Each Format</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>HEX</strong> &mdash; CSS properties, design tokens, brand guidelines.</li>
      <li><strong>RGB / RGBA</strong> &mdash; CSS <code>rgba()</code> functions, Canvas API, transparency control.</li>
      <li><strong>HSL</strong> &mdash; programmatic lightening/darkening, generating palettes.</li>
      <li><strong>Tailwind</strong> &mdash; utility-first CSS frameworks.</li>
    </ul>
  </div>
);

export const JwtDecoderContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Decode JWTs?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      JSON Web Tokens (JWT) are the standard for stateless authentication in modern APIs. Debugging
      auth issues requires inspecting the token&apos;s header (algorithm), payload (claims, expiry),
      and signature. Our decoder splits the token instantly and flags whether it has expired.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Header inspection</strong> &mdash; see the signing algorithm (HS256, RS256, etc.) and token type.</li>
      <li><strong>Payload decoding</strong> &mdash; all claims displayed as formatted JSON.</li>
      <li><strong>Expiration badge</strong> &mdash; green &ldquo;Valid&rdquo; or red &ldquo;Expired&rdquo; indicator.</li>
      <li><strong>Human-readable timestamps</strong> &mdash; <code>iat</code> and <code>exp</code> shown as local dates.</li>
      <li><strong>Signature display</strong> &mdash; the raw signature string for verification reference.</li>
    </ul>

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
      Unix timestamps are the lingua franca of time in programming &mdash; compact integers that
      represent seconds (or milliseconds) since 1&nbsp;January&nbsp;1970. But they&apos;re unreadable
      to humans. Our converter bridges the gap, turning cryptic numbers into clear dates and back
      again.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Bidirectional conversion</strong> &mdash; timestamp &rarr; date and date &rarr; timestamp.</li>
      <li><strong>Auto-detect precision</strong> &mdash; handles both seconds and milliseconds.</li>
      <li><strong>Multiple formats</strong> &mdash; UTC, ISO&nbsp;8601, local time, and relative time.</li>
      <li><strong>&ldquo;Use Current Time&rdquo; button</strong> &mdash; instantly fill in the current timestamp.</li>
      <li><strong>Copy to clipboard</strong> &mdash; click any result to copy it.</li>
    </ul>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Reading timestamps from server logs, database records, or API responses.</li>
      <li>Generating epoch values for cron jobs, cache TTLs, or scheduling APIs.</li>
      <li>Comparing timestamps across time zones in distributed systems.</li>
      <li>Debugging JWT <code>iat</code> / <code>exp</code> claims.</li>
    </ul>
  </div>
);

export const CssMinifierContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Minify CSS?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Every unnecessary byte in your stylesheet slows page rendering. Minifying CSS removes comments,
      collapses whitespace, and strips redundant semicolons &mdash; often reducing file size by
      30&ndash;60&nbsp;%. The result loads faster, scores better on Lighthouse, and costs less
      bandwidth.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Comment removal</strong> &mdash; strips all <code>/* &hellip; */</code> block comments.</li>
      <li><strong>Whitespace collapse</strong> &mdash; collapses multiple spaces, tabs, and newlines into one.</li>
      <li><strong>Semicolon cleanup</strong> &mdash; removes trailing semicolons before closing braces.</li>
      <li><strong>Size comparison</strong> &mdash; see original vs minified byte count and savings percentage.</li>
      <li><strong>Copy to clipboard</strong> &mdash; grab the minified output with one click.</li>
    </ul>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Preparing stylesheets for production deployment.</li>
      <li>Reducing payload size for inline <code>&lt;style&gt;</code> blocks in emails.</li>
      <li>Optimising critical CSS for above-the-fold rendering.</li>
      <li>Shrinking third-party CSS before embedding in a bundle.</li>
    </ul>
  </div>
);

export const HtmlMinifierContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Minify HTML?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      HTML comments, extra whitespace, and unnecessary gaps between tags add kilobytes to every page
      load. Minifying HTML strips all of this without changing the rendered output, resulting in
      faster time-to-first-byte and better Core Web Vitals scores.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Comment removal</strong> &mdash; strips all <code>&lt;!-- &hellip; --&gt;</code> comments.</li>
      <li><strong>Whitespace collapse</strong> &mdash; reduces runs of spaces, tabs, and newlines to single spaces.</li>
      <li><strong>Inter-tag cleanup</strong> &mdash; removes whitespace between closing and opening tags.</li>
      <li><strong>Size comparison</strong> &mdash; see original vs minified byte count and savings percentage.</li>
      <li><strong>Copy to clipboard</strong> &mdash; grab the minified HTML with one click.</li>
    </ul>

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
      QR codes bridge the physical and digital worlds. A single scan takes a customer to your
      website, adds a contact, connects to Wi-Fi, or opens a payment link. Our generator creates
      QR codes entirely in the browser using a canvas-based renderer &mdash; no server uploads, no
      tracking, no limits.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Any text or URL</strong> &mdash; encode links, plain text, email addresses, phone numbers, or Wi-Fi credentials.</li>
      <li><strong>Customisable size</strong> &mdash; choose 128&times;128, 256&times;256, 512&times;512, or 1024&times;1024 pixels.</li>
      <li><strong>Real-time preview</strong> &mdash; the QR code updates as you type.</li>
      <li><strong>PNG download</strong> &mdash; save the QR code as a high-resolution image file.</li>
      <li><strong>Client-side rendering</strong> &mdash; generated on a <code>&lt;canvas&gt;</code>, nothing is uploaded.</li>
    </ul>

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
      Reused or predictable passwords are the single biggest cause of account takeovers. A generator
      drawing from the browser&apos;s cryptographically secure random number source (
      <code>crypto.getRandomValues</code>) produces passwords that are infeasible to guess or
      brute-force within any practical timeframe.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Cryptographically secure</strong> &mdash; uses <code>crypto.getRandomValues</code>, not <code>Math.random()</code>.</li>
      <li><strong>Configurable length</strong> &mdash; from 4 to 128 characters.</li>
      <li><strong>Character set toggles</strong> &mdash; uppercase, lowercase, numbers, symbols.</li>
      <li><strong>Ambiguous character exclusion</strong> &mdash; skip 0/O, 1/l/I for easier manual entry.</li>
      <li><strong>Entropy estimate</strong> &mdash; see the password&apos;s strength in bits at a glance.</li>
    </ul>

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
      Binary, octal, decimal, and hexadecimal all describe the same quantity in different radixes.
      Developers move between them constantly &mdash; reading memory addresses, bitmasks, file
      permissions, and colour codes. Our converter keeps all four in sync as you type, using
      arbitrary-precision math so even very large numbers convert without rounding errors.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Four linked fields</strong> &mdash; binary, octal, decimal, hexadecimal update together.</li>
      <li><strong>Arbitrary precision</strong> &mdash; backed by <code>BigInt</code>, no 2^53 precision loss.</li>
      <li><strong>Negative number support</strong> &mdash; signed values convert correctly in every base.</li>
      <li><strong>Inline validation</strong> &mdash; invalid digits for the current base are flagged immediately.</li>
    </ul>

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
      Characters like <code>&lt;</code>, <code>&amp;</code>, and <code>&quot;</code> have special
      meaning in HTML and must be escaped before they&apos;re safely rendered as literal text &mdash;
      otherwise they can break markup or open the door to injection issues. Our tool encodes and
      decodes entities instantly, including named (<code>&amp;amp;</code>) and numeric (
      <code>&amp;#38;</code>) forms.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Encode &amp; decode</strong> &mdash; convert in either direction.</li>
      <li><strong>Named and numeric entities</strong> &mdash; decodes both <code>&amp;amp;</code> and <code>&amp;#38;</code> / <code>&amp;#x26;</code> forms.</li>
      <li><strong>Non-ASCII mode</strong> &mdash; optionally escape every non-ASCII character as a numeric entity.</li>
    </ul>

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
      Hand-writing multi-stop CSS gradients means juggling angle math and percentage positions in your
      head. This tool gives you a live visual preview with draggable stops, so you can design the
      exact gradient you want and copy valid CSS straight into your stylesheet.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Linear &amp; radial</strong> &mdash; switch between gradient types instantly.</li>
      <li><strong>Up to 6 colour stops</strong> &mdash; add, remove, and reposition stops freely.</li>
      <li><strong>Angle control</strong> &mdash; fine-tune linear gradient direction from 0&ndash;360&deg;.</li>
      <li><strong>Live preview</strong> &mdash; see the exact rendered gradient as you edit.</li>
      <li><strong>Copy valid CSS</strong> &mdash; grab a ready-to-use <code>background</code> declaration.</li>
    </ul>

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
      Cron syntax is compact but notoriously easy to misread &mdash; a misplaced field can schedule a
      job every minute instead of once a day. Our parser validates every field, explains what the
      expression means in plain language, and lists the next five times it will actually fire.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Full field support</strong> &mdash; wildcards, lists, ranges, and step values.</li>
      <li><strong>Plain-language description</strong> &mdash; derived directly from your expression.</li>
      <li><strong>Next 5 run times</strong> &mdash; simulated forward from the current moment.</li>
      <li><strong>Validation</strong> &mdash; clear errors for malformed or out-of-range fields.</li>
    </ul>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Verifying a cron schedule before deploying a scheduled job or CI pipeline.</li>
      <li>Understanding an unfamiliar cron expression found in legacy infrastructure code.</li>
      <li>Checking exactly when a backup, report, or cleanup task will next run.</li>
    </ul>
  </div>
);
