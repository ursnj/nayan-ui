import { NView, NText } from 'nayan-ui/components';
import { H2_DOC, H3_DOC } from '@/design/system';

const Section = ({ children }: { children: React.ReactNode }) => <NView tag="div" className="space-y-3 text-sm leading-relaxed text-muted">{children}</NView>;

export const TextCompareContent = () => (
  <Section>
    <NText tag="p">
      A text diff identifies insertions, deletions, and changes between two versions of a plain- text file. Compare line by line to review edits to
      code, documents, or configuration.
    </NText>
  </Section>
);

export const CharacterCounterContent = () => (
  <Section>
    <NText tag="p">
      Character counts help check a piece of text against a field limit. Count spaces according to the destination’s rules and account for emoji or
      accents made from multiple Unicode code points.
    </NText>
  </Section>
);

export const WordCounterContent = () => (
  <Section>
    <NText tag="p">
      Word counts help estimate length and compare drafts. Word frequency shows repeated terms and depends on how the text is split, normalised, and
      filtered.
    </NText>
  </Section>
);

export const CaseConverterContent = () => (
  <Section>
    <NText tag="p">
      Use text casing conventions to match the context. camelCase and snake_case are common for identifiers, kebab-case is common in URLs, and
      sentence case works for prose.
    </NText>
  </Section>
);

export const LoremIpsumGeneratorContent = () => (
  <Section>
    <NText tag="p">
      Lorem ipsum is placeholder copy for testing the layout and typography of a design. Choose text of a similar length to the expected content to
      reveal wrapping and spacing issues.
    </NText>
  </Section>
);

export const TextReverserContent = () => (
  <Section>
    <NText tag="p">
      Text reversal can reorder lines, words, or characters. When reversing characters, keep grapheme clusters together so emojis and letters with
      combining marks stay intact.
    </NText>
  </Section>
);

export const SlugGeneratorContent = () => (
  <Section>
    <NText tag="p">A slug is a short, readable segment of a URL. Normalise the text, use hyphens between words, and check uniqueness before publishing.</NText>
  </Section>
);

export const MarkdownPreviewContent = () => (
  <Section>
    <NText tag="p">
      A Markdown preview shows how headings, links, lists, and other markup render before publishing. Preview with the same renderer as the
      destination because extensions vary.
    </NText>
  </Section>
);

export const Base64EncoderDecoderContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Use Base64 Encoding?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Base64 is a binary-to-text encoding scheme used everywhere in web development &mdash; from data URIs and email attachments to API authentication
      headers and JWT tokens.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Embedding small images as data URIs in HTML or CSS.</NView>
      <NView tag="li">Encoding binary payloads for JSON APIs or webhooks.</NView>
      <NView tag="li">Decoding Base64 strings found in JWT tokens, emails, or config files.</NView>
      <NView tag="li">Testing API authentication headers that use Basic auth (Base64-encoded credentials).</NView>
    </NView>
  </NView>
);

export const HashGeneratorContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Generate Hashes?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      A cryptographic hash is a fixed-length fingerprint of data. Compare hashes to check file integrity, and use a dedicated password-hashing
      algorithm when storing passwords.
    </NText>

    <NText tag="h3" className={H3_DOC}>When to Use Each Algorithm</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">
        <NText tag="strong">SHA-1</NText> &mdash; legacy systems and git commit hashes (not recommended for security).
      </NView>
      <NView tag="li">
        <NText tag="strong">SHA-256</NText> &mdash; the most widely used; blockchain, SSL certificates, data integrity.
      </NView>
      <NView tag="li">
        <NText tag="strong">SHA-384</NText> &mdash; TLS 1.2+ cipher suites and government standards.
      </NView>
      <NView tag="li">
        <NText tag="strong">SHA-512</NText> &mdash; maximum security where performance is not a concern.
      </NView>
    </NView>
  </NView>
);

export const RegexTesterContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Test Regular Expressions?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Regular expressions are powerful but notoriously tricky to write correctly. A single misplaced quantifier can match too much or too little.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Writing email, URL, or phone number validators for form inputs.</NView>
      <NView tag="li">Extracting data from log files, CSV rows, or HTML markup.</NView>
      <NView tag="li">Building search-and-replace patterns for code refactoring.</NView>
      <NView tag="li">Learning regex syntax with instant visual feedback.</NView>
    </NView>
  </NView>
);

