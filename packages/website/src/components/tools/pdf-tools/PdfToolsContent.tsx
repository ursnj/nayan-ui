import { H2_DOC, H3_DOC } from "@/design/system";

export const MergePdfContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Merge PDFs?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Combining multiple PDF documents into a single file streamlines sharing, printing, and
      archiving. Whether you are assembling a report from separate chapters, compiling invoices,
      or creating a portfolio, our merge tool handles it in seconds.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Unlimited files</strong> — merge as many PDFs as you need.</li>
      <li><strong>Drag &amp; drop</strong> — reorder files before merging.</li>
      <li><strong>Preserves formatting</strong> — all pages, annotations, and links are kept intact.</li>
      <li><strong>Instant download</strong> — the merged file is ready immediately.</li>
    </ul>
  </div>
);

export const SplitPdfContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Split PDFs?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Splitting a large PDF lets you extract only the pages you need — perfect for sending a
      specific section of a report, removing cover pages, or breaking a document into chapters.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Flexible ranges</strong> — specify pages like &ldquo;1-3,5,7-9&rdquo;.</li>
      <li><strong>Multiple outputs</strong> — each range becomes a separate PDF.</li>
      <li><strong>No page limit</strong> — works with documents of any length.</li>
    </ul>
  </div>
);

export const CompressPdfContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Compress PDFs?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Large PDF files are difficult to email, slow to upload, and waste storage. Our compressor
      re-serialises the document to strip unused objects and optimise internal streams, reducing
      file size without removing visible content.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Lossless optimisation</strong> — page content is preserved exactly.</li>
      <li><strong>Object stream compression</strong> — uses PDF 1.5+ object streams for smaller files.</li>
      <li><strong>Metadata stripping</strong> — removes unnecessary metadata to save space.</li>
      <li><strong>Before / after comparison</strong> — see exactly how much space you saved.</li>
    </ul>
  </div>
);

export const RotatePdfContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Rotate PDF Pages?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Scanned documents, faxes, and photos sometimes end up with the wrong orientation. Rotating
      individual pages or the entire document fixes this without any desktop software.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>90°, 180°, 270°</strong> — rotate clockwise by any increment.</li>
      <li><strong>All or selected pages</strong> — target specific pages or the whole document.</li>
      <li><strong>Instant processing</strong> — rotation is metadata-only, so it&apos;s instantaneous.</li>
    </ul>
  </div>
);

export const WatermarkPdfContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Watermark PDFs?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Watermarking protects your intellectual property and signals the document&apos;s status —
      DRAFT, CONFIDENTIAL, or your brand name. Our tool adds text watermarks to every page with
      customisable font size, colour, opacity, and position.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Custom text</strong> — type any watermark message.</li>
      <li><strong>Adjustable opacity</strong> — from subtle to prominent.</li>
      <li><strong>Multiple positions</strong> — centre, corners, or tiled across every page.</li>
      <li><strong>Colour picker</strong> — match your brand or choose a neutral grey.</li>
    </ul>
  </div>
);

export const PageNumbersPdfContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Add Page Numbers?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Page numbers make multi-page documents easier to reference, navigate, and print. Our tool
      adds them with a customisable format and position — no desktop software required.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Custom format</strong> — use templates like &ldquo;Page &#123;current&#125; of &#123;total&#125;&rdquo;.</li>
      <li><strong>Six positions</strong> — top/bottom × left/centre/right.</li>
      <li><strong>Adjustable font size</strong> — from discreet to prominent.</li>
    </ul>
  </div>
);

export const ProtectPdfContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Protect PDFs?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Password protection prevents unauthorised access to sensitive documents — contracts,
      financial reports, medical records, and more. Our tool lets you set a password before
      sharing.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Password protection</strong> — set a password to restrict access.</li>
      <li><strong>Clean re-serialisation</strong> — the output is a fresh PDF copy.</li>
      <li><strong>Instant processing</strong> — no waiting for server queues.</li>
    </ul>
  </div>
);

export const ImageToPdfContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert Images to PDF?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      PDFs are the universal format for sharing documents. Converting images to PDF makes them
      easier to print, email, and archive — especially when you need multiple images in a single
      document.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Multiple images</strong> — each image becomes a separate PDF page.</li>
      <li><strong>Portrait or landscape</strong> — choose the page orientation.</li>
      <li><strong>Contain or fill</strong> — fit images within margins or stretch to fill.</li>
      <li><strong>A4 page size</strong> — standard paper size for printing.</li>
    </ul>
  </div>
);

