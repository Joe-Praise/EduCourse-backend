import { Parser } from 'htmlparser2';

/**
 * Plain-text handling for lesson fields.
 *
 * Lesson descriptions are stored as readable plain text. The lesson builder
 * sends TipTap HTML and API clients may send plain text, so the input is read
 * as an HTML fragment: markup is removed, block elements become line breaks,
 * entities are decoded exactly once, and angle-bracket text that is not markup
 * (`Vec<T>`, `Map<K, V>`, `x < y`) is kept verbatim. No tag, attribute or
 * script content from the input reaches the output, which must be rendered as
 * text, never as HTML.
 */

type Attribs = Record<string, string>;

interface Tag {
  name: string; // as written
  lower: string;
  attribs: Attribs;
  start: number;
  end: number;
  complete: boolean; // reached its closing `>`
  markup: boolean;
}

type Token =
  | { kind: 'text'; text: string }
  | { kind: 'open'; tag: Tag }
  | { kind: 'close'; tag: Tag; start: number; end: number };

const names = (list: string) => new Set(list.split(' '));

/** Standard and obsolete HTML element names. */
const HTML_ELEMENTS = names(
  'a abbr acronym address applet area article aside audio b base basefont bdi bdo bgsound big blink ' +
    'blockquote body br button canvas caption center cite code col colgroup data datalist dd del details ' +
    'dfn dialog dir div dl dt em embed fieldset figcaption figure font footer form frame frameset h1 h2 h3 ' +
    'h4 h5 h6 head header hgroup hr html i iframe image img input ins kbd keygen label legend li link ' +
    'listing main map mark marquee math menu menuitem meta meter nav nobr noembed noframes noscript object ' +
    'ol optgroup option output p param picture plaintext pre progress q rb rp rt rtc ruby s samp script ' +
    'search section select slot small source span strike strong style sub summary sup svg table tbody td ' +
    'template textarea tfoot th thead time title tr track tt u ul var video wbr xmp',
);
/** Markup in any letter case: their content is code. */
const ACTIVE = names('script style');
/** Dropped together with their content: code, or never displayed. */
const HIDDEN = names('script style template noscript iframe noembed noframes title head');
/** Embedding elements, removed from titles. */
const EMBEDDING = names('iframe frame frameset object embed applet');

const PARAGRAPH = names(
  'address article aside blockquote body caption center details dialog div dl fieldset figcaption figure ' +
    'footer form h1 h2 h3 h4 h5 h6 header hgroup hr html legend listing main nav p plaintext pre search ' +
    'section summary table tbody tfoot thead xmp',
);
const LINE = names('dd dt tr');
const CELL = names('td th');
const LIST = names('ol ul menu dir');

const ATTRIBUTE_NAME = /^[A-Za-z_:][-\w:.]*$/;

function isExecutableAttribute(name: string, value: string): boolean {
  const lower = name.toLowerCase();
  if (lower.startsWith('on') || lower === 'srcdoc' || lower === 'formaction') return true;
  // Browsers ignore whitespace and control characters inside a URL scheme.
  const compact = [...value].filter((c) => c.charCodeAt(0) > 0x20).join('');
  return /^(?:javascript|vbscript|data):/i.test(compact);
}

/**
 * Real markup, as opposed to angle-bracket text such as `<T>` or `<K, V>`.
 * Editors serialize HTML in lowercase; uppercase names count as markup only
 * when they carry attributes, so `Option<A>` and `List<Object>` survive.
 */
function isMarkup(name: string, attribs: Attribs): boolean {
  const lower = name.toLowerCase();
  const attrs = Object.entries(attribs);
  if (ACTIVE.has(lower) || attrs.some(([n, v]) => isExecutableAttribute(n, v))) return true;
  if (!HTML_ELEMENTS.has(lower)) return false;
  if (attrs.some(([n]) => !ATTRIBUTE_NAME.test(n))) return false; // code such as `a<b && c>d`
  return name === lower || attrs.length > 0;
}

function isExecutable(tag: Tag): boolean {
  return (
    ACTIVE.has(tag.lower) ||
    Object.entries(tag.attribs).some(([n, v]) => isExecutableAttribute(n, v)) ||
    (EMBEDDING.has(tag.lower) && (tag.name === tag.lower || Object.keys(tag.attribs).length > 0))
  );
}

