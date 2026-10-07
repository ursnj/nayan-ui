import { H2_DOC, H3_DOC } from "@/design/system";

const Section = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-3 text-sm leading-relaxed text-muted">{children}</div>
);

export const TextCompareContent = () => (
  <Section>
    <p>
      Compare two texts side by side and instantly see additions, removals, and unchanged lines. The diff
      algorithm uses LCS (Longest Common Subsequence) to produce accurate line-by-line comparisons with
      color-coded output.
    </p>
    <p>
      <strong>Features:</strong> Side-by-side input, line-level diff with line numbers, color-coded additions
      (green) and removals (red), diff statistics showing added/removed/unchanged counts. Perfect for
      comparing code, documents, configs, or any plain text.
    </p>
  </Section>
);

export const CharacterCounterContent = () => (
  <Section>
    <p>
      Get a comprehensive breakdown of your text: character count (with and without spaces), word count,
      sentence count, paragraph count, line count, average word length, and estimated reading/speaking time.
    </p>
    <p>
      <strong>Features:</strong> Real-time analysis as you type, reading time estimate (200 WPM), speaking
      time estimate (130 WPM), all metrics update instantly. Great for writers, students, SEO professionals,
      and social media managers checking character limits.
    </p>
  </Section>
);

export const WordCounterContent = () => (
  <Section>
    <p>
      Analyze word frequency in your text. See total words, unique words, vocabulary density, and a ranked
      list of the most frequently used words with visual frequency bars.
    </p>
    <p>
      <strong>Features:</strong> Top 30 word frequency ranking, vocabulary density percentage, visual
      frequency bars, real-time analysis. Useful for content writers, linguists, SEO analysis, and academic
      writing.
    </p>
  </Section>
);

export const CaseConverterContent = () => (
  <Section>
    <p>
      Convert text between multiple case formats with a single click: UPPERCASE, lowercase, Title Case,
      Sentence case, camelCase, snake_case, kebab-case, and aLtErNaTiNg case.
    </p>
    <p>
      <strong>Features:</strong> Eight conversion modes, instant conversion, copy to clipboard. Essential for
      developers converting between naming conventions, writers formatting titles, and anyone needing quick
      text case transformations.
    </p>
  </Section>
);

export const LoremIpsumGeneratorContent = () => (
  <Section>
    <p>
      Generate placeholder text for your designs and prototypes. Choose between paragraphs, sentences, or
      words, and select the count you need. The generated text follows standard Lorem Ipsum patterns.
    </p>
    <p>
      <strong>Features:</strong> Generate paragraphs, sentences, or words; customizable count (1-10); copy
      to clipboard. Perfect for web designers, UI/UX designers, and developers needing placeholder content.
    </p>
  </Section>
);

export const TextReverserContent = () => (
  <Section>
    <p>
      Reverse your text in four different modes: reverse entire text (character by character), reverse word
      order, reverse line order, or reverse each individual word while keeping word order.
    </p>
    <p>
      <strong>Features:</strong> Four reversal modes, instant conversion, copy to clipboard. Fun for
      creating mirror text, reversing lists, or debugging string operations.
    </p>
  </Section>
);

export const SlugGeneratorContent = () => (
  <Section>
    <p>
      Convert any text into a URL-friendly slug. Handles special characters, accented letters (via Unicode
      normalization), extra spaces, and produces clean, lowercase, hyphenated slugs.
    </p>
    <p>
      <strong>Features:</strong> Real-time slug generation as you type, Unicode normalization for accented
      characters, copy to clipboard. Essential for bloggers, CMS users, and developers creating SEO-friendly
      URLs.
    </p>
  </Section>
);

export const MarkdownPreviewContent = () => (
  <Section>
    <p>
      Write markdown in the editor and see a live HTML preview side by side. Supports headings, bold, italic,
      strikethrough, inline code, blockquotes, links, lists, and horizontal rules.
    </p>
    <p>
      <strong>Features:</strong> Live preview as you type, side-by-side editor and preview, supports common
      Markdown syntax. Ideal for writing README files, documentation, blog posts, and any Markdown content.
    </p>
  </Section>
);

export const Base64EncoderDecoderContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Use Base64 Encoding?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Base64 is a binary-to-text encoding scheme used everywhere in web development &mdash; from data
      URIs and email attachments to API authentication headers and JWT tokens. Our free encoder /
      decoder handles full Unicode input (including emojis and CJK characters) and runs entirely in
      your browser, so your data never leaves your machine.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>One-click mode toggle</strong> &mdash; switch between Encode and Decode instantly.</li>
      <li><strong>Unicode safe</strong> &mdash; properly encodes multi-byte characters, accented letters, and emoji.</li>
      <li><strong>Swap button</strong> &mdash; move the output back to the input for quick round-trip testing.</li>
      <li><strong>Copy to clipboard</strong> &mdash; grab the result with a single click.</li>
      <li><strong>Client-side processing</strong> &mdash; your data never leaves your browser.</li>
    </ul>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Embedding small images as data URIs in HTML or CSS.</li>
      <li>Encoding binary payloads for JSON APIs or webhooks.</li>
      <li>Decoding Base64 strings found in JWT tokens, emails, or config files.</li>
      <li>Testing API authentication headers that use Basic auth (Base64-encoded credentials).</li>
    </ul>
  </div>
);

