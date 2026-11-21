import { H2_DOC, H3_DOC } from '@/design/system';

const Section = ({ children }: { children: React.ReactNode }) => <div className="space-y-3 text-sm leading-relaxed text-muted">{children}</div>;

export const TextCompareContent = () => (
  <Section>
    <p>
      A text diff identifies insertions, deletions, and changes between two versions of a plain- text file. Compare line by line to review edits to
      code, documents, or configuration.
    </p>
  </Section>
);

export const CharacterCounterContent = () => (
  <Section>
    <p>
      Character counts help check a piece of text against a field limit. Count spaces according to the destination’s rules and account for emoji or
      accents made from multiple Unicode code points.
    </p>
  </Section>
);

export const WordCounterContent = () => (
  <Section>
    <p>
      Word counts help estimate length and compare drafts. Word frequency shows repeated terms and depends on how the text is split, normalised, and
      filtered.
    </p>
  </Section>
);

export const CaseConverterContent = () => (
  <Section>
    <p>
      Use text casing conventions to match the context. camelCase and snake_case are common for identifiers, kebab-case is common in URLs, and
      sentence case works for prose.
    </p>
  </Section>
);

export const LoremIpsumGeneratorContent = () => (
  <Section>
    <p>
      Lorem ipsum is placeholder copy for testing the layout and typography of a design. Choose text of a similar length to the expected content to
      reveal wrapping and spacing issues.
    </p>
  </Section>
);

export const TextReverserContent = () => (
  <Section>
    <p>
      Text reversal can reorder lines, words, or characters. When reversing characters, keep grapheme clusters together so emojis and letters with
      combining marks stay intact.
    </p>
  </Section>
);

export const SlugGeneratorContent = () => (
  <Section>
    <p>A slug is a short, readable segment of a URL. Normalise the text, use hyphens between words, and check uniqueness before publishing.</p>
  </Section>
);

export const MarkdownPreviewContent = () => (
  <Section>
    <p>
      A Markdown preview shows how headings, links, lists, and other markup render before publishing. Preview with the same renderer as the
      destination because extensions vary.
    </p>
  </Section>
);

export const Base64EncoderDecoderContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Use Base64 Encoding?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Base64 is a binary-to-text encoding scheme used everywhere in web development &mdash; from data URIs and email attachments to API authentication
      headers and JWT tokens.
    </p>

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
      A cryptographic hash is a fixed-length fingerprint of data. Compare hashes to check file integrity, and use a dedicated password-hashing
      algorithm when storing passwords.
    </p>

    <h3 className={H3_DOC}>When to Use Each Algorithm</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>
        <strong>SHA-1</strong> &mdash; legacy systems and git commit hashes (not recommended for security).
      </li>
      <li>
        <strong>SHA-256</strong> &mdash; the most widely used; blockchain, SSL certificates, data integrity.
      </li>
      <li>
        <strong>SHA-384</strong> &mdash; TLS 1.2+ cipher suites and government standards.
      </li>
      <li>
        <strong>SHA-512</strong> &mdash; maximum security where performance is not a concern.
      </li>
    </ul>
  </div>
);

export const RegexTesterContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Test Regular Expressions?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">
      Regular expressions are powerful but notoriously tricky to write correctly. A single misplaced quantifier can match too much or too little.
    </p>

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
      Understanding how text is represented in different number systems is fundamental to programming, networking, and digital electronics.
    </p>

    <h3 className={H3_DOC}>When to Use Each Format</h3>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>
        <strong>Binary</strong> &mdash; digital electronics, low-level programming, bitwise operations.
      </li>
      <li>
        <strong>Hexadecimal</strong> &mdash; memory addresses, colour codes, byte inspection.
      </li>
      <li>
        <strong>Octal</strong> &mdash; Unix file permissions, legacy systems.
      </li>
      <li>
        <strong>Decimal</strong> &mdash; ASCII/Unicode code point lookup.
      </li>
    </ul>
  </div>
);

export const FindAndReplaceContent = () => (
  <div>
    <h2 className={H2_DOC}>Why Use Find &amp; Replace?</h2>
    <p className="mb-5 text-sm leading-relaxed text-muted">Manually editing repeated text is slow and error-prone.</p>

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
      Unsorted data is hard to scan and easy to lose duplicates in. Whether you&apos;re cleaning up a word list, organising log entries, or preparing
      data for import, sorting lines brings order to chaos.
    </p>

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
      The Caesar cipher is the oldest known substitution cipher &mdash; each letter is shifted a fixed number of places through the alphabet, wrapping
      around at the end. A shift of 13 is the well-known ROT13 scheme, long used on forums and newsgroups to hide spoilers and punchlines from casual
      glances. Digits, punctuation, and spacing are left untouched, and letter case is preserved.
    </p>

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
      International Morse Code represents letters, digits, and punctuation as sequences of dots and dashes, originally designed for telegraph
      transmission and still used today in amateur radio licensing, aviation navigation beacons, and emergency signalling.
    </p>

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
      Letter frequency counts how often each letter appears in a text. Decide whether to fold case, normalise accents, or include letters from
      multiple alphabets.
    </p>

    <h2 className={H2_DOC}>Common Use Cases</h2>
    <ul className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <li>Cryptanalysis and cipher-breaking exercises based on frequency analysis.</li>
      <li>Linguistics coursework comparing letter distributions across languages or texts.</li>
      <li>Classroom demonstrations of how English letter frequency underpins word games like Scrabble.</li>
    </ul>
  </div>
);