/** Decodes entities in text that contains no markup. */
function decodeEntities(text: string): string {
  let out = '';
  const parser = new Parser({ ontext: (t) => (out += t) });
  parser.end(text.replace(/</g, '&lt;'));
  return out;
}

interface Scan {
  tokens: Token[];
  markup: boolean;
  /** A script/style-like element left open at the end of input. */
  unterminated?: Tag;
}

function scan(src: string): Scan {
  const tokens: Token[] = [];
  const open: Tag[] = [];
  let markup = false;
  let cursor = 0;
  let ending = false;
  let unterminated: Tag | undefined;

  const text = (t: string) => {
    if (t) tokens.push({ kind: 'text', text: t });
  };

  // htmlparser2 drops stray end tags, a repeated <form> and an unterminated
  // tag at the end of input without emitting anything; recover that source.
  const recover = (to: number) => {
    const gap = src.slice(cursor, to);
    cursor = Math.max(cursor, to);
    if (!gap) return;
    const tag = /^<\/?([^\s/>]+)[^>]*>$/.exec(gap);
    if (!tag) text(decodeEntities(gap));
    else if (HTML_ELEMENTS.has(tag[1].toLowerCase())) markup = true;
    else text(gap);
  };
  const advance = (start: number, end: number) => {
    if (start > cursor) recover(start);
    cursor = Math.max(cursor, end + 1);
  };

  const parser = new Parser(
    {
      ontext(t) {
        advance(parser.startIndex, parser.endIndex);
        text(t);
      },
      onopentagname(name) {
        open.push({ name, lower: name.toLowerCase(), attribs: {}, start: -1, end: -1, complete: false, markup: false });
      },
      onopentag(name, attribs, isImplied) {
        const tag = open[open.length - 1];
        if (!tag || tag.name !== name || tag.complete) return;
        tag.attribs = attribs;
        tag.complete = true;
        tag.markup = isMarkup(name, attribs);
        if (!isImplied) {
          tag.start = parser.startIndex;
          tag.end = parser.endIndex;
          advance(tag.start, tag.end);
        }
        if (tag.markup) {
          markup = true;
          tokens.push({ kind: 'open', tag });
        } else if (!isImplied) {
          text(src.slice(tag.start, tag.end + 1));
        }
      },
      onclosetag(name, isImplied) {
        if (ending) recover(src.length);
        const index = open.map((t) => t.name).lastIndexOf(name);
        if (index < 0) return;
        const [tag] = open.splice(index);
        const start = isImplied ? -1 : parser.startIndex;
        const end = isImplied ? -1 : parser.endIndex;
        if (!isImplied) advance(start, end);
        if (!tag.complete) return; // cut off by the end of input; recovered as text
        if (tag.markup) {
          if (ending && HIDDEN.has(tag.lower)) unterminated ??= tag;
          tokens.push({ kind: 'close', tag, start, end });
        } else if (!isImplied) {
          text(src.slice(start, end + 1));
        }
      },
      oncomment() {
        advance(parser.startIndex, parser.endIndex);
        markup = true;
      },
      onprocessinginstruction() {
        advance(parser.startIndex, parser.endIndex);
        markup = true;
      },
    },
    { lowerCaseTags: false, lowerCaseAttributeNames: false, decodeEntities: true },
  );
  parser.write(src);
  ending = true;
  parser.end();
  recover(src.length);
  return { tokens, markup, unterminated };
}

