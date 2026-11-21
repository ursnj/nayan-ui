import { H2_DOC } from '@/design/system';

export const XmlFormatterContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Format XML?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Unformatted XML from APIs, configuration files, or data exports is often a single dense line. Formatting it with proper indentation reveals the
      element hierarchy, speeds up debugging, and makes code reviews far easier.
    </p>
  </div>
);

export const XmlMinifierContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Minify XML?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Minifying XML strips all unnecessary whitespace, reducing file size for faster network transfers, smaller payloads, and more efficient storage.
      Especially useful for SOAP envelopes, configuration files, and data feeds.
    </p>
  </div>
);

export const XmlValidatorContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Validate XML?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Malformed XML causes silent failures in SOAP integrations, RSS feeds, configuration loaders, and data pipelines.
    </p>
  </div>
);

export const XmlToJsonContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert XML to JSON?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      JSON is the lingua franca of modern APIs, JavaScript, and NoSQL databases. Converting XML to JSON bridges legacy SOAP services, RSS feeds, and
      enterprise systems with modern front-ends and microservices.
    </p>
  </div>
);

export const XmlToCsvContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert XML to CSV?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      CSV is the universal import format for spreadsheets, databases, and data analysis tools. Converting XML records to CSV makes your data
      importable into Excel, Google Sheets, R, Python pandas, and virtually any data tool.
    </p>
  </div>
);

export const XmlToYamlContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert XML to YAML?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      YAML is the preferred format for configuration files in Docker, Kubernetes, CI/CD pipelines, and many frameworks. Converting XML to YAML
      produces clean, human-readable config files without the verbosity of angle brackets.
    </p>
  </div>
);

export const XmlToTsvContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert XML to TSV?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Tab-separated values (TSV) are ideal for pasting into spreadsheets, feeding into command-line tools like <code>awk</code> and <code>cut</code>,
      and importing into databases. TSV avoids the quoting complexity of CSV when your data contains commas.
    </p>
  </div>
);

export const XmlToExcelContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert XML to Excel?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Excel is the standard tool for data analysis, reporting, and sharing in business environments. Converting XML directly to XLSX gives you a
      properly structured spreadsheet with headers, typed columns, and auto-sized widths — ready for pivot tables and charts.
    </p>
  </div>
);

export const XPathTesterContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Test XPath Expressions?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      XPath is the standard query language for navigating and extracting data from XML documents — used in XSLT, web scraping, test automation, and
      SOAP integrations. Testing an expression against real sample data before using it in code saves debugging time.
    </p>
  </div>
);

export const CsvToXmlContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert CSV to XML?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Many legacy systems, SOAP APIs, and enterprise data feeds only accept XML. Converting a CSV export from a spreadsheet into well-formed XML lets
      you integrate with those systems without manual reformatting.
    </p>
  </div>
);

export const YamlToXmlContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert YAML to XML?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      YAML mappings and sequences can be translated to XML elements for integrations that require XML. Choose a single root element and a consistent
      way to represent sequence items.
    </p>
  </div>
);
