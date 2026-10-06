import { H2_DOC } from "@/design/system";

export const XmlFormatterContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Format XML?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Unformatted XML from APIs, configuration files, or data exports is often a single dense line.
      Formatting it with proper indentation reveals the element hierarchy, speeds up debugging, and
      makes code reviews far easier.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Customizable indent</strong> — choose 2 or 4 spaces.</li>
      <li><strong>Instant formatting</strong> — runs entirely in your browser.</li>
      <li><strong>Error detection</strong> — shows parse errors if the XML is malformed.</li>
      <li><strong>Copy to clipboard</strong> — one click to copy the formatted output.</li>
    </ul>
  </div>
);

export const XmlMinifierContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Minify XML?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Minifying XML strips all unnecessary whitespace, reducing file size for faster network
      transfers, smaller payloads, and more efficient storage. Especially useful for SOAP envelopes,
      configuration files, and data feeds.
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

export const XmlValidatorContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Validate XML?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Malformed XML causes silent failures in SOAP integrations, RSS feeds, configuration loaders,
      and data pipelines. Our validator checks well-formedness, reports the root element, counts
      every element, and measures nesting depth.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Well-formedness check</strong> — detects unclosed tags, mismatched names, and illegal characters.</li>
      <li><strong>Structure analysis</strong> — reports root tag, total elements, and maximum depth.</li>
      <li><strong>Instant feedback</strong> — validation runs entirely in your browser.</li>
      <li><strong>Clear error messages</strong> — pinpoints what went wrong.</li>
    </ul>
  </div>
);

export const XmlToJsonContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert XML to JSON?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      JSON is the lingua franca of modern APIs, JavaScript, and NoSQL databases. Converting XML to
      JSON bridges legacy SOAP services, RSS feeds, and enterprise systems with modern front-ends
      and microservices.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Recursive conversion</strong> — nested elements map to nested JSON objects.</li>
      <li><strong>Array detection</strong> — repeated sibling tags become JSON arrays.</li>
      <li><strong>Download as file</strong> — save the JSON directly to your device.</li>
      <li><strong>Copy to clipboard</strong> — paste into your editor instantly.</li>
    </ul>
  </div>
);

export const XmlToCsvContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert XML to CSV?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      CSV is the universal import format for spreadsheets, databases, and data analysis tools.
      Converting XML records to CSV makes your data importable into Excel, Google Sheets, R, Python
      pandas, and virtually any data tool.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Automatic headers</strong> — column names are extracted from element tags.</li>
      <li><strong>Proper escaping</strong> — handles commas, quotes, and newlines in values.</li>
      <li><strong>Download as file</strong> — save the CSV directly to your device.</li>
      <li><strong>Copy to clipboard</strong> — paste into spreadsheets instantly.</li>
    </ul>
  </div>
);

export const XmlToYamlContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert XML to YAML?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      YAML is the preferred format for configuration files in Docker, Kubernetes, CI/CD pipelines,
      and many frameworks. Converting XML to YAML produces clean, human-readable config files
      without the verbosity of angle brackets.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Clean output</strong> — proper indentation, no closing tags or brackets.</li>
      <li><strong>Array handling</strong> — repeated elements are rendered as YAML sequences.</li>
      <li><strong>Safe quoting</strong> — special characters are quoted automatically.</li>
      <li><strong>Download as file</strong> — save as .yaml directly.</li>
    </ul>
  </div>
);

export const XmlToTsvContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert XML to TSV?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Tab-separated values (TSV) are ideal for pasting into spreadsheets, feeding into command-line
      tools like <code>awk</code> and <code>cut</code>, and importing into databases. TSV avoids
      the quoting complexity of CSV when your data contains commas.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Automatic headers</strong> — column names from element tags.</li>
      <li><strong>Tab-safe values</strong> — tabs and newlines in values are replaced.</li>
      <li><strong>Download as file</strong> — save as .tsv directly.</li>
      <li><strong>Copy to clipboard</strong> — paste into any spreadsheet.</li>
    </ul>
  </div>
);

export const XmlToExcelContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert XML to Excel?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Excel is the standard tool for data analysis, reporting, and sharing in business environments.
      Converting XML directly to XLSX gives you a properly structured spreadsheet with headers,
      typed columns, and auto-sized widths — ready for pivot tables and charts.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>XLSX output</strong> — compatible with Excel, Google Sheets, and LibreOffice Calc.</li>
      <li><strong>Bold headers</strong> — column names are formatted as bold header row.</li>
      <li><strong>Auto-sized columns</strong> — widths adjust to the content.</li>
      <li><strong>Nested data handling</strong> — nested elements are JSON-stringified in cells.</li>
    </ul>
  </div>
);

export const XPathTesterContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Test XPath Expressions?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      XPath is the standard query language for navigating and extracting data from XML documents —
      used in XSLT, web scraping, test automation, and SOAP integrations. Testing an expression
      against real sample data before using it in code saves debugging time.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Real evaluation</strong> — runs your browser's native XPath engine, not a simulation.</li>
      <li><strong>All result types</strong> — node-sets, strings, numbers, and booleans are all displayed correctly.</li>
      <li><strong>Element and attribute matches</strong> — both are shown with their string value.</li>
      <li><strong>Clear errors</strong> — invalid XML or unsupported XPath syntax is reported plainly.</li>
    </ul>
  </div>
);

export const CsvToXmlContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert CSV to XML?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Many legacy systems, SOAP APIs, and enterprise data feeds only accept XML. Converting a CSV
      export from a spreadsheet into well-formed XML lets you integrate with those systems without
      manual reformatting.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Quoted-field aware</strong> — correctly handles commas, quotes, and newlines inside CSV cells.</li>
      <li><strong>Configurable tags</strong> — choose your own root and row element names.</li>
      <li><strong>Proper escaping</strong> — special XML characters in values are escaped automatically.</li>
      <li><strong>Download as file</strong> — save the XML directly to your device.</li>
    </ul>
  </div>
);

export const YamlToXmlContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert YAML to XML?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      YAML configuration files sometimes need to feed into XML-based tooling, legacy config loaders,
      or XSLT pipelines. This tool parses real YAML — including nested mappings and indented lists —
      and produces well-formed XML.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Nested mapping support</strong> — nested YAML objects become nested XML elements.</li>
      <li><strong>List handling</strong> — YAML sequences become repeated sibling elements.</li>
      <li><strong>Configurable root tag</strong> — name the document root however you like.</li>
      <li><strong>Download as file</strong> — save the XML directly to your device.</li>
    </ul>
  </div>
);
