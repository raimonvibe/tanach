import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
    DEFAULT_READER_META,
    plainText,
    truncate,
    chapterUrl,
    buildChapterMeta,
    applyMeta,
} from '../public/js/chapter-meta.js';

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const genesis = JSON.parse(readFileSync(path.join(PUBLIC_DIR, 'data/books/torah/bereshit.json'), 'utf8'));

describe('plainText', () => {
    test('drops Sefaria footnotes and tags', () => {
        const html =
            'When God began to create<sup class="footnote-marker">*</sup><i class="footnote"><b>When God began to create </b>Others “In the beginning God created.”</i> heaven and earth—';
        assert.equal(plainText(html), 'When God began to create heaven and earth—');
    });

    test('decodes entities and collapses whitespace', () => {
        assert.equal(plainText('Moses &amp; Aaron&nbsp;&nbsp; <b>said</b>\n  &quot;go&quot;'), 'Moses & Aaron said "go"');
    });

    test('empty input gives an empty string', () => {
        assert.equal(plainText(''), '');
        assert.equal(plainText(undefined), '');
    });
});

describe('truncate', () => {
    test('short text is untouched', () => {
        assert.equal(truncate('Short text', 20), 'Short text');
    });

    test('long text is cut on a word boundary with an ellipsis', () => {
        const out = truncate('one two three four five six seven eight nine ten', 20);
        assert.ok(out.length <= 20, out);
        assert.ok(out.endsWith('…'));
        assert.equal(out, 'one two three four…');
    });
});

describe('buildChapterMeta', () => {
    test('Genesis 1 from the real data', () => {
        const meta = buildChapterMeta({
            book: genesis,
            category: 'torah',
            chapter: 1,
            verses: genesis.chapters[0].verses,
        });
        assert.equal(meta.title, 'Genesis 1 - Tanach Reader');
        assert.equal(
            meta.description,
            'Read Genesis chapter 1 in Hebrew and English. “When God began to create heaven and earth—”',
        );
        assert.equal(meta.url, 'https://tanach.vercel.app/reader.html?book=bereshit&category=torah&chapter=1');
    });

    test('long opening verses keep the description under 155 characters', () => {
        for (const chapter of genesis.chapters) {
            const meta = buildChapterMeta({
                book: genesis,
                category: 'torah',
                chapter: chapter.chapter,
                verses: chapter.verses,
            });
            assert.ok(meta.description.length <= 155, `${chapter.chapter}: ${meta.description.length}`);
            assert.ok(meta.description.startsWith(`Read Genesis chapter ${chapter.chapter} `));
            assert.doesNotMatch(meta.description, /<|footnote/);
        }
    });

    test('without verses the description is the plain intro', () => {
        const meta = buildChapterMeta({ book: { id: 'rut', name: 'Ruth' }, category: 'ketuvim', chapter: 2 });
        assert.equal(meta.description, 'Read Ruth chapter 2 in Hebrew and English.');
    });

    test('missing book falls back to the reader defaults', () => {
        assert.deepEqual(buildChapterMeta({ book: null, chapter: 1 }), { ...DEFAULT_READER_META });
    });

    test('canonical URL drops verse and reading parameters and uses the given origin', () => {
        assert.equal(
            chapterUrl('shir_hashirim', 'ketuvim', 3, 'http://localhost:3000'),
            'http://localhost:3000/reader.html?book=shir_hashirim&category=ketuvim&chapter=3',
        );
    });
});

/** Just enough of a DOM <head> to run applyMeta in Node. */
function fakeDocument() {
    const head = {
        children: [],
        appendChild(el) {
            this.children.push(el);
            return el;
        },
        querySelector(selector) {
            const m = /^(meta|link)\[(\w+)="([^"]+)"\]$/.exec(selector);
            return this.children.find((el) => el.tag === m[1] && el.attrs[m[2]] === m[3]) || null;
        },
    };
    return {
        title: '',
        head,
        createElement: (tag) => ({
            tag,
            attrs: {},
            setAttribute(k, v) {
                this.attrs[k] = String(v);
            },
        }),
    };
}

describe('applyMeta', () => {
    test('sets title, description, canonical, Open Graph and Twitter tags', () => {
        const doc = fakeDocument();
        const meta = { title: 'Ruth 1 - Tanach Reader', description: 'Read Ruth 1', url: 'https://x.test/r?c=1' };
        applyMeta(meta, doc);

        const get = (tag, attr, key, value = 'content') =>
            doc.head.children.find((el) => el.tag === tag && el.attrs[attr] === key)?.attrs[value];

        assert.equal(doc.title, 'Ruth 1 - Tanach Reader');
        assert.equal(get('meta', 'name', 'description'), 'Read Ruth 1');
        assert.equal(get('meta', 'property', 'og:title'), 'Ruth 1 - Tanach Reader');
        assert.equal(get('meta', 'property', 'og:description'), 'Read Ruth 1');
        assert.equal(get('meta', 'property', 'og:url'), 'https://x.test/r?c=1');
        assert.equal(get('meta', 'name', 'twitter:title'), 'Ruth 1 - Tanach Reader');
        assert.equal(get('link', 'rel', 'canonical', 'href'), 'https://x.test/r?c=1');
    });

    test('updates existing tags instead of adding duplicates', () => {
        const doc = fakeDocument();
        applyMeta({ title: 'A', description: 'a', url: 'https://x.test/1' }, doc);
        const count = doc.head.children.length;
        applyMeta({ title: 'B', description: 'b', url: 'https://x.test/2' }, doc);
        assert.equal(doc.head.children.length, count);
        assert.equal(doc.title, 'B');
    });

    test('does nothing without a document', () => {
        assert.doesNotThrow(() => applyMeta({ title: 'x' }, null));
    });
});
