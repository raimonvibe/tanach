/**
 * Cross-links from the reading schedule into the reader.
 *
 * These run against the real book data in public/data, so a link is only
 * accepted here if the chapter and verses actually exist.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
    generateReaderLink,
    parseReference,
    getBookInfo,
    getParashatInfo,
} from '../public/js/book-mapping-service.js';
import {
    getTorahLink,
    getHaftarahLink,
    getTanakhLink,
    getReadingLink,
    firstReference,
} from '../public/js/readings-link-service.js';
import { getWeeklyInfo } from '../public/js/hebcal-service.js';
import { parseReadingContext } from '../public/js/reading-range.js';

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const deps = { generateReaderLink, getBookInfo, getParashatInfo };

const originalFetch = globalThis.fetch;
const originalWarn = console.warn;
const originalError = console.error;
const originalLog = console.log;

before(() => {
    // The site loads books with fetch('/data/books/...'); serve them from disk.
    globalThis.fetch = async (url) => {
        try {
            const body = await readFile(path.join(PUBLIC_DIR, String(url)), 'utf8');
            return { ok: true, status: 200, json: async () => JSON.parse(body) };
        } catch {
            return { ok: false, status: 404, json: async () => ({}) };
        }
    };
    // The services log every rejected reference; keep the test output readable.
    console.warn = () => {};
    console.error = () => {};
    console.log = () => {};
});

after(() => {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
    console.error = originalError;
    console.log = originalLog;
});

/** Pull the href out of the generated <a> tag. */
function hrefOf(html) {
    const match = /href="([^"]+)"/.exec(html || '');
    return match ? match[1] : null;
}

function queryOf(html) {
    const href = hrefOf(html);
    return href ? new URLSearchParams(href.split('?')[1]) : null;
}

describe('generateReaderLink', () => {
    test('single verse', async () => {
        assert.equal(
            await generateReaderLink('Genesis 1:1'),
            '/reader.html?book=bereshit&category=torah&chapter=1&verse=1',
        );
    });

    test('range inside one chapter carries start and end', async () => {
        assert.equal(
            await generateReaderLink('I Kings 7:40-50'),
            '/reader.html?book=melachim1&category=neviim&chapter=7&verse=40&start=7:40&end=7:50',
        );
    });

    test('range across chapters where the end verse is past the start chapter', async () => {
        // Genesis 6 has 22 verses; the end verse (32) belongs to chapter 11.
        assert.equal(
            await generateReaderLink('Genesis 6:9-11:32'),
            '/reader.html?book=bereshit&category=torah&chapter=6&verse=9&start=6:9&end=11:32',
        );
    });

    test('range across chapters where the end verse number is lower than the start', async () => {
        // Toldot: 28:9 comes after 25:19 even though 9 < 19.
        assert.equal(
            await generateReaderLink('Genesis 25:19-28:9'),
            '/reader.html?book=bereshit&category=torah&chapter=25&verse=19&start=25:19&end=28:9',
        );
    });

    test('rejects chapters and verses that do not exist', async () => {
        assert.equal(await generateReaderLink('Genesis 51:1'), null);
        assert.equal(await generateReaderLink('Genesis 1:99'), null);
        assert.equal(await generateReaderLink('Genesis 1:5-99'), null);
        assert.equal(await generateReaderLink('Genesis 49:1-51:3'), null);
    });

    test('rejects reversed ranges and unknown books', async () => {
        assert.equal(await generateReaderLink('Genesis 1:9-3'), null);
        assert.equal(await generateReaderLink('Genesis 5:1-4:2'), null);
        assert.equal(await generateReaderLink('Narnia 1:1'), null);
        assert.equal(await generateReaderLink(''), null);
    });

    test('parseReference reports the end chapter of a cross-chapter range', () => {
        assert.deepEqual(parseReference('Judges 4:4-5:31'), {
            book: 'Judges',
            chapter: 4,
            verseStart: 4,
            verseEnd: 31,
            chapterEnd: 5,
        });
    });
});

