import { NView, NText } from 'nayan-ui/components';
import { H2_DOC, H3_DOC } from '@/design/system';

export const SitemapGeneratorContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Use a Sitemap?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      An XML sitemap lists the canonical URLs you want search engines to discover. It helps crawlers find new or sparsely linked pages and can
      communicate when a page was last updated.
    </NText>

    <NText tag="h2" className={H2_DOC}>How It Works</NText>
    <NText tag="p" className="mb-3 text-sm leading-relaxed text-muted">
      List absolute canonical URLs in a sitemap.xml document, with a url element for each page and its address in loc. Add lastmod only when it
      reflects a meaningful change. Publish the sitemap and include its URL in robots.txt.
    </NText>

    <NText tag="h3" className={H3_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Generating sitemaps for new websites before submitting to Google Search Console.</NView>
      <NView tag="li">Rebuilding sitemaps after a site migration or URL restructure.</NView>
      <NView tag="li">Auditing which pages are discoverable by search engine crawlers.</NView>
      <NView tag="li">Creating sitemaps for static sites that don&apos;t have a built-in sitemap generator.</NView>
    </NView>
  </NView>
);

export const SitemapValidatorContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Validate Your Sitemap?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Check that the sitemap is well-formed XML and each entry provides an absolute URL. Validate the namespace and ensure the listed URLs are the
      canonical pages you want crawlers to discover.
    </NText>

    <NText tag="h2" className={H2_DOC}>How It Works</NText>
    <NText tag="p" className="mb-3 text-sm leading-relaxed text-muted">
      Parse the XML first, then check the namespace, loc values, and date format. Confirm that the sitemap is accessible and that listed URLs return
      the intended pages.
    </NText>

    <NText tag="h3" className={H3_DOC}>What Gets Checked</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Valid XML syntax — no unclosed tags, mismatched elements, or encoding errors.</NView>
      <NView tag="li">Root element must be &lt;urlset&gt; with the correct xmlns namespace.</NView>
      <NView tag="li">Every &lt;url&gt; must contain a &lt;loc&gt; with a valid absolute URL.</NView>
      <NView tag="li">&lt;changefreq&gt; must be one of: always, hourly, daily, weekly, monthly, yearly, never.</NView>
      <NView tag="li">&lt;priority&gt; must be a decimal between 0.0 and 1.0.</NView>
    </NView>
  </NView>
);

export const RobotsGeneratorContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Use a robots.txt?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      A robots.txt file at the site root gives crawlers rules for fetching paths. Group rules by user agent, add sitemap URLs where useful, and use
      authentication for private pages.
    </NText>

    <NText tag="h2" className={H2_DOC}>How It Works</NText>
    <NText tag="p" className="mb-3 text-sm leading-relaxed text-muted">
      Start a group with User-agent, then add Allow or Disallow rules for that crawler. Use an absolute URL for each Sitemap directive and publish the
      file at /robots.txt.
    </NText>

    <NText tag="h3" className={H3_DOC}>Best Practices</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">
        Always include a <NText tag="code" className="text-foreground">User-agent: *</NText> group as a catch-all for unrecognised bots.
      </NView>
      <NView tag="li">Block admin, staging, and internal search result pages to avoid thin content penalties.</NView>
      <NView tag="li">Never block CSS or JavaScript files — Google needs them for rendering.</NView>
      <NView tag="li">Always include a Sitemap directive pointing to your XML sitemap.</NView>
    </NView>
  </NView>
);

export const RobotsValidatorContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Validate Your robots.txt?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Check that rules follow a User-agent line, directives are spelled correctly, and Sitemap values are absolute URLs. Test important paths against
      the intended user agent.
    </NText>

    <NText tag="h2" className={H2_DOC}>How It Works</NText>
    <NText tag="p" className="mb-3 text-sm leading-relaxed text-muted">
      Check the file’s location, encoding, and group structure. Evaluate each relevant path against the rules for its crawler, including exceptions
      and overlapping rules.
    </NText>

    <NText tag="h3" className={H3_DOC}>What Gets Checked</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">At least one User-agent directive is present.</NView>
      <NView tag="li">Disallow/Allow directives only appear after a User-agent.</NView>
      <NView tag="li">Sitemap URLs are well-formed absolute URLs.</NView>
      <NView tag="li">Crawl-delay values are valid non-negative numbers.</NView>
      <NView tag="li">Unrecognised directives are flagged as warnings.</NView>
    </NView>
  </NView>
);

export const MetaTagGeneratorContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Meta Tags Matter</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Meta tags control how search engines index your pages and how they appear in search results and social media shares. A well-crafted title and
      description can dramatically improve click-through rates, while Open Graph and Twitter Card tags ensure your content looks professional when
      shared on Facebook, LinkedIn, Twitter/X, and Slack.
    </NText>

    <NText tag="h2" className={H2_DOC}>How It Works</NText>
    <NText tag="p" className="mb-3 text-sm leading-relaxed text-muted">
      Set a descriptive title and description in the HTML head. For share cards, include Open Graph title, description, image, and URL values, then
      add platform-specific tags where needed.
    </NText>

    <NText tag="h3" className={H3_DOC}>SEO Best Practices</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Keep titles under 60 characters — longer titles get truncated in search results.</NView>
      <NView tag="li">Write descriptions between 150–160 characters for optimal display.</NView>
      <NView tag="li">Use a high-quality image (1200 × 630 px) for Open Graph previews.</NView>
      <NView tag="li">Include a canonical URL to prevent duplicate content issues.</NView>
      <NView tag="li">Use descriptive, comma-separated keywords relevant to your page content.</NView>
    </NView>
  </NView>
);

