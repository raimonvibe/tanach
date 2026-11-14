/**
 * Page title, description, canonical URL and social-sharing tags for the reader.
 *
 * The reader is one page (reader.html?book=…&chapter=…), so these tags are set
 * in the browser for each chapter. Search engines that run JavaScript (Google)
 * see the per-chapter values; link previews (WhatsApp, Facebook, X) read the
 * HTML without running scripts and get the defaults in reader.html.
 */

export const SITE_NAME = 'Tanach Reader';
export const SITE_ORIGIN = 'https://tanach.vercel.app';
export const DEFAULT_IMAGE = `${SITE_ORIGIN}/jewish-bible.png`;

export const DEFAULT_READER_META = Object.freeze({
    title: 'Read the Tanach in Hebrew and English - Tanach Reader',
    description:
        'Read all 24 books of the Tanach (Hebrew Bible) chapter by chapter, in Hebrew, English or side by side.',
    url: `${SITE_ORIGIN}/reader.html`,
});

const DESCRIPTION_MAX = 155;

/**
 * Verse HTML from Sefaria to plain text: footnotes removed, tags stripped,
 * common entities decoded, whitespace collapsed.
 */
export function plainText(html) {
    if (!html) return '';
    return String(html)
        .replace(/<sup class="footnote-marker">[\s\S]*?<\/sup>/gi, '')
        .replace(/<i class="footnote">[\s\S]*?<\/i>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&thinsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Shorten to `max` characters on a word boundary, adding an ellipsis.
 */
export function truncate(text, max = DESCRIPTION_MAX) {
    const clean = (text || '').trim();
    if (clean.length <= max) return clean;
    const cut = clean.slice(0, max - 1);
    const lastSpace = cut.lastIndexOf(' ');
    const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
    return `${base.replace(/[\s,;:.—–-]+$/, '')}…`;
}

/**
 * Canonical reader URL for a chapter (no verse or reading parameters, so every
 * link into the same chapter counts as one page).
 */
export function chapterUrl(bookId, category, chapter, origin = SITE_ORIGIN) {
    const params = new URLSearchParams({ book: bookId, category, chapter: String(chapter) });
    return `${origin}/reader.html?${params.toString()}`;
}

/**
 * Title, description and URL for one chapter.
 * @param {{book: {id:string, name:string, chapters?:Array}, category:string, chapter:number, verses?:Array}} input
 */
export function buildChapterMeta({ book, category, chapter, verses = [], origin = SITE_ORIGIN }) {
    if (!book || !book.id || !book.name || !chapter) {
        return { ...DEFAULT_READER_META };
    }

    const reference = `${book.name} ${chapter}`;
    const opening = plainText(verses[0]?.translations?.english || verses[0]?.english || '');
    const intro = `Read ${book.name} chapter ${chapter} in Hebrew and English.`;
    const description = opening ? truncate(`${intro} “${opening}`, DESCRIPTION_MAX - 1) : intro;
    // Close the quote unless truncation already ended the text with an ellipsis inside it
    const finalDescription = opening && !description.endsWith('…') ? `${description}”` : description;

    return {
        title: `${reference} - ${SITE_NAME}`,
        description: finalDescription,
        url: chapterUrl(book.id, category, chapter, origin),
    };
}

/**
 * Find or create a <meta>/<link> in <head>.
 */
function upsert(doc, selector, create) {
    let el = doc.head.querySelector(selector);
    if (!el) {
        el = create();
        doc.head.appendChild(el);
    }
    return el;
}

function setMeta(doc, attr, key, content) {
    const el = upsert(doc, `meta[${attr}="${key}"]`, () => {
        const meta = doc.createElement('meta');
        meta.setAttribute(attr, key);
        return meta;
    });
    el.setAttribute('content', content);
}

/**
 * Write title, description, canonical, Open Graph and Twitter tags.
 */
export function applyMeta(meta, doc = globalThis.document) {
    if (!doc || !doc.head || !meta) return;
    doc.title = meta.title;

    setMeta(doc, 'name', 'description', meta.description);
    setMeta(doc, 'property', 'og:title', meta.title);
    setMeta(doc, 'property', 'og:description', meta.description);
    setMeta(doc, 'property', 'og:url', meta.url);
    setMeta(doc, 'name', 'twitter:title', meta.title);
    setMeta(doc, 'name', 'twitter:description', meta.description);

    const canonical = upsert(doc, 'link[rel="canonical"]', () => {
        const link = doc.createElement('link');
        link.setAttribute('rel', 'canonical');
        return link;
    });
    canonical.setAttribute('href', meta.url);
}
