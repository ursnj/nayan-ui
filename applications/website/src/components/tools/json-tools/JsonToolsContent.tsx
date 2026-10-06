import { H2_DOC } from "@/design/system";

export const JsonFormatterContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Format JSON?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Raw JSON from APIs, logs, or databases is often a single unreadable line. Formatting it with
      proper indentation and line breaks makes the structure visible, debugging faster, and code
      reviews easier.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Customizable indent</strong> — choose 2 spaces, 4 spaces, or tabs.</li>
      <li><strong>Instant formatting</strong> — runs entirely in your browser.</li>
      <li><strong>Error detection</strong> — shows parse errors if the JSON is invalid.</li>
      <li><strong>Copy to clipboard</strong> — one click to copy the formatted output.</li>
    </ul>
  </div>
);

export const JsonMinifierContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Minify JSON?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Minifying JSON removes all unnecessary whitespace, reducing file size for faster network
      transfers, smaller payloads, and more efficient storage. Essential for API responses,
      configuration files, and data exports.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Size comparison</strong> — see original vs minified size and savings percentage.</li>
      <li><strong>Lossless compression</strong> — data is preserved exactly, only whitespace is removed.</li>
      <li><strong>Copy to clipboard</strong> — one click to copy the minified output.</li>
      <li><strong>Client-side processing</strong> — your data never leaves your browser.</li>
    </ul>
  </div>
);

export const JsonValidatorContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Validate JSON?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Invalid JSON causes silent failures in APIs, configuration files, and data pipelines. Our
      validator checks syntax, pinpoints the exact error location, and provides structural analysis
      including type, node count, and nesting depth.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Syntax validation</strong> — detects missing brackets, commas, quotes, and more.</li>
      <li><strong>Error location</strong> — pinpoints the line and column of the first error.</li>
      <li><strong>Structure analysis</strong> — reports type, total nodes, and maximum depth.</li>
      <li><strong>Instant feedback</strong> — validation runs entirely in your browser.</li>
    </ul>
  </div>
);

export const JsonToCsvContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert JSON to CSV?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      CSV is the universal format for spreadsheets, databases, and data analysis tools. Converting
      JSON arrays to CSV makes your data importable into Excel, Google Sheets, R, Python pandas,
      and virtually any data tool.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Automatic headers</strong> — column names are extracted from object keys.</li>
      <li><strong>Proper escaping</strong> — handles commas, quotes, and newlines in values.</li>
      <li><strong>Download as file</strong> — save the CSV directly to your device.</li>
      <li><strong>Copy to clipboard</strong> — paste into spreadsheets instantly.</li>
    </ul>
  </div>
);

export const JsonToYamlContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert JSON to YAML?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      YAML is the preferred format for configuration files in Docker, Kubernetes, CI/CD pipelines,
      and many frameworks. Converting JSON to YAML produces clean, human-readable config files
      without the noise of brackets and quotes.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Clean output</strong> — proper indentation, no trailing commas or brackets.</li>
      <li><strong>Multi-line strings</strong> — long text is rendered with YAML block scalars.</li>
      <li><strong>Safe quoting</strong> — special characters are quoted automatically.</li>
      <li><strong>Download as file</strong> — save as .yaml directly.</li>
    </ul>
  </div>
);

export const JsonToXmlContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert JSON to XML?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      XML remains essential for SOAP APIs, RSS feeds, Android layouts, and enterprise integrations.
      Converting JSON to XML bridges the gap between modern REST APIs and legacy systems that
      expect XML input.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Custom root tag</strong> — name the root element to match your schema.</li>
      <li><strong>Nested structures</strong> — objects and arrays are mapped to proper XML elements.</li>
      <li><strong>XML declaration</strong> — includes the standard XML header.</li>
      <li><strong>Special character escaping</strong> — handles &amp;, &lt;, &gt;, and quotes.</li>
    </ul>
  </div>
);

export const JsonToTsvContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert JSON to TSV?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Tab-separated values (TSV) are ideal for pasting into spreadsheets, feeding into command-line
      tools like <code>awk</code> and <code>cut</code>, and importing into databases. TSV avoids
      the quoting complexity of CSV when your data contains commas.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Automatic headers</strong> — column names from object keys.</li>
      <li><strong>Tab-safe values</strong> — tabs and newlines in values are replaced.</li>
      <li><strong>Download as file</strong> — save as .tsv directly.</li>
      <li><strong>Copy to clipboard</strong> — paste into any spreadsheet.</li>
    </ul>
  </div>
);

