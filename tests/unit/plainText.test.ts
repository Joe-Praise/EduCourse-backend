import { describe, it, expect } from 'vitest';
import { richTextToPlainText, stripExecutableMarkup } from '../../src/utils/plainText.js';

describe('richTextToPlainText: structure', () => {
  it.each([
    ['two paragraphs keep a blank line', '<p>First paragraph.</p><p>Second paragraph.</p>', 'First paragraph.\n\nSecond paragraph.'],
    ['headings stay readable', '<h2>Scaling</h2><p>Scaling increases system capacity.</p><h3>Vertical</h3><p>Bigger machines.</p>', 'Scaling\n\nScaling increases system capacity.\n\nVertical\n\nBigger machines.'],
    ['unordered list items stay separate', '<ul><li>Vertical scaling</li><li>Horizontal scaling</li></ul>', 'Vertical scaling\nHorizontal scaling'],
    ['TipTap list items (<li><p>)', '<ul><li><p>Vertical scaling</p></li><li><p>Horizontal scaling</p></li></ul>', 'Vertical scaling\nHorizontal scaling'],
    ['ordered lists keep their numbers', '<ol><li><p>Measure</p></li><li><p>Scale</p></li></ol>', '1. Measure\n2. Scale'],
    ['ordered lists honour start', '<ol start="3"><li><p>Measure</p></li><li><p>Scale</p></li></ol>', '3. Measure\n4. Scale'],
    ['lists are set apart from paragraphs', '<p>Intro</p><ul><li><p>A</p><ul><li><p>A1</p></li></ul></li></ul><p>After</p>', 'Intro\n\nA\nA1\n\nAfter'],
    ['hard breaks become line breaks', '<p>Line one<br>Line two</p>', 'Line one\nLine two'],
    ['code blocks keep their indentation', '<pre><code>fn main() {\n    println!("hi");\n}</code></pre><p>after</p>', 'fn main() {\n    println!("hi");\n}\n\nafter'],
    ['builder callouts are blocks', '<div data-callout="" data-tone="info"><p>Note</p></div><p>Body</p>', 'Note\n\nBody'],
  ])('%s', (_label, input, expected) => {
    expect(richTextToPlainText(input)).toBe(expected);
  });
});

describe('richTextToPlainText: inline text', () => {
  it.each([
    ['bold and italic become plain text', '<p>Use <strong>horizontal scaling</strong> when <em>necessary</em>.</p>', 'Use horizontal scaling when necessary.'],
    ['nested formatting keeps its spaces', '<p><strong>bold <em>and italic</em></strong> text</p>', 'bold and italic text'],
    ['adjacent inline tags add no spaces', '<p>A<strong>B</strong>C</p>', 'ABC'],
    ['links keep their text only', '<p>See <a href="https://example.com" target="_blank">the docs</a>.</p>', 'See the docs.'],
  ])('%s', (_label, input, expected) => {
    expect(richTextToPlainText(input)).toBe(expected);
  });
});

describe('richTextToPlainText: entities and notation', () => {
  it.each([
    ['&amp; decodes to &', '<p>Systems &amp; scalability</p>', 'Systems & scalability'],
    ['entities decode exactly once', '<p>&amp;lt;T&amp;gt; and &amp;amp;</p>', '&lt;T&gt; and &amp;'],
    ['editor-escaped notation', '<p>Generics &lt;T&gt; in Rust, x &lt; y</p>', 'Generics <T> in Rust, x < y'],
    ['Generics <T>', 'Generics <T> in Rust', 'Generics <T> in Rust'],
    ['Vec<T>', 'Vec<T>', 'Vec<T>'],
    ['Map<K, V>', 'Map<K, V>', 'Map<K, V>'],
    ['x < y', 'x < y', 'x < y'],
    ['x > y', 'x > y', 'x > y'],
    ['A & B', 'A & B', 'A & B'],
    ['nested generics', 'HashMap<String, Vec<u8>>', 'HashMap<String, Vec<u8>>'],
    ['capitalised element names', 'List<Object> and Option<A>', 'List<Object> and Option<A>'],
    ['comparison code', 'if (a<b && c>d) {}', 'if (a<b && c>d) {}'],
    ['notation inside editor HTML', '<p>Use Vec<T> and Map<K, V> here</p><p>next</p>', 'Use Vec<T> and Map<K, V> here\n\nnext'],
  ])('%s', (_label, input, expected) => {
    expect(richTextToPlainText(input)).toBe(expected);
  });
});

