import { H2_DOC, H3_DOC } from '@/design/system';

export const SitemapGeneratorContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Use a Sitemap?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      An XML sitemap lists the canonical URLs you want search engines to discover. It helps crawlers find new or sparsely linked pages and can
      communicate when a page was last updated.
    </p>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      List absolute canonical URLs in a sitemap.xml document, with a url element for each page and its address in loc. Add lastmod only when it
      reflects a meaningful change. Publish the sitemap and include its URL in robots.txt.
    </p>

    <h3 className={H3_DOC}>Common Use Cases</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Generating sitemaps for new websites before submitting to Google Search Console.</li>
      <li>Rebuilding sitemaps after a site migration or URL restructure.</li>
      <li>Auditing which pages are discoverable by search engine crawlers.</li>
      <li>Creating sitemaps for static sites that don&apos;t have a built-in sitemap generator.</li>
    </ul>
  </div>
);

export const SitemapValidatorContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Validate Your Sitemap?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Check that the sitemap is well-formed XML and each entry provides an absolute URL. Validate the namespace and ensure the listed URLs are the
      canonical pages you want crawlers to discover.
    </p>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Parse the XML first, then check the namespace, loc values, and date format. Confirm that the sitemap is accessible and that listed URLs return
      the intended pages.
    </p>

    <h3 className={H3_DOC}>What Gets Checked</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Valid XML syntax — no unclosed tags, mismatched elements, or encoding errors.</li>
      <li>Root element must be &lt;urlset&gt; with the correct xmlns namespace.</li>
      <li>Every &lt;url&gt; must contain a &lt;loc&gt; with a valid absolute URL.</li>
      <li>&lt;changefreq&gt; must be one of: always, hourly, daily, weekly, monthly, yearly, never.</li>
      <li>&lt;priority&gt; must be a decimal between 0.0 and 1.0.</li>
    </ul>
  </div>
);

export const RobotsGeneratorContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Use a robots.txt?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      A robots.txt file at the site root gives crawlers rules for fetching paths. Group rules by user agent, add sitemap URLs where useful, and use
      authentication for private pages.
    </p>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Start a group with User-agent, then add Allow or Disallow rules for that crawler. Use an absolute URL for each Sitemap directive and publish the
      file at /robots.txt.
    </p>

    <h3 className={H3_DOC}>Best Practices</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>
        Always include a <code className="text-foreground">User-agent: *</code> group as a catch-all for unrecognised bots.
      </li>
      <li>Block admin, staging, and internal search result pages to avoid thin content penalties.</li>
      <li>Never block CSS or JavaScript files — Google needs them for rendering.</li>
      <li>Always include a Sitemap directive pointing to your XML sitemap.</li>
    </ul>
  </div>
);

export const RobotsValidatorContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Validate Your robots.txt?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Check that rules follow a User-agent line, directives are spelled correctly, and Sitemap values are absolute URLs. Test important paths against
      the intended user agent.
    </p>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Check the file’s location, encoding, and group structure. Evaluate each relevant path against the rules for its crawler, including exceptions
      and overlapping rules.
    </p>

    <h3 className={H3_DOC}>What Gets Checked</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>At least one User-agent directive is present.</li>
      <li>Disallow/Allow directives only appear after a User-agent.</li>
      <li>Sitemap URLs are well-formed absolute URLs.</li>
      <li>Crawl-delay values are valid non-negative numbers.</li>
      <li>Unrecognised directives are flagged as warnings.</li>
    </ul>
  </div>
);

export const MetaTagGeneratorContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Meta Tags Matter</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Meta tags control how search engines index your pages and how they appear in search results and social media shares. A well-crafted title and
      description can dramatically improve click-through rates, while Open Graph and Twitter Card tags ensure your content looks professional when
      shared on Facebook, LinkedIn, Twitter/X, and Slack.
    </p>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Set a descriptive title and description in the HTML head. For share cards, include Open Graph title, description, image, and URL values, then
      add platform-specific tags where needed.
    </p>

    <h3 className={H3_DOC}>SEO Best Practices</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Keep titles under 60 characters — longer titles get truncated in search results.</li>
      <li>Write descriptions between 150–160 characters for optimal display.</li>
      <li>Use a high-quality image (1200 × 630 px) for Open Graph previews.</li>
      <li>Include a canonical URL to prevent duplicate content issues.</li>
      <li>Use descriptive, comma-separated keywords relevant to your page content.</li>
    </ul>
  </div>
);

