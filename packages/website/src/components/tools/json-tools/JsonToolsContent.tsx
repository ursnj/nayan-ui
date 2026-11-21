import { H2_DOC } from '@/design/system';

export const JsonFormatterContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Format JSON?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Raw JSON from APIs, logs, or databases is often a single unreadable line. Formatting it with proper indentation and line breaks makes the
      structure visible, debugging faster, and code reviews easier.
    </p>
  </div>
);

export const JsonMinifierContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Minify JSON?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Minifying JSON removes all unnecessary whitespace, reducing file size for faster network transfers, smaller payloads, and more efficient
      storage. Essential for API responses, configuration files, and data exports.
    </p>
  </div>
);

export const JsonValidatorContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Validate JSON?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">Invalid JSON causes silent failures in APIs, configuration files, and data pipelines.</p>
  </div>
);

export const JsonToCsvContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert JSON to CSV?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      CSV is the universal format for spreadsheets, databases, and data analysis tools. Converting JSON arrays to CSV makes your data importable into
      Excel, Google Sheets, R, Python pandas, and virtually any data tool.
    </p>
  </div>
);

export const JsonToYamlContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert JSON to YAML?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      YAML is the preferred format for configuration files in Docker, Kubernetes, CI/CD pipelines, and many frameworks. Converting JSON to YAML
      produces clean, human-readable config files without the noise of brackets and quotes.
    </p>
  </div>
);

export const JsonToXmlContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert JSON to XML?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      XML remains essential for SOAP APIs, RSS feeds, Android layouts, and enterprise integrations. Converting JSON to XML bridges the gap between
      modern REST APIs and legacy systems that expect XML input.
    </p>
  </div>
);

export const JsonToTsvContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert JSON to TSV?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Tab-separated values (TSV) are ideal for pasting into spreadsheets, feeding into command-line tools like <code>awk</code> and <code>cut</code>,
      and importing into databases. TSV avoids the quoting complexity of CSV when your data contains commas.
    </p>
  </div>
);

export const JsonToExcelContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert JSON to Excel?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Excel is the standard tool for data analysis, reporting, and sharing in business environments. Converting JSON directly to XLSX gives you a
      properly structured spreadsheet with headers, typed columns, and auto-sized widths — ready for pivot tables and charts.
    </p>
  </div>
);

export const CsvToJsonContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert CSV to JSON?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      CSV is the universal exchange format for spreadsheets, databases, and data pipelines. But web APIs, JavaScript applications, and NoSQL databases
      expect JSON.
    </p>

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
      YAML is the go-to format for Docker Compose, Kubernetes manifests, CI/CD pipelines, and framework configs. But APIs, JavaScript code, and many
      tools expect JSON.
    </p>

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
      Large JSON structures with deep nesting are difficult to navigate manually. JSON Path lets you query nested data using expressions like{' '}
      <code>$.users[0].name</code> &mdash; similar to XPath for XML.
    </p>

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
      JSON Schema is a vocabulary for annotating and validating JSON documents. It defines expected types, required fields, value ranges, and patterns
      &mdash; catching malformed data before it reaches your database or crashes your application.
    </p>

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
      Comparing two JSON objects by eye is tedious and error-prone &mdash; a single misplaced comma or renamed key can hide in thousands of lines.
    </p>

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
      Infer TypeScript interfaces from representative JSON data. Compare multiple payloads to identify optional fields and fields that can contain
      different types.
    </p>

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
      Flattening collapses a nested JSON document into a single-level object with dot-notation keys (e.g. <code>user.address.city</code>) &mdash;
      useful for spreadsheets, flat key-value stores, and form libraries. Unflattening reverses the process, rebuilding the original nested structure
      (including arrays) from dot-path keys.
    </p>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Exporting nested JSON to a flat CSV/spreadsheet-friendly format.</li>
      <li>Working with key-value stores (env vars, form data) that can&apos;t hold nested structures.</li>
      <li>
        Reconstructing structured config from a flat <code>.env</code>-style key list.
      </li>
    </ul>
  </div>
);

export const JsonQueryStringConverterContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert Between JSON and Query Strings?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      A query string encodes key-value pairs in a URL. Percent-encode each key and value, choose how to handle repeated keys, and decide how to
      represent nested objects before converting.
    </p>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Building a query string from a JSON filter/search state object.</li>
      <li>Debugging what an existing URL&apos;s query parameters actually decode to.</li>
      <li>Converting form state to and from shareable URLs.</li>
    </ul>
  </div>
);