export const PdfToImageContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert PDF to Images?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Extracting PDF pages as images is useful for previews, thumbnails, presentations, and
      social media sharing. Our tool analyses the PDF and lets you download individual pages.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Page-by-page extraction</strong> — download any page individually.</li>
      <li><strong>Page dimensions</strong> — see the size of each page before downloading.</li>
      <li><strong>Multiple formats</strong> — choose PNG or JPEG output.</li>
    </ul>
  </div>
);

export const UnlockPdfContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Unlock PDFs?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Password-protected PDFs can be inconvenient when you know the password but need to remove
      it for easier sharing or archiving. Our unlock tool decrypts the document and saves a
      clean, unprotected copy.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>AES-256 &amp; RC4 support</strong> — handles modern and legacy encryption.</li>
      <li><strong>Password validation</strong> — clearly reports wrong passwords.</li>
      <li><strong>Clean output</strong> — the unlocked file has no encryption metadata.</li>
      <li><strong>Instant processing</strong> — decryption happens in milliseconds.</li>
    </ul>
  </div>
);

export const OrganizePdfContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Organize PDFs?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Rearrange, reorder, or remove pages from your PDF documents. Perfect for reorganizing
      scanned documents, removing blank pages, or creating a custom page sequence.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Drag-style reordering</strong> — move pages up or down to rearrange them.</li>
      <li><strong>Page deletion</strong> — remove unwanted pages from your document.</li>
      <li><strong>Visual page list</strong> — see all pages at a glance before applying changes.</li>
      <li><strong>Lossless output</strong> — page content is preserved exactly as-is.</li>
    </ul>
  </div>
);

export const CropPdfContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Crop PDFs?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Trim unwanted margins, white space, or borders from your PDF pages. Ideal for
      preparing documents for printing, presentations, or removing scan artifacts.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Percentage-based cropping</strong> — set margins as a percentage of page size.</li>
      <li><strong>Individual controls</strong> — adjust top, right, bottom, and left margins independently.</li>
      <li><strong>Apply to all pages</strong> — crop every page with the same settings.</li>
      <li><strong>Non-destructive</strong> — sets crop box without altering original content.</li>
    </ul>
  </div>
);

export const RepairPdfContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Repair PDFs?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Fix corrupted or damaged PDF files that won&apos;t open properly. Our repair tool
      re-serializes the document structure, recovering as many pages as possible.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Structure recovery</strong> — rebuilds the PDF cross-reference table and object streams.</li>
      <li><strong>Page recovery</strong> — extracts and re-assembles all recoverable pages.</li>
      <li><strong>Error reporting</strong> — tells you if the file is beyond repair.</li>
      <li><strong>Clean output</strong> — produces a fresh, standards-compliant PDF.</li>
    </ul>
  </div>
);

export const HtmlToPdfContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert HTML to PDF?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Convert HTML content into a downloadable PDF document. Great for saving web content,
      generating reports, or creating printable versions of your data.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>HTML tag stripping</strong> — intelligently converts HTML to clean text.</li>
      <li><strong>Multiple page sizes</strong> — supports A4, Letter, and Legal formats.</li>
      <li><strong>Custom title</strong> — set the document title and metadata.</li>
      <li><strong>Auto-pagination</strong> — content flows across multiple pages automatically.</li>
    </ul>
  </div>
);

export const WordToPdfContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert Word to PDF?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      PDF is the universal format for sharing documents that look the same on every device.
      Converting your Word documents to PDF ensures consistent formatting and layout.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>DOC &amp; DOCX support</strong> — handles both legacy and modern Word formats.</li>
      <li><strong>Text extraction</strong> — extracts text content from the document structure.</li>
      <li><strong>Clean PDF output</strong> — produces a well-formatted, multi-page PDF.</li>
      <li><strong>Instant download</strong> — the PDF is ready immediately after conversion.</li>
    </ul>
  </div>
);

export const PdfToWordContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert PDF to Word?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Need to edit a PDF? Converting it to a Word document gives you editing capabilities.
      Our tool creates a DOCX file with the document structure preserved.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Editable output</strong> — the DOCX file can be opened in Word, Google Docs, or LibreOffice.</li>
      <li><strong>Page structure</strong> — each PDF page maps to a section in the Word document.</li>
      <li><strong>Server-side processing</strong> — conversion happens securely on the server.</li>
      <li><strong>No software needed</strong> — works entirely in your browser.</li>
    </ul>
  </div>
);

