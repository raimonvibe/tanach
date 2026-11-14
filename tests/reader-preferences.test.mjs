import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
    PREFS_KEY,
    LAST_POSITION_KEY,
    DEFAULT_PREFS,
    FONT_SCALE_MIN,
    FONT_SCALE_MAX,
    clampFontScale,
    stepFontScale,
    normalizePrefs,
    loadPrefs,
    savePrefs,
    normalizePosition,
    saveLastPosition,
    loadLastPosition,
    clearLastPosition,
    positionUrl,
    positionLabel,
} from '../public/js/reader-preferences.js';

/** Minimal in-memory stand-in for localStorage. */
function memoryStorage(initial = {}) {
    const data = new Map(Object.entries(initial));
    return {
        getItem: (key) => (data.has(key) ? data.get(key) : null),
        setItem: (key, value) => data.set(key, String(value)),
        removeItem: (key) => data.delete(key),
        data,
    };
}

/** Storage that throws on every call, like a blocked or full localStorage. */
const brokenStorage = {
    getItem() {
        throw new Error('blocked');
    },
    setItem() {
        throw new Error('quota exceeded');
    },
    removeItem() {
        throw new Error('blocked');
    },
};

describe('reading preferences', () => {
    test('defaults: side by side, normal size, no verse numbers', () => {
        assert.deepEqual(loadPrefs(memoryStorage()), {
            viewMode: 'both',
            fontScale: 1,
            showVerseNumbers: false,
        });
    });

    test('saved preferences are read back', () => {
        const storage = memoryStorage();
        savePrefs({ viewMode: 'hebrew', fontScale: 1.3, showVerseNumbers: true }, storage);
        assert.deepEqual(loadPrefs(storage), {
            viewMode: 'hebrew',
            fontScale: 1.3,
            showVerseNumbers: true,
        });
    });

    test('each view mode is accepted', () => {
        for (const viewMode of ['hebrew', 'english', 'both']) {
            assert.equal(normalizePrefs({ viewMode }).viewMode, viewMode);
        }
    });

    test('invalid stored values fall back to defaults', () => {
        assert.deepEqual(
            normalizePrefs({ viewMode: 'klingon', fontScale: 'huge', showVerseNumbers: 'yes' }),
            { ...DEFAULT_PREFS },
        );
        assert.deepEqual(normalizePrefs(null), { ...DEFAULT_PREFS });
        assert.deepEqual(normalizePrefs('nonsense'), { ...DEFAULT_PREFS });
    });

    test('corrupt JSON in storage falls back to defaults', () => {
        const storage = memoryStorage({ [PREFS_KEY]: '{not json' });
        assert.deepEqual(loadPrefs(storage), { ...DEFAULT_PREFS });
    });

    test('blocked storage never throws', () => {
        assert.deepEqual(loadPrefs(brokenStorage), { ...DEFAULT_PREFS });
        assert.deepEqual(savePrefs({ viewMode: 'english' }, brokenStorage), {
            ...DEFAULT_PREFS,
            viewMode: 'english',
        });
        assert.deepEqual(loadPrefs(null), { ...DEFAULT_PREFS });
    });

    test('savePrefs stores the normalized value', () => {
        const storage = memoryStorage();
        savePrefs({ viewMode: 'english', fontScale: 99 }, storage);
        assert.deepEqual(JSON.parse(storage.data.get(PREFS_KEY)), {
            viewMode: 'english',
            fontScale: FONT_SCALE_MAX,
            showVerseNumbers: false,
        });
    });
});

describe('font size', () => {
    test('clamps to the allowed range', () => {
        assert.equal(clampFontScale(0.1), FONT_SCALE_MIN);
        assert.equal(clampFontScale(5), FONT_SCALE_MAX);
        assert.equal(clampFontScale(1.2), 1.2);
        assert.equal(clampFontScale(NaN), 1);
    });

    test('steps up and down by one tenth without float drift', () => {
        assert.equal(stepFontScale(1, 1), 1.1);
        assert.equal(stepFontScale(1, -1), 0.9);
        let scale = 1;
        for (let i = 0; i < 3; i++) scale = stepFontScale(scale, 1);
        assert.equal(scale, 1.3);
    });

    test('stops at the limits', () => {
        assert.equal(stepFontScale(FONT_SCALE_MAX, 1), FONT_SCALE_MAX);
        assert.equal(stepFontScale(FONT_SCALE_MIN, -1), FONT_SCALE_MIN);
    });
});

describe('continue where you left off', () => {
    const position = { bookId: 'bereshit', category: 'torah', chapter: 12, bookName: 'Genesis' };

    test('nothing stored means nothing to resume', () => {
        assert.equal(loadLastPosition(memoryStorage()), null);
    });

    test('the last position is saved and read back', () => {
        const storage = memoryStorage();
        saveLastPosition(position, storage, 1700000000000);
        assert.deepEqual(loadLastPosition(storage), { ...position, savedAt: 1700000000000 });
    });

    test('a later chapter replaces the earlier one', () => {
        const storage = memoryStorage();
        saveLastPosition(position, storage);
        saveLastPosition({ ...position, chapter: 13 }, storage);
        assert.equal(loadLastPosition(storage).chapter, 13);
    });

    test('builds the reader link and label', () => {
        assert.equal(positionUrl(position), '/reader.html?book=bereshit&category=torah&chapter=12');
        assert.equal(positionLabel(position), 'Genesis, chapter 12');
    });

    test('rejects tampered or incomplete positions', () => {
        assert.equal(normalizePosition({ ...position, bookId: '../../etc' }), null);
        assert.equal(normalizePosition({ ...position, bookId: '"><script>' }), null);
        assert.equal(normalizePosition({ ...position, category: 'talmud' }), null);
        assert.equal(normalizePosition({ ...position, chapter: 0 }), null);
        assert.equal(normalizePosition({ ...position, chapter: 'abc' }), null);
        assert.equal(normalizePosition(null), null);
        assert.equal(positionUrl({ bookId: 'x y', category: 'torah', chapter: 1 }), null);
        assert.equal(positionLabel(null), '');
    });

    test('an invalid position is not saved', () => {
        const storage = memoryStorage();
        assert.equal(saveLastPosition({ ...position, chapter: -3 }, storage), null);
        assert.equal(storage.data.has(LAST_POSITION_KEY), false);
    });

    test('falls back to the book id when the name is missing', () => {
        assert.equal(normalizePosition({ ...position, bookName: '' }).bookName, 'bereshit');
    });

    test('clearing removes the stored position', () => {
        const storage = memoryStorage();
        saveLastPosition(position, storage);
        clearLastPosition(storage);
        assert.equal(loadLastPosition(storage), null);
    });

    test('blocked storage never throws', () => {
        assert.equal(loadLastPosition(brokenStorage), null);
        assert.doesNotThrow(() => saveLastPosition(position, brokenStorage));
        assert.doesNotThrow(() => clearLastPosition(brokenStorage));
    });
});
