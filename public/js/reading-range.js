/**
 * Reading context: the verse range a scheduled reading covers (for example
 * Parashat Noach = Genesis 6:9-11:32), carried in the reader URL so the reader
 * can show which reading you came from and mark its verses.
 *
 * URL parameters:
 *   start=6:9      first chapter:verse of the reading
 *   end=11:32      last chapter:verse of the reading
 *   reading=...    display label, e.g. "Parashat Noach"
 */

const MAX_LABEL_LENGTH = 80;

function parsePoint(value) {
    if (typeof value !== 'string') return null;
    const match = value.trim().match(/^(\d+):(\d+)$/);
    if (!match) return null;
    const chapter = parseInt(match[1], 10);
    const verse = parseInt(match[2], 10);
    if (chapter < 1 || verse < 1) return null;
    return { chapter, verse };
}

function isBefore(a, b) {
    return a.chapter < b.chapter || (a.chapter === b.chapter && a.verse < b.verse);
}

/**
 * Trim a label taken from the URL. It is always rendered as text, never HTML.
 */
export function cleanReadingLabel(label) {
    if (typeof label !== 'string') return '';
    return label.replace(/\s+/g, ' ').trim().slice(0, MAX_LABEL_LENGTH);
}

/**
 * Read the reading context from URL parameters.
 * @param {URLSearchParams} params
 * @returns {{label: string, start: {chapter:number, verse:number}|null, end: {chapter:number, verse:number}|null}|null}
 */
export function parseReadingContext(params) {
    if (!params) return null;

    const label = cleanReadingLabel(params.get('reading') || '');
    let start = parsePoint(params.get('start') || '');
    let end = parsePoint(params.get('end') || '');

    // A range needs both ends, in order.
    if (!start || !end || isBefore(end, start)) {
        start = null;
        end = null;
    }

    if (!label && !start) return null;
    return { label, start, end };
}

/**
 * Is this verse part of the reading?
 */
export function isVerseInReading(context, chapter, verse) {
    if (!context || !context.start || !context.end) return false;
    const point = { chapter: Number(chapter), verse: Number(verse) };
    if (!Number.isFinite(point.chapter) || !Number.isFinite(point.verse)) return false;
    return !isBefore(point, context.start) && !isBefore(context.end, point);
}

/**
 * Is any part of this chapter inside the reading?
 */
export function isChapterInReading(context, chapter) {
    if (!context || !context.start || !context.end) return false;
    const num = Number(chapter);
    return num >= context.start.chapter && num <= context.end.chapter;
}

/**
 * "6:9–11:32", or "54:1–10" when the range stays inside one chapter.
 */
export function formatReadingRange(context) {
    if (!context || !context.start || !context.end) return '';
    const { start, end } = context;
    if (start.chapter === end.chapter) {
        return start.verse === end.verse
            ? `${start.chapter}:${start.verse}`
            : `${start.chapter}:${start.verse}–${end.verse}`;
    }
    return `${start.chapter}:${start.verse}–${end.chapter}:${end.verse}`;
}

/**
 * Add reading-context parameters to a URLSearchParams (mutates and returns it).
 */
export function setReadingParams(params, context) {
    if (!context) return params;
    if (context.start && context.end) {
        params.set('start', `${context.start.chapter}:${context.start.verse}`);
        params.set('end', `${context.end.chapter}:${context.end.verse}`);
    }
    const label = cleanReadingLabel(context.label || '');
    if (label) params.set('reading', label);
    return params;
}

/**
 * Add a reading label to an internal reader URL, e.g. "&reading=Parashat%20Noach".
 */
export function withReadingLabel(url, label) {
    const clean = cleanReadingLabel(label || '');
    if (!url || !clean) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}reading=${encodeURIComponent(clean)}`;
}