describe('weekly Torah portion link', () => {
    test('uses the exact verse range and names the portion', async () => {
        const html = await getTorahLink(
            'Parashat Noach',
            generateReaderLink,
            getParashatInfo,
            getBookInfo,
            '',
            { torahReference: 'Genesis 6:9-11:32' },
        );
        const query = queryOf(html);
        assert.equal(query.get('book'), 'bereshit');
        assert.equal(query.get('category'), 'torah');
        assert.equal(query.get('chapter'), '6');
        assert.equal(query.get('verse'), '9');
        assert.deepEqual(parseReadingContext(query), {
            label: 'Parashat Noach',
            start: { chapter: 6, verse: 9 },
            end: { chapter: 11, verse: 32 },
        });
        assert.match(html, /class="reading-link"/);
    });

    test('a combined reading links to its first part', async () => {
        const html = await getTorahLink(
            'Parashat Miketz',
            generateReaderLink,
            getParashatInfo,
            getBookInfo,
            '',
            { torahReference: 'Genesis 41:1-44:17; Numbers 7:54-8:4' },
        );
        const query = queryOf(html);
        assert.equal(query.get('book'), 'bereshit');
        assert.equal(query.get('start'), '41:1');
        assert.equal(query.get('end'), '44:17');
    });

    test('without a verse range it still links to the portion chapter', async () => {
        const html = await getTorahLink('Parashat Noach', generateReaderLink, getParashatInfo, getBookInfo);
        const query = queryOf(html);
        assert.equal(query.get('book'), 'bereshit');
        assert.equal(query.get('chapter'), '6');
        assert.equal(query.get('reading'), 'Parashat Noach');
    });

    test('no portion means no link', async () => {
        assert.equal(await getTorahLink('N/A', generateReaderLink, getParashatInfo, getBookInfo), '');
        assert.equal(await getTorahLink('', generateReaderLink, getParashatInfo, getBookInfo), '');
    });

    test('an unknown portion falls back to Sefaria', async () => {
        const html = await getTorahLink(
            'Parashat Unknown',
            generateReaderLink,
            getParashatInfo,
            getBookInfo,
            'Genesis.1.1',
        );
        assert.match(hrefOf(html), /^https:\/\/www\.sefaria\.org\//);
    });
});

describe('Haftarah link', () => {
    test('links into the reader with range and label', async () => {
        const html = await getHaftarahLink('Isaiah 54:1-55:5', '', generateReaderLink, 'Haftarah for Parashat Noach');
        const query = queryOf(html);
        assert.equal(query.get('book'), 'yeshayahu');
        assert.equal(query.get('category'), 'neviim');
        assert.equal(query.get('chapter'), '54');
        assert.deepEqual(parseReadingContext(query), {
            label: 'Haftarah for Parashat Noach',
            start: { chapter: 54, verse: 1 },
            end: { chapter: 55, verse: 5 },
        });
    });

    test('the label defaults to "Haftarah"', async () => {
        const html = await getHaftarahLink('Malachi 1:1-2:7', '', generateReaderLink);
        assert.equal(queryOf(html).get('reading'), 'Haftarah');
        assert.equal(queryOf(html).get('book'), 'malachi');
    });

    test('a two-part Haftarah links to its first part', async () => {
        const html = await getHaftarahLink('Hosea 12:13-14:10; Micah 7:18-20', '', generateReaderLink);
        const query = queryOf(html);
        assert.equal(query.get('book'), 'hoshea');
        assert.equal(query.get('start'), '12:13');
    });

    test('falls back to the Sefaria URL when the text cannot be read', async () => {
        const html = await getTanakhLink('Weekly portion', 'Judges.4.4-5.31', generateReaderLink, 'Haftarah');
        const query = queryOf(html);
        assert.equal(query.get('book'), 'shoftim');
        assert.equal(query.get('chapter'), '4');
        assert.equal(query.get('verse'), '4');
    });

    test('no Haftarah means no link', async () => {
        assert.equal(await getHaftarahLink('N/A', '', generateReaderLink), '');
    });
});

describe('daily schedule items', () => {
    test('a Tanakh item links into the reader and carries its title', async () => {
        const html = await getReadingLink(
            {
                title: { en: 'Tanakh Yomi' },
                displayValue: { en: 'Joshua 3:1-17' },
                url: 'Joshua.3.1-17',
                category: 'Tanakh',
            },
            deps,
        );
        const query = queryOf(html);
        assert.equal(query.get('book'), 'yehoshua');
        assert.equal(query.get('chapter'), '3');
        assert.equal(query.get('reading'), 'Tanakh Yomi');
    });

    test('firstReference splits combined references', () => {
        assert.equal(firstReference('Genesis 41:1-44:17; Numbers 7:54-8:4'), 'Genesis 41:1-44:17');
        assert.equal(firstReference('Exodus 35:1-38:20, 30:11-16'), 'Exodus 35:1-38:20');
        assert.equal(firstReference('Genesis 1:1'), 'Genesis 1:1');
        assert.equal(firstReference(null), '');
    });
});

describe('weekly info from the Hebrew calendar', () => {
    test('gives the portion, its verse range and the Haftarah', () => {
        // Wednesday 14 October 2026; the following Shabbat reads Noach.
        const info = getWeeklyInfo(new Date(2026, 9, 14, 12));
        assert.equal(info.parashat, 'Parashat Noach');
        assert.equal(info.torah, 'Genesis 6:9-11:32');
        assert.equal(info.haftarah, 'Isaiah 54:1-55:5');
    });

    test('the calendar output turns into working reader links', async () => {
        const info = getWeeklyInfo(new Date(2026, 10, 11, 12)); // week of Toldot
        assert.equal(info.parashat, 'Parashat Toldot');

        const torah = queryOf(
            await getTorahLink(info.parashat, generateReaderLink, getParashatInfo, getBookInfo, '', {
                torahReference: info.torah,
            }),
        );
        assert.equal(torah.get('book'), 'bereshit');
        assert.equal(torah.get('start'), '25:19');
        assert.equal(torah.get('end'), '28:9');

        const haftarah = queryOf(await getHaftarahLink(info.haftarah, '', generateReaderLink));
        assert.equal(haftarah.get('book'), 'malachi');
        assert.equal(haftarah.get('start'), '1:1');
        assert.equal(haftarah.get('end'), '2:7');
    });
});
