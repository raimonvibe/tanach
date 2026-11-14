import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
    parseReadingContext,
    isVerseInReading,
    isChapterInReading,
    formatReadingRange,
    setReadingParams,
    withReadingLabel,
    cleanReadingLabel,
} from '../public/js/reading-range.js';

const params = (query) => new URLSearchParams(query);

// Parashat Noach: Genesis 6:9-11:32
const noach = parseReadingContext(params('start=6:9&end=11:32&reading=Parashat%20Noach'));

describe('parseReadingContext', () => {
    test('reads label and range from the URL', () => {
        assert.deepEqual(noach, {
            label: 'Parashat Noach',
            start: { chapter: 6, verse: 9 },
            end: { chapter: 11, verse: 32 },
        });
    });

    test('no reading parameters means no context', () => {
        assert.equal(parseReadingContext(params('book=bereshit&category=torah&chapter=1')), null);
        assert.equal(parseReadingContext(null), null);
    });

    test('a label without a range is still a context', () => {
        assert.deepEqual(parseReadingContext(params('reading=Haftarah')), {
            label: 'Haftarah',
            start: null,
            end: null,
        });
    });

    test('a range without a label is still a context', () => {
        const context = parseReadingContext(params('start=54:1&end=55:5'));
        assert.equal(context.label, '');
        assert.deepEqual(context.end, { chapter: 55, verse: 5 });
    });

    test('malformed, incomplete or reversed ranges are dropped', () => {
        assert.equal(parseReadingContext(params('start=abc&end=11:32')), null);
        assert.equal(parseReadingContext(params('start=6:9')), null);
        assert.equal(parseReadingContext(params('start=11:32&end=6:9')), null);
        assert.equal(parseReadingContext(params('start=0:0&end=1:1')), null);
        assert.equal(parseReadingContext(params('start=6:9&end=6:8')), null);
    });

    test('long or messy labels are trimmed', () => {
        assert.equal(cleanReadingLabel('  Parashat \n  Noach  '), 'Parashat Noach');
        assert.equal(cleanReadingLabel('x'.repeat(500)).length, 80);
        assert.equal(cleanReadingLabel(undefined), '');
    });
});

describe('isVerseInReading', () => {
    test('first and last verse are inside', () => {
        assert.equal(isVerseInReading(noach, 6, 9), true);
        assert.equal(isVerseInReading(noach, 11, 32), true);
    });

    test('verses before the start and after the end are outside', () => {
        assert.equal(isVerseInReading(noach, 6, 8), false);
        assert.equal(isVerseInReading(noach, 5, 30), false);
        assert.equal(isVerseInReading(noach, 12, 1), false);
    });

    test('every verse of a middle chapter is inside', () => {
        assert.equal(isVerseInReading(noach, 8, 1), true);
        assert.equal(isVerseInReading(noach, 8, 22), true);
    });

    test('a range within one chapter', () => {
        const context = parseReadingContext(params('start=7:40&end=7:50'));
        assert.equal(isVerseInReading(context, 7, 39), false);
        assert.equal(isVerseInReading(context, 7, 45), true);
        assert.equal(isVerseInReading(context, 7, 51), false);
        assert.equal(isVerseInReading(context, 8, 45), false);
    });

    test('no range means nothing is marked', () => {
        assert.equal(isVerseInReading(null, 1, 1), false);
        assert.equal(isVerseInReading({ label: 'Haftarah', start: null, end: null }, 1, 1), false);
        assert.equal(isVerseInReading(noach, 'x', 'y'), false);
    });

    test('accepts numbers given as strings', () => {
        assert.equal(isVerseInReading(noach, '7', '3'), true);
    });
});

describe('isChapterInReading', () => {
    test('covers start, middle and end chapters only', () => {
        assert.equal(isChapterInReading(noach, 5), false);
        assert.equal(isChapterInReading(noach, 6), true);
        assert.equal(isChapterInReading(noach, 9), true);
        assert.equal(isChapterInReading(noach, 11), true);
        assert.equal(isChapterInReading(noach, 12), false);
        assert.equal(isChapterInReading(null, 6), false);
    });
});

describe('formatReadingRange', () => {
    test('range across chapters', () => {
        assert.equal(formatReadingRange(noach), '6:9–11:32');
    });

    test('range inside one chapter', () => {
        assert.equal(formatReadingRange(parseReadingContext(params('start=7:40&end=7:50'))), '7:40–50');
    });

    test('single verse', () => {
        assert.equal(formatReadingRange(parseReadingContext(params('start=3:4&end=3:4'))), '3:4');
    });

    test('no range gives an empty string', () => {
        assert.equal(formatReadingRange(null), '');
        assert.equal(formatReadingRange({ label: 'x', start: null, end: null }), '');
    });
});

describe('URL round trip', () => {
    test('setReadingParams output parses back to the same context', () => {
        const query = setReadingParams(params('book=bereshit&category=torah&chapter=8'), noach);
        assert.equal(query.get('chapter'), '8');
        assert.deepEqual(parseReadingContext(params(query.toString())), noach);
    });

    test('no context leaves the parameters untouched', () => {
        assert.equal(setReadingParams(params('chapter=1'), null).toString(), 'chapter=1');
    });

    test('withReadingLabel appends an encoded label', () => {
        assert.equal(
            withReadingLabel('/reader.html?book=bereshit&chapter=6', 'Parashat Noach'),
            '/reader.html?book=bereshit&chapter=6&reading=Parashat%20Noach',
        );
        assert.equal(withReadingLabel('/reader.html', 'Haftarah'), '/reader.html?reading=Haftarah');
    });

    test('withReadingLabel encodes characters that could break out of an href', () => {
        const url = withReadingLabel('/reader.html?book=x', '"><script>alert(1)</script>');
        assert.equal(url.includes('"'), false);
        assert.equal(url.includes('<'), false);
        assert.equal(parseReadingContext(params(url.split('?')[1])).label, '"><script>alert(1)</script>');
    });

    test('withReadingLabel leaves the URL alone without a label', () => {
        assert.equal(withReadingLabel('/reader.html?book=x', ''), '/reader.html?book=x');
        assert.equal(withReadingLabel(null, 'Haftarah'), null);
    });
});
