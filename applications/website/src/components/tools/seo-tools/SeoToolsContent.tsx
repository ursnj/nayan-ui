import { H2_DOC, H3_DOC } from "@/design/system";

export const SitemapGeneratorContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Use a Sitemap?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      An XML sitemap tells search engines which pages on your site exist, when they were last
      updated, and how important they are relative to each other. Without a sitemap, crawlers rely
      solely on internal links — which means orphan pages and newly published content may never get
      indexed. Our free sitemap generator crawls your website and builds a standards-compliant
      sitemap.xml in seconds.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Automatic crawling</strong> — enter your homepage URL and the tool discovers pages automatically.</li>
      <li><strong>Configurable depth</strong> — control how many link levels deep the crawler goes (1–20).</li>
      <li><strong>Change frequency</strong> — set how often each URL typically changes (always, hourly, daily, weekly, etc.).</li>
      <li><strong>Max URL limit</strong> — cap the crawl at 500, 1,000, 2,000, 5,000, or 10,000 URLs.</li>
      <li><strong>Live XML preview</strong> — see the generated sitemap update in real time.</li>
      <li><strong>Download or copy</strong> — save as sitemap.xml or copy the raw XML to your clipboard.</li>
    </ul>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      The tool sends your website URL to a server-side crawler that follows internal links up to the
      configured depth, collecting unique URLs along the way. Each discovered URL is wrapped in a
      standard &lt;url&gt; element with &lt;loc&gt;, &lt;changefreq&gt;, and &lt;lastmod&gt; tags.
      The final XML follows the sitemaps.org protocol, which is supported by Google, Bing, Yahoo, and
      all major search engines.
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
      A malformed sitemap can cause search engines to ignore your pages entirely. Common issues
      include invalid XML syntax, missing &lt;loc&gt; elements, broken URLs, and out-of-range
      priority values. Our validator catches all of these problems before you submit your sitemap
      to Google Search Console or Bing Webmaster Tools.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Remote URL validation</strong> — fetch and validate sitemaps hosted on any domain.</li>
      <li><strong>File upload</strong> — upload a local .xml file for instant validation.</li>
      <li><strong>Paste XML directly</strong> — paste raw XML content for quick checks.</li>
      <li><strong>XML structure check</strong> — verifies valid XML and correct &lt;urlset&gt; root element.</li>
      <li><strong>URL entry validation</strong> — checks every &lt;url&gt; for a valid &lt;loc&gt;, &lt;changefreq&gt;, and &lt;priority&gt;.</li>
      <li><strong>Detailed error reporting</strong> — pinpoints issues at the specific URL entry level.</li>
    </ul>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      The validator parses your XML using DOMParser and checks for parser errors first. It then
      verifies the root element is &lt;urlset&gt;, iterates over every &lt;url&gt; entry, and
      validates that each contains a well-formed &lt;loc&gt; URL. Optional &lt;changefreq&gt;
      values are checked against the seven allowed values, and &lt;priority&gt; must be a number
      between 0.0 and 1.0.
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
      The robots.txt file sits at the root of your website and tells search engine crawlers which
      pages or sections they are allowed or forbidden to access. A properly configured robots.txt
      prevents crawlers from indexing admin panels, staging pages, duplicate content, and other
      areas you want to keep out of search results. Our visual editor makes it easy to build
      one without memorising the syntax.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Visual rule builder</strong> — add user-agent groups and paths through a form, no syntax to remember.</li>
      <li><strong>Multiple user-agent groups</strong> — create separate rules for Googlebot, Bingbot, or any crawler.</li>
      <li><strong>Allow &amp; Disallow paths</strong> — add as many paths as you need per group.</li>
      <li><strong>Sitemap directive</strong> — include your sitemap URL so crawlers discover it automatically.</li>
      <li><strong>Crawl-delay support</strong> — optionally slow down aggressive bots.</li>
      <li><strong>Live preview</strong> — see the generated robots.txt update as you edit.</li>
      <li><strong>Download or copy</strong> — save as robots.txt or copy to your clipboard.</li>
    </ul>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Each user-agent group you create becomes a block in the output. The generator follows the
      Robots Exclusion Protocol: User-agent lines come first, followed by Disallow and Allow
      directives, then an optional Crawl-delay. Sitemap directives are placed at the end of the
      file, outside any group, so all crawlers can find them.
    </p>

    <h3 className={H3_DOC}>Best Practices</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Always include a <code className="text-foreground">User-agent: *</code> group as a catch-all for unrecognised bots.</li>
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
      A single typo in your robots.txt can accidentally block your entire site from search engines
      or leave sensitive pages exposed to crawlers. Common mistakes include missing User-agent
      directives, Disallow rules before any User-agent, malformed Sitemap URLs, and unrecognised
      directives. Our validator catches all of these issues with clear error messages.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Remote URL validation</strong> — fetch and validate robots.txt from any domain.</li>
      <li><strong>File upload</strong> — upload a local robots.txt file for instant checking.</li>
      <li><strong>Paste directly</strong> — paste raw content for quick validation.</li>
      <li><strong>Directive status badges</strong> — at-a-glance indicators for User-agent, Disallow, Allow, and Sitemap.</li>
      <li><strong>Error &amp; warning separation</strong> — critical errors shown in red, recommendations in yellow.</li>
      <li><strong>Line-level feedback</strong> — errors reference the specific line number.</li>
    </ul>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      The validator parses each non-comment line of your robots.txt and checks directive ordering,
      required fields, and value formats. User-agent must appear before any Allow or Disallow rules.
      Sitemap URLs are validated as absolute URLs. Crawl-delay values must be non-negative numbers.
      Any line that doesn&apos;t match a known directive is flagged as a warning.
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
      Meta tags control how search engines index your pages and how they appear in search results
      and social media shares. A well-crafted title and description can dramatically improve
      click-through rates, while Open Graph and Twitter Card tags ensure your content looks
      professional when shared on Facebook, LinkedIn, Twitter/X, and Slack. Our generator produces
      copy-paste ready HTML for all major platforms.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Primary meta tags</strong> — title, description, keywords, author, and canonical URL.</li>
      <li><strong>Open Graph tags</strong> — og:title, og:description, og:image, og:url, og:type, og:site_name for Facebook and LinkedIn.</li>
      <li><strong>Twitter Card tags</strong> — twitter:card, twitter:title, twitter:description, twitter:image, twitter:url.</li>
      <li><strong>Live preview</strong> — see the generated HTML update as you type.</li>
      <li><strong>One-click copy</strong> — copy the full HTML snippet to your clipboard.</li>
    </ul>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Fill in your page details — title, description, URL, image URL, site name, keywords, and
      author — and the generator builds the corresponding HTML meta tags in real time. The output
      includes a &lt;title&gt; element, standard meta tags, Open Graph tags for Facebook and
      LinkedIn, and Twitter Card tags. Just copy the output and paste it into your page&apos;s
      &lt;head&gt; section.
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
      URLs can only contain a limited set of ASCII characters. Special characters like spaces,
      ampersands, and non-Latin letters must be percent-encoded before they can appear in a URL.
      Our tool makes it easy to encode text for use in query strings, decode percent-encoded URLs
      back to readable text, and switch between full URL encoding and component encoding.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Encode Component</strong> — encodes all special characters including <code className="text-foreground">/ ? # &amp;</code> (for query parameters and values).</li>
      <li><strong>Encode URI</strong> — encodes special characters but preserves URL structure characters like <code className="text-foreground">/ : ? # &amp;</code>.</li>
      <li><strong>Decode Component</strong> — decodes all percent-encoded sequences.</li>
      <li><strong>Decode URI</strong> — decodes percent-encoded sequences while preserving URL structure.</li>
      <li><strong>Swap</strong> — move the output back to input for chained transformations.</li>
      <li><strong>Error handling</strong> — graceful feedback for malformed percent-encoded input.</li>
    </ul>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      The tool uses JavaScript&apos;s built-in <code className="text-foreground">encodeURIComponent</code>,
      <code className="text-foreground"> encodeURI</code>, <code className="text-foreground">decodeURIComponent</code>,
      and <code className="text-foreground">decodeURI</code> functions. The key difference is that
      <code className="text-foreground"> encodeURIComponent</code> encodes everything except letters, digits,
      and <code className="text-foreground">- _ . ~ </code>, while <code className="text-foreground">encodeURI</code> also preserves
      URL-structural characters like <code className="text-foreground">/ : ? # [ ] @ ! $ &amp; &apos; ( ) * + , ; =</code>.
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
      When someone shares your page on Facebook, Twitter, LinkedIn, Slack, or Discord, the platform
      reads your Open Graph and Twitter Card meta tags to generate a rich link preview. If these tags
      are missing or misconfigured, your link may show a blank card or pull in the wrong image and
      title. Our preview tool fetches your live metadata and shows you exactly how your page will
      appear across four major platforms — before you share it.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Facebook / LinkedIn preview</strong> — shows the og:image at 1.91:1 ratio with title, description, and domain.</li>
      <li><strong>Twitter / X preview</strong> — renders a summary_large_image card with title, description, and domain.</li>
      <li><strong>Google Search preview</strong> — displays the search snippet with favicon, canonical URL, title, and description.</li>
      <li><strong>Slack / Discord preview</strong> — shows the unfurl card with accent bar, site name, title, description, and image.</li>
      <li><strong>Missing tag warnings</strong> — badges highlight when title, description, or image tags are absent.</li>
      <li><strong>Metadata badges</strong> — shows og:type and twitter:card values at a glance.</li>
    </ul>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Enter any URL and the tool sends a server-side request to fetch the page&apos;s HTML. It then
      parses the &lt;head&gt; for Open Graph tags (og:title, og:description, og:image, og:type,
      og:site_name), Twitter Card tags (twitter:card, twitter:title, twitter:description,
      twitter:image), standard meta tags (title, description, canonical), and the favicon. The
      results are rendered in four platform-specific preview cards.
    </p>

    <h3 className={H3_DOC}>Optimal Tag Configuration</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Use an og:image of at least 1200 × 630 px for crisp previews on all platforms.</li>
      <li>Set twitter:card to <code className="text-foreground">summary_large_image</code> for maximum visual impact.</li>
      <li>Keep og:title under 60 characters and og:description under 155 characters.</li>
      <li>Always set og:type — <code className="text-foreground">website</code> is the safe default for most pages.</li>
    </ul>
  </div>
);