export const HashGeneratorContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Generate Hashes?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Cryptographic hashes are fixed-length fingerprints of arbitrary data. They&apos;re used to verify
      file integrity, store passwords securely, generate checksums, and detect data tampering. Our tool
      uses the native Web Crypto API for hardware-accelerated, standards-compliant hashing directly in
      your browser.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Four algorithms at once</strong> &mdash; SHA-1, SHA-256, SHA-384, and SHA-512 computed simultaneously.</li>
      <li><strong>Hex-encoded output</strong> &mdash; standard hexadecimal representation for each digest.</li>
      <li><strong>Copy individual hashes</strong> &mdash; click any hash to copy it to the clipboard.</li>
      <li><strong>Real-time computation</strong> &mdash; hashes update as you type.</li>
      <li><strong>Client-side processing</strong> &mdash; powered by the Web Crypto API, nothing leaves your browser.</li>
    </ul>

    <h3 className={H3_DOC}>When to Use Each Algorithm</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>SHA-1</strong> &mdash; legacy systems and git commit hashes (not recommended for security).</li>
      <li><strong>SHA-256</strong> &mdash; the most widely used; blockchain, SSL certificates, data integrity.</li>
      <li><strong>SHA-384</strong> &mdash; TLS 1.2+ cipher suites and government standards.</li>
      <li><strong>SHA-512</strong> &mdash; maximum security where performance is not a concern.</li>
    </ul>
  </div>
);

export const RegexTesterContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Test Regular Expressions?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Regular expressions are powerful but notoriously tricky to write correctly. A single misplaced
      quantifier can match too much or too little. Our regex tester gives you instant visual feedback
      so you can iterate quickly, see exactly what matches, and debug capture groups before shipping
      code.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Real-time matching</strong> &mdash; matches update as you type the pattern or test text.</li>
      <li><strong>Configurable flags</strong> &mdash; global (g), case-insensitive (i), multiline (m), and more.</li>
      <li><strong>Capture groups</strong> &mdash; see numbered groups for each match in a clear table.</li>
      <li><strong>Match positions</strong> &mdash; start and end indices for every match.</li>
      <li><strong>Error reporting</strong> &mdash; invalid patterns are caught and displayed as friendly messages.</li>
    </ul>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Writing email, URL, or phone number validators for form inputs.</li>
      <li>Extracting data from log files, CSV rows, or HTML markup.</li>
      <li>Building search-and-replace patterns for code refactoring.</li>
      <li>Learning regex syntax with instant visual feedback.</li>
    </ul>
  </div>
);

export const TextToBinaryContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert Text to Binary?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Understanding how text is represented in different number systems is fundamental to programming,
      networking, and digital electronics. Our converter lets you see the exact binary, hexadecimal,
      octal, or decimal values of every character &mdash; and convert them back to readable text.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Four formats</strong> &mdash; binary (base-2), hexadecimal (base-16), octal (base-8), and decimal (base-10).</li>
      <li><strong>Bidirectional conversion</strong> &mdash; encode text to numbers or decode numbers back to text.</li>
      <li><strong>Space-separated output</strong> &mdash; each character&apos;s code is clearly separated.</li>
      <li><strong>Copy to clipboard</strong> &mdash; grab the result with one click.</li>
      <li><strong>Client-side processing</strong> &mdash; everything runs in your browser.</li>
    </ul>

    <h3 className={H3_DOC}>When to Use Each Format</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Binary</strong> &mdash; digital electronics, low-level programming, bitwise operations.</li>
      <li><strong>Hexadecimal</strong> &mdash; memory addresses, colour codes, byte inspection.</li>
      <li><strong>Octal</strong> &mdash; Unix file permissions, legacy systems.</li>
      <li><strong>Decimal</strong> &mdash; ASCII/Unicode code point lookup.</li>
    </ul>
  </div>
);

export const FindAndReplaceContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Use Find &amp; Replace?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Manually editing repeated text is slow and error-prone. Our Find &amp; Replace tool lets you
      search for literal strings or regular expressions and replace all occurrences at once. A live
      preview shows you exactly what will change before you apply, eliminating surprises.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Literal &amp; regex modes</strong> &mdash; toggle between plain text and full regular expression matching.</li>
      <li><strong>Case-sensitive toggle</strong> &mdash; match exact case or ignore case differences.</li>
      <li><strong>Match count</strong> &mdash; see how many occurrences were found before replacing.</li>
      <li><strong>Live preview</strong> &mdash; the output updates in real time as you type search and replace strings.</li>
      <li><strong>Apply in-place</strong> &mdash; push the result back to the input for chained replacements.</li>
    </ul>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Bulk-renaming variables or class names across a code snippet.</li>
      <li>Cleaning up imported data &mdash; removing unwanted characters or normalising formats.</li>
      <li>Replacing placeholder tokens in templates with actual values.</li>
      <li>Stripping HTML tags or special characters from pasted content.</li>
    </ul>
  </div>
);