export const JsonToExcelContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert JSON to Excel?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Excel is the standard tool for data analysis, reporting, and sharing in business environments.
      Converting JSON directly to XLSX gives you a properly structured spreadsheet with headers,
      typed columns, and auto-sized widths — ready for pivot tables and charts.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>XLSX output</strong> — compatible with Excel, Google Sheets, and LibreOffice Calc.</li>
      <li><strong>Bold headers</strong> — column names are formatted as bold header row.</li>
      <li><strong>Auto-sized columns</strong> — widths adjust to the content.</li>
      <li><strong>Nested data handling</strong> — objects and arrays are JSON-stringified in cells.</li>
    </ul>
  </div>
);

export const CsvToJsonContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert CSV to JSON?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      CSV is the universal exchange format for spreadsheets, databases, and data pipelines. But web
      APIs, JavaScript applications, and NoSQL databases expect JSON. Our converter turns CSV rows
      into an array of JSON objects with automatic header detection, proper quoting, and custom
      delimiter support &mdash; entirely in your browser.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Automatic header detection</strong> &mdash; the first row becomes object keys.</li>
      <li><strong>Custom delimiter</strong> &mdash; supports comma, semicolon, tab, pipe, or any single character.</li>
      <li><strong>Quoted field handling</strong> &mdash; correctly parses fields with embedded delimiters and escaped quotes.</li>
      <li><strong>Pretty-printed output</strong> &mdash; formatted JSON with 2-space indentation.</li>
      <li><strong>Copy to clipboard</strong> &mdash; grab the JSON with one click.</li>
    </ul>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Importing spreadsheet exports into REST API requests or Postman collections.</li>
      <li>Converting database dumps for use in MongoDB, Firebase, or DynamoDB.</li>
      <li>Transforming CSV data feeds into JSON for front-end consumption.</li>
      <li>Preparing test fixtures from CSV data files.</li>
    </ul>
  </div>
);

export const YamlToJsonContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert YAML to JSON?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      YAML is the go-to format for Docker Compose, Kubernetes manifests, CI/CD pipelines, and
      framework configs. But APIs, JavaScript code, and many tools expect JSON. Our converter
      parses YAML&apos;s indentation-based structure and outputs clean, type-aware JSON &mdash;
      entirely in your browser.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Nested structures</strong> &mdash; handles deeply nested objects and arrays.</li>
      <li><strong>Type inference</strong> &mdash; booleans, numbers, null, and strings are correctly typed.</li>
      <li><strong>Comment stripping</strong> &mdash; YAML comments are removed from the output.</li>
      <li><strong>Pretty-printed output</strong> &mdash; formatted JSON with 2-space indentation.</li>
      <li><strong>Client-side processing</strong> &mdash; your data never leaves your browser.</li>
    </ul>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Converting Docker Compose or Kubernetes YAML to JSON for API consumption.</li>
      <li>Transforming CI/CD pipeline configs for programmatic manipulation.</li>
      <li>Importing YAML configuration into applications that only accept JSON.</li>
      <li>Debugging YAML syntax errors by viewing the parsed JSON structure.</li>
    </ul>
  </div>
);

export const JsonPathFinderContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Use JSON Path Finder?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Large JSON structures with deep nesting are difficult to navigate manually. JSON Path lets
      you query nested data using expressions like <code>$.users[0].name</code> &mdash; similar to
      XPath for XML. Our tool evaluates paths in real time and lists every available path so you
      can explore unfamiliar data structures quickly.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Path query</strong> &mdash; use dot notation and bracket indices to navigate any depth.</li>
      <li><strong>Wildcard support</strong> &mdash; use <code>*</code> to match all keys or all array items.</li>
      <li><strong>All paths listing</strong> &mdash; see every reachable path in the document (up to 500).</li>
      <li><strong>Click to select</strong> &mdash; click any listed path to instantly use it as your query.</li>
      <li><strong>Copy results</strong> &mdash; copy the query result as formatted JSON.</li>
    </ul>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Exploring API responses to find the right path for data extraction.</li>
      <li>Building jq or JSONPath expressions for CI/CD pipelines.</li>
      <li>Navigating complex configuration files or Terraform state.</li>
      <li>Learning JSON structure for unfamiliar third-party APIs.</li>
    </ul>
  </div>
);

export const JsonSchemaValidatorContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Validate Against JSON Schema?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      JSON Schema is a vocabulary for annotating and validating JSON documents. It defines expected
      types, required fields, value ranges, and patterns &mdash; catching malformed data before it
      reaches your database or crashes your application. Our validator checks your data against your
      schema in real time and reports every violation with an exact JSON path.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Type checking</strong> &mdash; validates string, number, integer, boolean, array, object, and null.</li>
      <li><strong>Constraint support</strong> &mdash; required, minLength, maxLength, minimum, maximum, enum, and pattern.</li>
      <li><strong>Recursive validation</strong> &mdash; properties and array items are validated to any depth.</li>
      <li><strong>Clear error paths</strong> &mdash; every error includes the exact JSON path where it occurred.</li>
      <li><strong>Side-by-side editor</strong> &mdash; data and schema are edited in parallel for fast iteration.</li>
    </ul>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Validating API request/response payloads during development.</li>
      <li>Testing form data shapes before integrating with a backend.</li>
      <li>Authoring and verifying JSON Schema definitions for documentation.</li>
      <li>Catching configuration file errors before deploying to production.</li>
    </ul>
  </div>
);