export const UrlEncoderDecoderContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Encode &amp; Decode URLs?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      URLs can only contain a limited set of ASCII characters. Special characters like spaces, ampersands, and non-Latin letters must be
      percent-encoded before they can appear in a URL.
    </p>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      JavaScript provides the built-in <code className="text-foreground">encodeURIComponent</code>,<code className="text-foreground"> encodeURI</code>
      , <code className="text-foreground">decodeURIComponent</code>, and <code className="text-foreground">decodeURI</code> functions. The key
      difference is that
      <code className="text-foreground"> encodeURIComponent</code> encodes everything except letters, digits, and{' '}
      <code className="text-foreground">- _ . ~ </code>, while <code className="text-foreground">encodeURI</code> also preserves URL-structural
      characters like <code className="text-foreground">/ : ? # [ ] @ ! $ &amp; &apos; ( ) * + , ; =</code>.
    </p>

    <h3 className={H3_DOC}>Common Use Cases</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Encoding query string parameters that contain spaces or special characters.</li>
      <li>Debugging URL-encoded API requests and webhook payloads.</li>
      <li>Preparing redirect URLs with encoded return paths.</li>
      <li>Decoding percent-encoded URLs from server logs or analytics tools.</li>
    </ul>
  </div>
);

export const OpenGraphPreviewContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Preview Open Graph Tags?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      When someone shares your page on Facebook, Twitter, LinkedIn, Slack, or Discord, the platform reads your Open Graph and Twitter Card meta tags
      to generate a rich link preview. If these tags are missing or misconfigured, your link may show a blank card or pull in the wrong image and
      title.
    </p>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Inspect the HTML head of the published page to check Open Graph and card metadata. Make sure the image URL is publicly reachable, then verify
      the result with the target platform.
    </p>

    <h3 className={H3_DOC}>Optimal Tag Configuration</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Use an og:image of at least 1200 × 630 px for crisp previews on all platforms.</li>
      <li>
        Set twitter:card to <code className="text-foreground">summary_large_image</code> for maximum visual impact.
      </li>
      <li>Keep og:title under 60 characters and og:description under 155 characters.</li>
      <li>
        Always set og:type — <code className="text-foreground">website</code> is the safe default for most pages.
      </li>
    </ul>
  </div>
);

export const KeywordDensityContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Analyse Keyword Density?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Keyword density measures how often a term appears relative to the total word count. Use it to spot repetition during editing, and prioritise
      clear language that matches the reader’s intent.
    </p>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Divide the number of occurrences by the total number of words and multiply by 100. Define how you count phrases, case variants, and inflected
      words before comparing results.
    </p>

    <h3 className={H3_DOC}>SEO Guidelines</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>
        <strong>1–3% density</strong> is generally considered optimal for primary keywords.
      </li>
      <li>Above 5% may trigger keyword stuffing filters in modern search algorithms.</li>
      <li>Focus on natural language — write for humans first, then check density.</li>
      <li>Use synonyms and related terms (LSI keywords) to avoid over-repetition.</li>
    </ul>
  </div>
);

export const SerpSnippetPreviewContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Preview Your Search Snippet?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Your title tag and meta description are the first thing searchers see — and if either one gets cut off mid-sentence, it can make your listing
      look unpolished or confusing.
    </p>
  </div>
);

export const SchemaMarkupGeneratorContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Structured Data Matters</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Schema.org markup in JSON-LD describes entities such as articles, products, and businesses. Add it to the relevant page and make sure its values
      match the visible content.
    </p>

    <h3 className={H3_DOC}>Tip</h3>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      After pasting the markup into your page, validate it with Google's Rich Results Test to confirm it's eligible for rich snippets.
    </p>
  </div>
);

export const UtmCampaignBuilderContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Use UTM Parameters?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      UTM parameters let analytics tools like Google Analytics attribute traffic to the exact campaign, channel, and content variant that drove it.
      Use consistent names and percent-encode the values to keep reports comparable.
    </p>
  </div>
);