export const ExcelToPdfContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert Excel to PDF?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Share your spreadsheets as PDFs to ensure everyone sees the same layout.
      Our tool renders Excel data into a clean, tabular PDF format.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>XLS &amp; XLSX support</strong> — handles both legacy and modern Excel formats.</li>
      <li><strong>Table rendering</strong> — cells are drawn as a grid with borders and headers.</li>
      <li><strong>Multi-sheet support</strong> — each worksheet gets its own section in the PDF.</li>
      <li><strong>Landscape layout</strong> — optimized for wide spreadsheets.</li>
    </ul>
  </div>
);

export const PdfToExcelContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert PDF to Excel?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Extract data from PDF files into editable Excel spreadsheets.
      Perfect for working with tabular data locked in PDF documents.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>XLSX output</strong> — compatible with Excel, Google Sheets, and LibreOffice Calc.</li>
      <li><strong>Page mapping</strong> — each PDF page is represented in the spreadsheet.</li>
      <li><strong>Clean structure</strong> — data is organized in rows and columns.</li>
      <li><strong>Instant processing</strong> — conversion happens in seconds.</li>
    </ul>
  </div>
);

export const PptToPdfContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert PowerPoint to PDF?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Share your presentations as PDFs for universal compatibility.
      Our tool extracts slide content and renders it into a clean PDF format.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>PPT &amp; PPTX support</strong> — handles both legacy and modern PowerPoint formats.</li>
      <li><strong>Slide text extraction</strong> — captures text from each slide.</li>
      <li><strong>Widescreen layout</strong> — PDF pages match presentation aspect ratio.</li>
      <li><strong>One page per slide</strong> — each slide maps to a PDF page.</li>
    </ul>
  </div>
);

export const PdfToMarkdownContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert PDF to Markdown?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Markdown is the universal format for documentation, README files, wikis, and static site
      generators. Converting a PDF to Markdown lets you extract the document structure into a
      lightweight, version-control-friendly format that can be edited in any text editor, rendered
      on GitHub, or published with tools like Jekyll, Hugo, or Docusaurus.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Structured output</strong> — headings, page breaks, and metadata are mapped to Markdown syntax.</li>
      <li><strong>Document metadata</strong> — title, author, and page count are included at the top.</li>
      <li><strong>Page dimensions</strong> — each page section shows width, height, and rotation info.</li>
      <li><strong>Download or copy</strong> — save the result as a .md file or copy to clipboard.</li>
      <li><strong>Drag &amp; drop</strong> — drop a PDF file directly onto the upload area.</li>
    </ul>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      The PDF is parsed on the server using pdf-lib to extract document metadata and page
      information. Each page is converted into a Markdown section with a level-2 heading, page
      dimensions, and content placeholder. The result is a clean Markdown document ready for
      editing.
    </p>

    <h3 className={H3_DOC}>Common Use Cases</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Converting PDF documentation into editable Markdown for wikis or docs sites.</li>
      <li>Extracting PDF structure for migration to static site generators.</li>
      <li>Creating Markdown templates from existing PDF layouts.</li>
      <li>Version-controlling document content in Git repositories.</li>
    </ul>
  </div>
);

export const MarkdownToPdfContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert Markdown to PDF?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Markdown is great for writing but not ideal for sharing with non-technical audiences. Converting
      your Markdown to a polished PDF gives you a professional, print-ready document that anyone can
      open — no Markdown renderer required. Perfect for reports, proposals, documentation handoffs,
      and resumes written in Markdown.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Full Markdown support</strong> — headings (h1–h3), bold, italic, lists, blockquotes, links, and horizontal rules.</li>
      <li><strong>Upload .md files</strong> — drag and drop or browse for existing Markdown files.</li>
      <li><strong>Page size options</strong> — choose A4, Letter, or Legal page dimensions.</li>
      <li><strong>Custom title</strong> — set the PDF document title and filename.</li>
      <li><strong>Clean typography</strong> — headings use bold Helvetica with appropriate sizing.</li>
      <li><strong>Instant download</strong> — the PDF is generated on the server and ready immediately.</li>
    </ul>

    <h2 className={H2_DOC}>How It Works</h2>
    <p className="mb-3 text-sm leading-relaxed text-muted">
      The Markdown content is sent to the server where it is parsed line-by-line. Headings,
      lists, blockquotes, and paragraphs are each rendered with appropriate font sizes and
      formatting using pdf-lib with Helvetica fonts. The result is a multi-page PDF with proper
      word wrapping, heading hierarchy, and paragraph spacing.
    </p>

    <h3 className={H3_DOC}>Supported Markdown Syntax</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Headings</strong> — # h1, ## h2, ### h3 with scaled font sizes.</li>
      <li><strong>Emphasis</strong> — **bold** and *italic* text (rendered as plain text in PDF).</li>
      <li><strong>Lists</strong> — unordered (- item) and ordered (1. item) lists with bullet points.</li>
      <li><strong>Blockquotes</strong> — &gt; quoted text with a leading bar character.</li>
      <li><strong>Horizontal rules</strong> — --- rendered as a separator line.</li>
      <li><strong>Links</strong> — [text](url) with the link text preserved.</li>
    </ul>
  </div>
);