describe('richTextToPlainText: executable markup', () => {
  it.each([
    ['script elements', '<p>Hi</p><script>alert(1)</script>', 'Hi'],
    ['script in any case', '<SCRIPT>alert(1)</SCRIPT>ok', 'ok'],
    ['style elements', '<style>p { color: red }</style><p>Text</p>', 'Text'],
    ['an unclosed script keeps the text after it', 'Intro <script>x <img src=x onerror=alert(1)> rest', 'Intro x rest'],
    ['event-handler attributes', '<p onclick="alert(1)">Click</p>', 'Click'],
    ['event handlers in any case', '<IMG SRC=x ONERROR=alert(1)>after', 'after'],
    ['event handlers on unknown tags', '<T onload=alert(1)>x', 'x'],
    ['script URLs, even obfuscated', '<a href="java\tscript:alert(1)">link</a>', 'link'],
    ['iframes with their content', '<iframe srcdoc="<script>alert(1)</script>">fallback</iframe>after', 'after'],
  ])('%s', (_label, input, expected) => {
    const out = richTextToPlainText(input);
    expect(out).toBe(expected);
    expect(out).not.toMatch(/<script|<img|<iframe|onerror|onclick|onload|javascript:/i);
  });
});

describe('richTextToPlainText: malformed input, empty input, whitespace', () => {
  it.each([
    ['unclosed tags', '<p>Unclosed <strong>bold', 'Unclosed bold'],
    ['stray end tags', '<p>a</div>b</p>', 'ab'],
    ['implicitly closed list items', '<ul><li>One<li>Two</ul>', 'One\nTwo'],
    ['an unterminated tag at the end', 'Ends with <b', 'Ends with <b'],
    ['an unterminated tag mid-word', 'x<y and z', 'x<y and z'],
    ['an unterminated tag after editor HTML', '<p>tail &amp; <b', 'tail & <b'],
    ['a stray literal end tag', 'a</T>b', 'a</T>b'],
    ['comments and doctypes', '<!DOCTYPE html><p>a</p><!-- note --><p>b</p>', 'a\n\nb'],
    ['empty string', '', ''],
    ['empty editor document', '<p></p>', ''],
    ['whitespace only', '  \n\t ', ''],
    ['empty paragraphs only', '<p> </p><p></p>', ''],
    ['excess spaces and blank lines in HTML', '<p>Too    many   spaces</p>\n\n   <p>  next  </p>', 'Too many spaces\n\nnext'],
    ['excess spaces and blank lines in plain text', 'Line one.   \n\n\n\nLine  two.', 'Line one.\n\nLine two.'],
    ['non-breaking spaces', '<p>a&nbsp;&nbsp;b</p>', 'a b'],
  ])('%s', (_label, input, expected) => {
    expect(() => richTextToPlainText(input)).not.toThrow();
    expect(richTextToPlainText(input)).toBe(expected);
  });

  it('leaves existing plain-text descriptions unchanged', () => {
    for (const text of ['Ownership moves the value.', 'Ownership moves the value.\nBorrowing lends it.', 'Step one.\n\nStep two.']) {
      expect(richTextToPlainText(text)).toBe(text);
    }
  });

  it('is idempotent on its own output', () => {
    for (const input of [
      '<h2>Scaling</h2><ol><li><p>Measure &amp; plan</p></li><li><p>Scale</p></li></ol>',
      '<p>Generics &lt;T&gt; in Rust</p><p>x &lt; y</p>',
      'Vec<T> & Map<K, V>',
    ]) {
      const once = richTextToPlainText(input);
      expect(richTextToPlainText(once)).toBe(once);
    }
  });
});

describe('stripExecutableMarkup (titles)', () => {
  it.each([
    'Fire & Smoke',
    'Generics <T> in Rust',
    'Vec<T> & Map<K, V>',
    'x < y > z',
    'The <b> tag',
    'AT&amp;T',
    'List<Object>',
    'What is LOAD BALANCING? ⚖️',
    'Ownership [25 of 35] | Rust for Beginners',
  ])('keeps %j unchanged', (title) => {
    expect(stripExecutableMarkup(title)).toBe(title);
  });

  it.each([
    ['Intro <script>alert(1)</script>', 'Intro '],
    ['<img src=x onerror=alert(1)>Title', 'Title'],
    ['<a href="javascript:alert(1)">Title</a>', 'Title'],
    ['a <script>b', 'a b'],
  ])('removes executable markup from %j', (title, expected) => {
    expect(stripExecutableMarkup(title)).toBe(expected);
  });
});

