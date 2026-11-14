/**
 * Reader preferences and "continue where you left off" storage.
 *
 * Every function takes an optional `storage` (a localStorage-like object) so the
 * logic can be tested without a browser. Storage failures never throw: the
 * reader must keep working in private windows or with storage blocked.
 */

export const PREFS_KEY = 'tanach-reader-prefs';
export const LAST_POSITION_KEY = 'tanach-reader-last-position';

export const VIEW_MODES = ['hebrew', 'english', 'both'];

export const FONT_SCALE_MIN = 0.8;
export const FONT_SCALE_MAX = 1.8;
export const FONT_SCALE_STEP = 0.1;

export const DEFAULT_PREFS = Object.freeze({
    viewMode: 'both',
    fontScale: 1,
    showVerseNumbers: false,
});

const VALID_CATEGORIES = ['torah', 'neviim', 'trei_asara', 'ketuvim'];
const BOOK_ID_PATTERN = /^[a-z0-9_]+$/;

function defaultStorage() {
    try {
        return globalThis.localStorage || null;
    } catch {
        return null;
    }
}

function readJson(key, storage) {
    if (!storage) return null;
    try {
        const raw = storage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function writeJson(key, value, storage) {
    if (!storage) return false;
    try {
        storage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

/**
 * Round to one decimal and clamp to the allowed range.
 */
export function clampFontScale(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return DEFAULT_PREFS.fontScale;
    const rounded = Math.round(num * 10) / 10;
    return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, rounded));
}

/**
 * Step the font scale up (direction > 0) or down (direction < 0).
 */
export function stepFontScale(current, direction) {
    const delta = direction > 0 ? FONT_SCALE_STEP : -FONT_SCALE_STEP;
    return clampFontScale(clampFontScale(current) + delta);
}

/**
 * Turn anything (stored JSON, partial object, garbage) into valid preferences.
 */
export function normalizePrefs(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    return {
        viewMode: VIEW_MODES.includes(source.viewMode) ? source.viewMode : DEFAULT_PREFS.viewMode,
        fontScale:
            source.fontScale === undefined ? DEFAULT_PREFS.fontScale : clampFontScale(source.fontScale),
        showVerseNumbers:
            typeof source.showVerseNumbers === 'boolean'
                ? source.showVerseNumbers
                : DEFAULT_PREFS.showVerseNumbers,
    };
}

export function loadPrefs(storage = defaultStorage()) {
    return normalizePrefs(readJson(PREFS_KEY, storage));
}

/**
 * Save preferences; returns the normalized preferences that were stored.
 */
export function savePrefs(prefs, storage = defaultStorage()) {
    const normalized = normalizePrefs(prefs);
    writeJson(PREFS_KEY, normalized, storage);
    return normalized;
}

/**
 * Validate a stored reading position. Returns null when it cannot be trusted.
 */
export function normalizePosition(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const { bookId, category, bookName } = raw;
    const chapter = Number(raw.chapter);
    if (typeof bookId !== 'string' || !BOOK_ID_PATTERN.test(bookId)) return null;
    if (!VALID_CATEGORIES.includes(category)) return null;
    if (!Number.isInteger(chapter) || chapter < 1) return null;
    return {
        bookId,
        category,
        chapter,
        bookName: typeof bookName === 'string' && bookName.trim() ? bookName.trim().slice(0, 80) : bookId,
        savedAt: Number.isFinite(Number(raw.savedAt)) ? Number(raw.savedAt) : 0,
    };
}

export function saveLastPosition(position, storage = defaultStorage(), now = Date.now()) {
    const normalized = normalizePosition({ ...position, savedAt: now });
    if (!normalized) return null;
    writeJson(LAST_POSITION_KEY, normalized, storage);
    return normalized;
}

export function loadLastPosition(storage = defaultStorage()) {
    return normalizePosition(readJson(LAST_POSITION_KEY, storage));
}

export function clearLastPosition(storage = defaultStorage()) {
    if (!storage) return;
    try {
        storage.removeItem(LAST_POSITION_KEY);
    } catch {
        /* ignore */
    }
}

/**
 * Reader URL for a stored position.
 */
export function positionUrl(position) {
    const pos = normalizePosition(position);
    if (!pos) return null;
    return `/reader.html?book=${encodeURIComponent(pos.bookId)}&category=${encodeURIComponent(pos.category)}&chapter=${pos.chapter}`;
}

/**
 * Human label for a stored position, e.g. "Genesis, chapter 12".
 */
export function positionLabel(position) {
    const pos = normalizePosition(position);
    if (!pos) return '';
    return `${pos.bookName}, chapter ${pos.chapter}`;
}