/** Input without any markup keeps its own line breaks. */
function renderPlain(tokens: Token[]): string {
  return tokens
    .map((t) => (t.kind === 'text' ? t.text : ''))
    .join('')
    .replace(/\r\n?/g, '\n')
    .replace(/\xa0/g, ' ')
    .split('\n')
    .map((line) => line.replace(/(\S)[ \t]{2,}/g, '$1 ').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** HTML input: whitespace collapses as in a browser; blocks become line breaks. */
function renderHtml(tokens: Token[]): string {
  let out = '';
  let pending = 0; // line breaks owed before the next text
  let hidden = 0;
  let pre = 0;
  let items = 0;
  let itemStart = false; // inside a list item that has no text yet
  let prefix = ''; // "3. " for the next ordered-list item
  const lists: { ordered: boolean; next: number }[] = [];

  const lineBreak = (n: number) => {
    if (items > 0) {
      if (itemStart) return;
      n = Math.min(n, 1);
    }
    pending = Math.max(pending, n);
  };

  const write = (raw: string) => {
    let text = pre > 0 ? raw.replace(/\xa0/g, ' ') : raw.replace(/\s+/g, ' ');
    if (pre === 0 && (pending > 0 || out === '' || /[\n ]$/.test(out))) text = text.trimStart();
    if (!text) return;
    if (pending > 0 && out) out = out.replace(/[ \t]+$/, '') + '\n'.repeat(pending);
    pending = 0;
    out += prefix + text;
    prefix = '';
    itemStart = false;
  };

  for (const token of tokens) {
    if (token.kind === 'text') {
      if (hidden === 0) write(token.text);
      continue;
    }
    const name = token.tag.lower;
    const opening = token.kind === 'open';
    if (HIDDEN.has(name)) {
      hidden = Math.max(0, hidden + (opening ? 1 : -1));
      continue;
    }
    if (hidden > 0) continue;

    if (name === 'br') {
      if (opening && out) pending = Math.min(pending + 1, 2);
    } else if (CELL.has(name)) {
      if (opening && pending === 0 && out && !/[\n ]$/.test(out)) out += ' ';
    } else if (name === 'li') {
      if (opening) {
        lineBreak(1);
        items += 1;
        itemStart = true;
        const list = lists[lists.length - 1];
        prefix = list?.ordered ? `${list.next++}. ` : '';
      } else {
        items = Math.max(0, items - 1);
        itemStart = false;
        lineBreak(1);
      }
    } else if (LIST.has(name)) {
      if (opening) {
        lineBreak(2);
        const start = Number.parseInt(token.tag.attribs.start ?? '', 10);
        lists.push({ ordered: name === 'ol', next: Number.isNaN(start) ? 1 : start });
      } else {
        lists.pop();
        lineBreak(2);
      }
    } else if (PARAGRAPH.has(name)) {
      if (name === 'pre') pre = Math.max(0, pre + (opening ? 1 : -1));
      lineBreak(2);
    } else if (LINE.has(name)) {
      lineBreak(1);
    }
  }
  return out.trim();
}

/**
 * Converts lesson-builder HTML (or plain text) to readable plain text:
 * paragraphs and headings are separated by a blank line, list items by a line
 * break (ordered items keep their numbers), and literal notation survives.
 */
export function richTextToPlainText(input: string): string {
  let src = input;
  for (;;) {
    const { tokens, markup, unterminated } = scan(src);
    if (!unterminated) return markup ? renderHtml(tokens) : renderPlain(tokens);
    // An unclosed <script> would swallow the rest as code: drop the stray tag and read on.
    src = src.slice(0, unterminated.start) + src.slice(unterminated.end + 1);
  }
}

/**
 * Titles are plain text, not rich text. Every character is kept except
 * executable markup (script/style elements, embedding elements, tags with
 * event-handler or script-URL attributes). Anything else is returned unchanged.
 */
export function stripExecutableMarkup(input: string): string {
  const { tokens } = scan(input);
  const cuts: [number, number][] = [];
  const openActive = new Map<Tag, number>();
  for (const token of tokens) {
    if (token.kind === 'text' || !isExecutable(token.tag)) continue;
    const { tag } = token;
    if (token.kind === 'open') {
      if (tag.start < 0) continue;
      if (ACTIVE.has(tag.lower)) openActive.set(tag, tag.start);
      else cuts.push([tag.start, tag.end]);
    } else if (openActive.has(tag)) {
      // A closed script/style goes with its content; an unclosed one loses only its tag.
      cuts.push(token.start < 0 ? [tag.start, tag.end] : [tag.start, token.end]);
      openActive.delete(tag);
    } else if (token.start >= 0) {
      cuts.push([token.start, token.end]);
    }
  }
  if (cuts.length === 0) return input;
  cuts.sort((a, b) => a[0] - b[0]);
  let out = '';
  let from = 0;
  for (const [start, end] of cuts) {
    if (start > from) out += input.slice(from, start);
    from = Math.max(from, end + 1);
  }
  return out + input.slice(from);
}