export const UrlEncoderDecoderContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Encode &amp; Decode URLs?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      URLs can only contain a limited set of ASCII characters. Special characters like spaces, ampersands, and non-Latin letters must be
      percent-encoded before they can appear in a URL.
    </NText>

    <NText tag="h2" className={H2_DOC}>How It Works</NText>
    <NText tag="p" className="mb-3 text-sm leading-relaxed text-muted">
      JavaScript provides the built-in <NText tag="code" className="text-foreground">encodeURIComponent</NText>,<NText tag="code" className="text-foreground"> encodeURI</NText>
      , <NText tag="code" className="text-foreground">decodeURIComponent</NText>, and <NText tag="code" className="text-foreground">decodeURI</NText> functions. The key
      difference is that
      <NText tag="code" className="text-foreground"> encodeURIComponent</NText> encodes everything except letters, digits, and{' '}
      <NText tag="code" className="text-foreground">- _ . ~ </NText>, while <NText tag="code" className="text-foreground">encodeURI</NText> also preserves URL-structural
      characters like <NText tag="code" className="text-foreground">/ : ? # [ ] @ ! $ &amp; &apos; ( ) * + , ; =</NText>.
    </NText>

    <NText tag="h3" className={H3_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Encoding query string parameters that contain spaces or special characters.</NView>
      <NView tag="li">Debugging URL-encoded API requests and webhook payloads.</NView>
      <NView tag="li">Preparing redirect URLs with encoded return paths.</NView>
      <NView tag="li">Decoding percent-encoded URLs from server logs or analytics tools.</NView>
    </NView>
  </NView>
);

export const OpenGraphPreviewContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Preview Open Graph Tags?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      When someone shares your page on Facebook, Twitter, LinkedIn, Slack, or Discord, the platform reads your Open Graph and Twitter Card meta tags
      to generate a rich link preview. If these tags are missing or misconfigured, your link may show a blank card or pull in the wrong image and
      title.
    </NText>

    <NText tag="h2" className={H2_DOC}>How It Works</NText>
    <NText tag="p" className="mb-3 text-sm leading-relaxed text-muted">
      Inspect the HTML head of the published page to check Open Graph and card metadata. Make sure the image URL is publicly reachable, then verify
      the result with the target platform.
    </NText>

    <NText tag="h3" className={H3_DOC}>Optimal Tag Configuration</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Use an og:image of at least 1200 × 630 px for crisp previews on all platforms.</NView>
      <NView tag="li">
        Set twitter:card to <NText tag="code" className="text-foreground">summary_large_image</NText> for maximum visual impact.
      </NView>
      <NView tag="li">Keep og:title under 60 characters and og:description under 155 characters.</NView>
      <NView tag="li">
        Always set og:type — <NText tag="code" className="text-foreground">website</NText> is the safe default for most pages.
      </NView>
    </NView>
  </NView>
);

export const KeywordDensityContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Analyse Keyword Density?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Keyword density measures how often a term appears relative to the total word count. Use it to spot repetition during editing, and prioritise
      clear language that matches the reader’s intent.
    </NText>

    <NText tag="h2" className={H2_DOC}>How It Works</NText>
    <NText tag="p" className="mb-3 text-sm leading-relaxed text-muted">
      Divide the number of occurrences by the total number of words and multiply by 100. Define how you count phrases, case variants, and inflected
      words before comparing results.
    </NText>

    <NText tag="h3" className={H3_DOC}>SEO Guidelines</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">
        <NText tag="strong">1–3% density</NText> is generally considered optimal for primary keywords.
      </NView>
      <NView tag="li">Above 5% may trigger keyword stuffing filters in modern search algorithms.</NView>
      <NView tag="li">Focus on natural language — write for humans first, then check density.</NView>
      <NView tag="li">Use synonyms and related terms (LSI keywords) to avoid over-repetition.</NView>
    </NView>
  </NView>
);

export const SerpSnippetPreviewContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Preview Your Search Snippet?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Your title tag and meta description are the first thing searchers see — and if either one gets cut off mid-sentence, it can make your listing
      look unpolished or confusing.
    </NText>
  </NView>
);

export const SchemaMarkupGeneratorContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Structured Data Matters</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Schema.org markup in JSON-LD describes entities such as articles, products, and businesses. Add it to the relevant page and make sure its values
      match the visible content.
    </NText>

    <NText tag="h3" className={H3_DOC}>Tip</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      After pasting the markup into your page, validate it with Google's Rich Results Test to confirm it's eligible for rich snippets.
    </NText>
  </NView>
);

export const UtmCampaignBuilderContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Use UTM Parameters?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      UTM parameters let analytics tools like Google Analytics attribute traffic to the exact campaign, channel, and content variant that drove it.
      Use consistent names and percent-encode the values to keep reports comparable.
    </NText>
  </NView>
);
