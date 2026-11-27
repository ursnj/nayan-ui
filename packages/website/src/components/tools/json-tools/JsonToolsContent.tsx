import { NView, NText } from 'nayan-ui/components';
import { H2_DOC } from '@/design/system';

export const JsonFormatterContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Format JSON?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Raw JSON from APIs, logs, or databases is often a single unreadable line. Formatting it with proper indentation and line breaks makes the
      structure visible, debugging faster, and code reviews easier.
    </NText>
  </NView>
);

export const JsonMinifierContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Minify JSON?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Minifying JSON removes all unnecessary whitespace, reducing file size for faster network transfers, smaller payloads, and more efficient
      storage. Essential for API responses, configuration files, and data exports.
    </NText>
  </NView>
);

export const JsonValidatorContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Validate JSON?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">Invalid JSON causes silent failures in APIs, configuration files, and data pipelines.</NText>
  </NView>
);

export const JsonToCsvContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Convert JSON to CSV?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      CSV is the universal format for spreadsheets, databases, and data analysis tools. Converting JSON arrays to CSV makes your data importable into
      Excel, Google Sheets, R, Python pandas, and virtually any data tool.
    </NText>
  </NView>
);

export const JsonToYamlContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Convert JSON to YAML?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      YAML is the preferred format for configuration files in Docker, Kubernetes, CI/CD pipelines, and many frameworks. Converting JSON to YAML
      produces clean, human-readable config files without the noise of brackets and quotes.
    </NText>
  </NView>
);

export const JsonToXmlContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Convert JSON to XML?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      XML remains essential for SOAP APIs, RSS feeds, Android layouts, and enterprise integrations. Converting JSON to XML bridges the gap between
      modern REST APIs and legacy systems that expect XML input.
    </NText>
  </NView>
);

export const JsonToTsvContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Convert JSON to TSV?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Tab-separated values (TSV) are ideal for pasting into spreadsheets, feeding into command-line tools like <NText tag="code">awk</NText> and <NText tag="code">cut</NText>,
      and importing into databases. TSV avoids the quoting complexity of CSV when your data contains commas.
    </NText>
  </NView>
);

export const JsonToExcelContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Convert JSON to Excel?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Excel is the standard tool for data analysis, reporting, and sharing in business environments. Converting JSON directly to XLSX gives you a
      properly structured spreadsheet with headers, typed columns, and auto-sized widths — ready for pivot tables and charts.
    </NText>
  </NView>
);

export const CsvToJsonContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Convert CSV to JSON?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      CSV is the universal exchange format for spreadsheets, databases, and data pipelines. But web APIs, JavaScript applications, and NoSQL databases
      expect JSON.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Importing spreadsheet exports into REST API requests or Postman collections.</NView>
      <NView tag="li">Converting database dumps for use in MongoDB, Firebase, or DynamoDB.</NView>
      <NView tag="li">Transforming CSV data feeds into JSON for front-end consumption.</NView>
      <NView tag="li">Preparing test fixtures from CSV data files.</NView>
    </NView>
  </NView>
);

export const YamlToJsonContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Convert YAML to JSON?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      YAML is the go-to format for Docker Compose, Kubernetes manifests, CI/CD pipelines, and framework configs. But APIs, JavaScript code, and many
      tools expect JSON.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Converting Docker Compose or Kubernetes YAML to JSON for API consumption.</NView>
      <NView tag="li">Transforming CI/CD pipeline configs for programmatic manipulation.</NView>
      <NView tag="li">Importing YAML configuration into applications that only accept JSON.</NView>
      <NView tag="li">Debugging YAML syntax errors by viewing the parsed JSON structure.</NView>
    </NView>
  </NView>
);

export const JsonPathFinderContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Use JSON Path Finder?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Large JSON structures with deep nesting are difficult to navigate manually. JSON Path lets you query nested data using expressions like{' '}
      <NText tag="code">$.users[0].name</NText> &mdash; similar to XPath for XML.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Exploring API responses to find the right path for data extraction.</NView>
      <NView tag="li">Building jq or JSONPath expressions for CI/CD pipelines.</NView>
      <NView tag="li">Navigating complex configuration files or Terraform state.</NView>
      <NView tag="li">Learning JSON structure for unfamiliar third-party APIs.</NView>
    </NView>
  </NView>
);

export const JsonSchemaValidatorContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Validate Against JSON Schema?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      JSON Schema is a vocabulary for annotating and validating JSON documents. It defines expected types, required fields, value ranges, and patterns
      &mdash; catching malformed data before it reaches your database or crashes your application.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Validating API request/response payloads during development.</NView>
      <NView tag="li">Testing form data shapes before integrating with a backend.</NView>
      <NView tag="li">Authoring and verifying JSON Schema definitions for documentation.</NView>
      <NView tag="li">Catching configuration file errors before deploying to production.</NView>
    </NView>
  </NView>
);

export const JsonDiffContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Diff JSON?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Comparing two JSON objects by eye is tedious and error-prone &mdash; a single misplaced comma or renamed key can hide in thousands of lines.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Reviewing API response changes between versions during integration testing.</NView>
      <NView tag="li">Comparing configuration files across environments (dev, staging, prod).</NView>
      <NView tag="li">Auditing database document changes or migration output.</NView>
      <NView tag="li">Verifying that a transformation or migration preserved data integrity.</NView>
    </NView>
  </NView>
);

export const JsonToTypescriptContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Generate TypeScript Interfaces from JSON?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Infer TypeScript interfaces from representative JSON data. Compare multiple payloads to identify optional fields and fields that can contain
      different types.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Typing an API response you don&apos;t control without writing it by hand.</NView>
      <NView tag="li">Bootstrapping types for a new integration from a sample payload.</NView>
      <NView tag="li">Keeping TypeScript types in sync after an API shape changes.</NView>
    </NView>
  </NView>
);

export const JsonFlattenUnflattenContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Flatten or Unflatten JSON?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Flattening collapses a nested JSON document into a single-level object with dot-notation keys (e.g. <NText tag="code">user.address.city</NText>) &mdash;
      useful for spreadsheets, flat key-value stores, and form libraries. Unflattening reverses the process, rebuilding the original nested structure
      (including arrays) from dot-path keys.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Exporting nested JSON to a flat CSV/spreadsheet-friendly format.</NView>
      <NView tag="li">Working with key-value stores (env vars, form data) that can&apos;t hold nested structures.</NView>
      <NView tag="li">
        Reconstructing structured config from a flat <NText tag="code">.env</NText>-style key list.
      </NView>
    </NView>
  </NView>
);

export const JsonQueryStringConverterContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Convert Between JSON and Query Strings?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      A query string encodes key-value pairs in a URL. Percent-encode each key and value, choose how to handle repeated keys, and decide how to
      represent nested objects before converting.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Building a query string from a JSON filter/search state object.</NView>
      <NView tag="li">Debugging what an existing URL&apos;s query parameters actually decode to.</NView>
      <NView tag="li">Converting form state to and from shareable URLs.</NView>
    </NView>
  </NView>
);