export const TextToBinaryContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Convert Text to Binary?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Understanding how text is represented in different number systems is fundamental to programming, networking, and digital electronics.
    </NText>

    <NText tag="h3" className={H3_DOC}>When to Use Each Format</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">
        <NText tag="strong">Binary</NText> &mdash; digital electronics, low-level programming, bitwise operations.
      </NView>
      <NView tag="li">
        <NText tag="strong">Hexadecimal</NText> &mdash; memory addresses, colour codes, byte inspection.
      </NView>
      <NView tag="li">
        <NText tag="strong">Octal</NText> &mdash; Unix file permissions, legacy systems.
      </NView>
      <NView tag="li">
        <NText tag="strong">Decimal</NText> &mdash; ASCII/Unicode code point lookup.
      </NView>
    </NView>
  </NView>
);

export const FindAndReplaceContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Use Find &amp; Replace?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">Manually editing repeated text is slow and error-prone.</NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Bulk-renaming variables or class names across a code snippet.</NView>
      <NView tag="li">Cleaning up imported data &mdash; removing unwanted characters or normalising formats.</NView>
      <NView tag="li">Replacing placeholder tokens in templates with actual values.</NView>
      <NView tag="li">Stripping HTML tags or special characters from pasted content.</NView>
    </NView>
  </NView>
);

export const LineSorterContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Sort Lines?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Unsorted data is hard to scan and easy to lose duplicates in. Whether you&apos;re cleaning up a word list, organising log entries, or preparing
      data for import, sorting lines brings order to chaos.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Alphabetising import statements, dependency lists, or glossary entries.</NView>
      <NView tag="li">Deduplicating email lists, URLs, or database records.</NView>
      <NView tag="li">Sorting log lines by timestamp (numeric mode) for troubleshooting.</NView>
      <NView tag="li">Randomising quiz questions, playlist items, or raffle entries.</NView>
    </NView>
  </NView>
);

export const Rot13CaesarCipherContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Use a Caesar Cipher?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      The Caesar cipher is the oldest known substitution cipher &mdash; each letter is shifted a fixed number of places through the alphabet, wrapping
      around at the end. A shift of 13 is the well-known ROT13 scheme, long used on forums and newsgroups to hide spoilers and punchlines from casual
      glances. Digits, punctuation, and spacing are left untouched, and letter case is preserved.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Hiding spoilers, puzzle answers, or punchlines in forum posts.</NView>
      <NView tag="li">Simple obfuscation for alternate reality games (ARGs) and puzzle hunts.</NView>
      <NView tag="li">Learning how classical substitution ciphers work before studying modern cryptography.</NView>
    </NView>
  </NView>
);

export const MorseCodeConverterContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Convert Text to Morse Code?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      International Morse Code represents letters, digits, and punctuation as sequences of dots and dashes, originally designed for telegraph
      transmission and still used today in amateur radio licensing, aviation navigation beacons, and emergency signalling.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Studying for an amateur radio licence exam.</NView>
      <NView tag="li">Designing puzzles, escape rooms, or ARGs around Morse code clues.</NView>
      <NView tag="li">Learning the Morse alphabet as a hobby or historical curiosity.</NView>
    </NView>
  </NView>
);

export const LetterFrequencyAnalyzerContent = () => (
  <NView tag="div">
    <NText tag="h2" className={H2_DOC}>Why Analyse Letter Frequency?</NText>
    <NText tag="p" className="mb-5 text-sm leading-relaxed text-muted">
      Letter frequency counts how often each letter appears in a text. Decide whether to fold case, normalise accents, or include letters from
      multiple alphabets.
    </NText>

    <NText tag="h2" className={H2_DOC}>Common Use Cases</NText>
    <NView tag="ul" className="list-disc list-inside leading-relaxed mb-5 text-sm text-muted">
      <NView tag="li">Cryptanalysis and cipher-breaking exercises based on frequency analysis.</NView>
      <NView tag="li">Linguistics coursework comparing letter distributions across languages or texts.</NView>
      <NView tag="li">Classroom demonstrations of how English letter frequency underpins word games like Scrabble.</NView>
    </NView>
  </NView>
);