export const LineSorterContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Sort Lines?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Unsorted data is hard to scan and easy to lose duplicates in. Whether you&apos;re cleaning up a
      word list, organising log entries, or preparing data for import, sorting lines brings order to
      chaos. Our tool also removes duplicates and empty lines in one pass, saving you multiple steps.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Seven sort modes</strong> &mdash; A&ndash;Z, Z&ndash;A, numeric ascending, numeric descending, shortest first, longest first, and random shuffle.</li>
      <li><strong>Remove duplicates</strong> &mdash; keep only unique lines with one toggle.</li>
      <li><strong>Remove empty lines</strong> &mdash; strip blank lines that clutter the output.</li>
      <li><strong>Trim whitespace</strong> &mdash; clean leading and trailing spaces from every line.</li>
      <li><strong>Copy to clipboard</strong> &mdash; grab the sorted result instantly.</li>
    </ul>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Alphabetising import statements, dependency lists, or glossary entries.</li>
      <li>Deduplicating email lists, URLs, or database records.</li>
      <li>Sorting log lines by timestamp (numeric mode) for troubleshooting.</li>
      <li>Randomising quiz questions, playlist items, or raffle entries.</li>
    </ul>
  </div>
);

export const Rot13CaesarCipherContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Use a Caesar Cipher?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      The Caesar cipher is the oldest known substitution cipher &mdash; each letter is shifted a fixed
      number of places through the alphabet, wrapping around at the end. A shift of 13 is the
      well-known ROT13 scheme, long used on forums and newsgroups to hide spoilers and punchlines from
      casual glances. Digits, punctuation, and spacing are left untouched, and letter case is preserved.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Adjustable shift</strong> &mdash; any amount from 1 to 25, not just the classic ROT13.</li>
      <li><strong>Case preserved</strong> &mdash; uppercase and lowercase letters shift independently.</li>
      <li><strong>Non-letters untouched</strong> &mdash; digits, punctuation, and spacing pass through unchanged.</li>
      <li><strong>Symmetric operation</strong> &mdash; apply the same shift again (mod 26) to reverse it.</li>
      <li><strong>Copy to clipboard</strong> &mdash; grab the result with one click.</li>
    </ul>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Hiding spoilers, puzzle answers, or punchlines in forum posts.</li>
      <li>Simple obfuscation for alternate reality games (ARGs) and puzzle hunts.</li>
      <li>Learning how classical substitution ciphers work before studying modern cryptography.</li>
    </ul>
  </div>
);

export const MorseCodeConverterContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Convert Text to Morse Code?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      International Morse Code represents letters, digits, and punctuation as sequences of dots and
      dashes, originally designed for telegraph transmission and still used today in amateur radio
      licensing, aviation navigation beacons, and emergency signalling. Our converter handles the full
      ITU character set in both directions, with words separated by &ldquo;/&rdquo; and letters
      separated by spaces.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Two-way conversion</strong> &mdash; Text &rarr; Morse and Morse &rarr; Text modes.</li>
      <li><strong>Full ITU character set</strong> &mdash; letters, digits, and common punctuation.</li>
      <li><strong>Standard spacing</strong> &mdash; words separated by &ldquo;/&rdquo;, letters by spaces.</li>
      <li><strong>Copy to clipboard</strong> &mdash; grab the result with one click.</li>
    </ul>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Studying for an amateur radio licence exam.</li>
      <li>Designing puzzles, escape rooms, or ARGs around Morse code clues.</li>
      <li>Learning the Morse alphabet as a hobby or historical curiosity.</li>
    </ul>
  </div>
);

export const LetterFrequencyAnalyzerContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Analyse Letter Frequency?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Every language has a characteristic letter distribution &mdash; in English, E and T appear far
      more often than Q or Z. This pattern is the foundation of classical cryptanalysis (frequency
      analysis can crack a simple substitution cipher), and it is also a staple exercise in linguistics
      and introductory programming courses. Our analyser counts every letter A&ndash;Z
      case-insensitively and ranks them from most to least common.
    </p>

    <h2 className={H2_DOC}>Features</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li><strong>Full A&ndash;Z breakdown</strong> &mdash; count and percentage for every letter, with visual bars.</li>
      <li><strong>Case-insensitive</strong> &mdash; uppercase and lowercase count as the same letter.</li>
      <li><strong>Most / least frequent callouts</strong> &mdash; the extremes are highlighted automatically.</li>
      <li><strong>Total letter count</strong> &mdash; non-letter characters are excluded from the analysis.</li>
    </ul>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Cryptanalysis and cipher-breaking exercises based on frequency analysis.</li>
      <li>Linguistics coursework comparing letter distributions across languages or texts.</li>
      <li>Classroom demonstrations of how English letter frequency underpins word games like Scrabble.</li>
    </ul>
  </div>
);