export const JsonDiffContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Diff JSON?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Comparing two JSON objects by eye is tedious and error-prone &mdash; a single misplaced comma
      or renamed key can hide in thousands of lines. Our diff tool performs a deep, recursive
      structural comparison and highlights every addition, removal, and value change with its exact
      JSON path.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Deep comparison</strong> &mdash; recursively compares objects, arrays, and primitives to any depth.</li>
      <li><strong>Colour-coded results</strong> &mdash; additions (green), removals (red), and changes (yellow).</li>
      <li><strong>Exact paths</strong> &mdash; every difference includes the full JSON path (e.g. <code>$.users[0].name</code>).</li>
      <li><strong>Old &amp; new values</strong> &mdash; changed fields show both the original and modified value.</li>
      <li><strong>Side-by-side editor</strong> &mdash; paste or type both JSON documents in parallel.</li>
    </ul>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Reviewing API response changes between versions during integration testing.</li>
      <li>Comparing configuration files across environments (dev, staging, prod).</li>
      <li>Auditing database document changes or migration output.</li>
      <li>Verifying that a transformation or migration preserved data integrity.</li>
    </ul>
  </div>
);

export const JsonToTypescriptContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Generate TypeScript Interfaces from JSON?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Hand-writing TypeScript types for an API response or config file is slow and error-prone.
      This tool parses real JSON and recursively infers matching <code>interface</code>{" "}
      declarations &mdash; nested objects become their own named interfaces, and arrays of objects
      are merged into a single shape with optional fields where items disagree.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Nested interfaces</strong> &mdash; every nested object gets its own named, reusable interface.</li>
      <li><strong>Array merging</strong> &mdash; arrays of objects merge all observed fields, marking inconsistent ones optional.</li>
      <li><strong>Custom root name</strong> &mdash; name the top-level interface to match your codebase conventions.</li>
      <li><strong>Copy to clipboard</strong> &mdash; paste straight into a <code>.ts</code> file.</li>
    </ul>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Typing an API response you don&apos;t control without writing it by hand.</li>
      <li>Bootstrapping types for a new integration from a sample payload.</li>
      <li>Keeping TypeScript types in sync after an API shape changes.</li>
    </ul>
  </div>
);

export const JsonFlattenUnflattenContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Flatten or Unflatten JSON?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Flattening collapses a nested JSON document into a single-level object with dot-notation
      keys (e.g. <code>user.address.city</code>) &mdash; useful for spreadsheets, flat key-value
      stores, and form libraries. Unflattening reverses the process, rebuilding the original
      nested structure (including arrays) from dot-path keys.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Two-way conversion</strong> &mdash; flatten nested JSON or unflatten dot-path keys back into objects and arrays.</li>
      <li><strong>Array-aware</strong> &mdash; array elements use numeric path segments and are correctly rebuilt as arrays, not objects.</li>
      <li><strong>Custom delimiter</strong> &mdash; use <code>.</code>, <code>/</code>, or any separator your system expects.</li>
    </ul>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Exporting nested JSON to a flat CSV/spreadsheet-friendly format.</li>
      <li>Working with key-value stores (env vars, form data) that can&apos;t hold nested structures.</li>
      <li>Reconstructing structured config from a flat <code>.env</code>-style key list.</li>
    </ul>
  </div>
);

export const JsonQueryStringConverterContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert Between JSON and Query Strings?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      URL query strings and JSON objects represent the same key-value data in different formats.
      This tool converts a JSON object into a properly percent-encoded query string, or parses an
      existing query string back into JSON &mdash; grouping repeated keys into arrays.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Correct encoding</strong> &mdash; uses <code>URLSearchParams</code> for proper percent-encoding of spaces and special characters.</li>
      <li><strong>Array support</strong> &mdash; array values become repeated keys and parse back into arrays automatically.</li>
      <li><strong>Two-way conversion</strong> &mdash; JSON to query string, or query string to JSON.</li>
    </ul>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Building a query string from a JSON filter/search state object.</li>
      <li>Debugging what an existing URL&apos;s query parameters actually decode to.</li>
      <li>Converting form state to and from shareable URLs.</li>
    </ul>
  </div>
);