export const KeywordDensityContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Analyse Keyword Density?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Keyword density — the percentage of times a keyword appears relative to the total word
      count — is a fundamental SEO metric. Too low and search engines may not associate your page
      with the target keyword; too high and you risk a keyword stuffing penalty. Our analyser gives
      you a visual breakdown of your content&apos;s keyword distribution with colour-coded density
      indicators so you can optimise before publishing.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Top 30 keywords</strong> — ranked by frequency with visual bar charts.</li>
      <li><strong>Target keyword tracking</strong> — enter a specific keyword or phrase and see its count and density.</li>
      <li><strong>Optimal range indicator</strong> — green (1–3%), yellow (3–5%), red (&gt;5%) colour coding.</li>
      <li><strong>Multi-word phrase support</strong> — track exact phrase occurrences, not just individual words.</li>
      <li><strong>Stop-word filtering</strong> — common words (the, and, is, etc.) are excluded from the analysis.</li>
      <li><strong>Configurable min word length</strong> — filter out short words to focus on meaningful keywords.</li>
      <li><strong>Vocabulary density</strong> — shows the ratio of unique keywords to total words.</li>
    </ul>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      Paste your article or page content, and the tool tokenises the text, removes stop words, and
      counts the frequency of each remaining word. Results are sorted by count and displayed as
      horizontal bar charts with density percentages. If you enter a target keyword, it gets its
      own analysis card with a count, density percentage, and guidance on whether usage is optimal,
      too low, or too high.
    </p>

    <h3 className={H3_DOC}>SEO Guidelines</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>1–3% density</strong> is generally considered optimal for primary keywords.</li>
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
      Your title tag and meta description are the first thing searchers see — and if either one
      gets cut off mid-sentence, it can make your listing look unpolished or confusing. This tool
      renders a live, realistic preview of your Google search result, complete with the URL
      breadcrumb, so you can see exactly how much of your copy fits before it's truncated.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Realistic preview</strong> — styled to match an actual Google organic result.</li>
      <li><strong>Character counters</strong> — tracks the commonly-cited ~60 character title and ~160 character description guidelines.</li>
      <li><strong>Live truncation</strong> — the preview actually cuts off text at a word boundary with an ellipsis, the way Google does, rather than just warning you.</li>
      <li><strong>URL breadcrumb</strong> — shows the hostname and path segments the way they appear under your title.</li>
    </ul>
  </div>
);

export const SchemaMarkupGeneratorContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Structured Data Matters</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Schema.org markup (JSON-LD) tells search engines exactly what your content means — a
      question and answer, a product and its price, a business and its address — which unlocks
      rich results like FAQ accordions, star ratings, and breadcrumb trails directly in search
      listings. This generator builds valid, ready-to-paste JSON-LD for the five most common
      schema types without you needing to memorize the spec.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Five schema types</strong> — FAQPage, Article, Product, LocalBusiness, and BreadcrumbList.</li>
      <li><strong>Correct vocabulary</strong> — uses the real schema.org property names and nested types (Question, Answer, Offer, PostalAddress, ListItem) for each schema.</li>
      <li><strong>Repeatable fields</strong> — add as many FAQ pairs or breadcrumb levels as you need.</li>
      <li><strong>Script-tag output</strong> — optionally wrap the JSON in a ready-to-paste <code>&lt;script type="application/ld+json"&gt;</code> tag.</li>
    </ul>

    <h3 className={H3_DOC}>Tip</h3>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      After pasting the markup into your page, validate it with Google's Rich Results Test to
      confirm it's eligible for rich snippets.
    </p>
  </div>
);

export const UtmCampaignBuilderContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Use UTM Parameters?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      UTM parameters let analytics tools like Google Analytics attribute traffic to the exact
      campaign, channel, and content variant that drove it. A single typo or an unencoded space
      in a hand-built URL can silently break that attribution — this builder constructs the URL
      correctly every time.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>All five standard parameters</strong> — source, medium, campaign, term, and content.</li>
      <li><strong>Correct encoding</strong> — built on the URL/URLSearchParams APIs, so spaces, ampersands, and other special characters are always encoded properly.</li>
      <li><strong>Base URL validation</strong> — flags an invalid or missing base URL before you copy a broken link.</li>
      <li><strong>Preserves existing query parameters</strong> — UTM parameters are added alongside any query string already on your URL.</li>
    </ul>
  </div>
);