export const PdfToPptContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert PDF to PowerPoint?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Turn your PDF documents into editable PowerPoint presentations.
      Each PDF page becomes a slide you can edit, restyle, and present.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>PPTX output</strong> — compatible with PowerPoint, Google Slides, and Keynote.</li>
      <li><strong>Page-to-slide mapping</strong> — each PDF page becomes a presentation slide.</li>
      <li><strong>Widescreen format</strong> — slides use 16:9 layout by default.</li>
      <li><strong>Editable text</strong> — slide content can be modified after conversion.</li>
    </ul>
  </div>
);

export const PdfToTextContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Extract Text from a PDF?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Sometimes you just need the words, not the formatting. This tool reads every page of
      your PDF and pulls out the real text content — ready to copy, search, or feed into
      another tool — without hardcoded placeholders or guesswork.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Real text extraction</strong> — reconstructs reading order from the PDF's own layout.</li>
      <li><strong>Page markers</strong> — each page's text is clearly separated.</li>
      <li><strong>Copy or download</strong> — grab the text instantly or save it as a .txt file.</li>
      <li><strong>Scanned-page detection</strong> — pages with no extractable text (image scans) are flagged, not faked.</li>
    </ul>
  </div>
);

export const PdfMetadataEditorContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Edit PDF Metadata?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Every PDF carries hidden document properties — title, author, subject, and keywords —
      that show up in file managers, search results, and "Document Properties" dialogs.
      Clean up or correct this metadata without needing desktop software.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Reads existing metadata</strong> — auto-populates fields from the uploaded PDF.</li>
      <li><strong>Editable fields</strong> — title, author, subject, and keywords.</li>
      <li><strong>Instant re-download</strong> — saves a new copy with your updated metadata.</li>
    </ul>
  </div>
);

export const PdfInfoContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Check PDF Info?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Get a quick, accurate snapshot of any PDF — page count, file size, PDF version,
      encryption status, and an approximate word count — before you decide what to do with it.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Real computed stats</strong> — nothing here is guessed or hardcoded.</li>
      <li><strong>Encryption detection</strong> — instantly see if a PDF is password-protected.</li>
      <li><strong>Document properties</strong> — title, author, and producer, when present.</li>
      <li><strong>Word count</strong> — derived from genuine text extraction, not file size estimates.</li>
    </ul>
  </div>
);

export const SignPdfContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Sign a PDF Online?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Draw your signature with your mouse or finger and stamp it onto any page of a PDF —
      no printing, scanning, or desktop app required.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Draw-to-sign</strong> — a built-in signature pad for mouse or touch input.</li>
      <li><strong>Placement control</strong> — choose the page, corner position, and size.</li>
      <li><strong>Instant download</strong> — the signed PDF is ready immediately.</li>
    </ul>
  </div>
);

export const ExtractImagesFromPdfContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Extract Images from a PDF?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      PDFs often embed photos, logos, and diagrams as raster images. This tool finds every
      embedded image across all pages and packages them into a single ZIP download.
    </p>
    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Real image decoding</strong> — extracts actual embedded raster images, not page screenshots.</li>
      <li><strong>Every page scanned</strong> — finds images across the entire document.</li>
      <li><strong>ZIP download</strong> — all extracted images bundled into one file.</li>
      <li><strong>Honest results</strong> — clearly reports when a PDF has no embedded raster images.</li>
    </ul>
  </div>
);