// The frontend Lesson Builder loads stored plain text into the editor and, on an
// unchanged save, sends exactly the HTML below (asserted in EduCourse
// `e2e/lesson-builder.spec.ts`, fixtures in `e2e/fixtures/lessonDescriptions.ts`).
// Keep the two lists in sync: together they prove stored → editor → save → stored.
describe('Lesson Builder round trip (frontend contract)', () => {
  const pre = '<pre class="rounded-card bg-bg-sunken px-4 py-3 font-mono text-sm text-ink-primary">';
  const punctuation = `Really?! (Yes): 50% off; [x] {y} #tag @site ~ ^ * _ | \\ / \` ' " ... -- end.`;
  it.each([
    ['paragraphs', 'Inspect the scaffold before every shift.\n\nRecord defects in the site log.', '<p>Inspect the scaffold before every shift.</p><p>Record defects in the site log.</p>'],
    ['headings', 'Fall protection\n\nGuardrails are the first line of defence.\n\nHarnesses\n\nCheck the webbing for cuts before use.', '<p>Fall protection</p><p>Guardrails are the first line of defence.</p><p>Harnesses</p><p>Check the webbing for cuts before use.</p>'],
    ['bullet list', 'Check these:\n\nBase plates\nGuardrails\nToe boards', '<p>Check these:</p><p>Base plates<br>Guardrails<br>Toe boards</p>'],
    ['ordered list', 'Before climbing:\n\n1. Inspect the ladder\n2. Secure the top\n3. Keep three points of contact\n\nAfter the job:\n\n4. Lower the tools\n5. Sign the permit', '<p>Before climbing:</p><ol><li><p>Inspect the ladder</p></li><li><p>Secure the top</p></li><li><p>Keep three points of contact</p></li></ol><p>After the job:</p><ol start="4"><li><p>Lower the tools</p></li><li><p>Sign the permit</p></li></ol><p></p>'],
    ['inline formatting', 'Wear a hard hat in every zone marked Danger (code PPE-01); see the site rules.', '<p>Wear a hard hat in every zone marked Danger (code PPE-01); see the site rules.</p>'],
    ['notation', 'Generics: Vec<T> and Map<K, V>.\n\nCompare x < y and x > y.\n\nA & B, written &amp; in HTML.', '<p>Generics: Vec&lt;T&gt; and Map&lt;K, V&gt;.</p><p>Compare x &lt; y and x &gt; y.</p><p>A &amp; B, written &amp;amp; in HTML.</p>'],
    ['notation, edited', 'Generics: Vec<T> and Map<K, V>.\n\nCompare x < y and x > y. Always.\n\nA & B, written &amp; in HTML.', '<p>Generics: Vec&lt;T&gt; and Map&lt;K, V&gt;.</p><p>Compare x &lt; y and x &gt; y. Always.</p><p>A &amp; B, written &amp;amp; in HTML.</p>'],
    ['unicode and emoji', 'Café, naïve façade — “quoted” ✓ 🚧 日本語 ½ 21 °C', '<p>Café, naïve façade — “quoted” ✓ 🚧 日本語 ½ 21 °C</p>'],
    ['punctuation', punctuation, `<p>${punctuation}</p>`],
    ['indented code', 'Load check:\n\n  if (load > limit) {\n    stop();\n  }', `<p>Load check:</p>${pre}<code>  if (load &gt; limit) {\n    stop();\n  }</code></pre><p></p>`],
    ['markup typed as text', '<script>window.__pwned = 1</script>\n\n<img src=x onerror="window.__pwned = 1"> and <a href="javascript:window.__pwned = 1">a link</a>', '<p>&lt;script&gt;window.__pwned = 1&lt;/script&gt;</p><p>&lt;img src=x onerror="window.__pwned = 1"&gt; and &lt;a href="javascript:window.__pwned = 1"&gt;a link&lt;/a&gt;</p>'],
    ['mixed', 'Site induction\n\nEvery worker signs in & reads the plan.\n\n1. Check Map<Zone, Risk>\n2. Confirm x < limit\n\nHard hat\nHi-vis vest\n\nTemperature: 21 °C ✓ 🚧\n\n  report(zone, "ok");', `<p>Site induction</p><p>Every worker signs in &amp; reads the plan.</p><ol><li><p>Check Map&lt;Zone, Risk&gt;</p></li><li><p>Confirm x &lt; limit</p></li></ol><p>Hard hat<br>Hi-vis vest</p><p>Temperature: 21 °C ✓ 🚧</p>${pre}<code>  report(zone, "ok");</code></pre><p></p>`],
  ])('%s: the builder HTML is stored as the original text', (_name, stored, html) => {
    expect(richTextToPlainText(html)).toBe(stored);
  });
});
