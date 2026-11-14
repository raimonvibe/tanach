import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
    SITE_START_YEAR,
    SOCIAL_LINKS,
    copyrightYears,
    iconSvg,
    socialIconsMarkup,
} from '../public/js/site-footer.js';

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const PAGES = ['index', 'reader', 'calendar', 'readings', 'mishnah', 'rambam', 'talmud', 'contact', 'privacy'];

describe('copyright years', () => {
    test('just the start year in the first year', () => {
        assert.equal(copyrightYears(2024, new Date(2024, 5, 1)), '2024');
    });

    test('a range once the year has moved on', () => {
        assert.equal(copyrightYears(2024, new Date(2026, 10, 14)), '2024–2026');
        assert.equal(copyrightYears(2024, new Date(2031, 0, 1)), '2024–2031');
    });

    test('a wrong clock never shows a year before the start', () => {
        assert.equal(copyrightYears(2024, new Date(2019, 0, 1)), '2024');
    });

    test('the site started in 2024', () => {
        assert.equal(SITE_START_YEAR, 2024);
    });
});

describe('social icons', () => {
    test('all nine links, each with an icon', () => {
        assert.deepEqual(
            SOCIAL_LINKS.map((l) => l.label),
            ['Website', 'X', 'YouTube', 'TikTok', 'Instagram', 'Medium', 'GitHub', 'LinkedIn', 'Facebook'],
        );
        for (const { icon } of SOCIAL_LINKS) {
            assert.match(iconSvg(icon), /^<svg viewBox="0 0 \d+ 512"/, icon);
        }
    });

    test('every link opens safely in a new tab and has an accessible name', () => {
        const html = socialIconsMarkup();
        assert.equal((html.match(/<li>/g) || []).length, SOCIAL_LINKS.length);
        assert.equal((html.match(/target="_blank" rel="noopener noreferrer"/g) || []).length, SOCIAL_LINKS.length);
        for (const { href, label } of SOCIAL_LINKS) {
            assert.ok(html.includes(`href="${href}"`), href);
            assert.ok(html.includes(`aria-label="${label}"`), label);
            assert.match(href, /^https:\/\//);
        }
    });

    test('icons are decorative for screen readers', () => {
        assert.equal((socialIconsMarkup().match(/aria-hidden="true"/g) || []).length, SOCIAL_LINKS.length);
    });

    test('Instagram gets its gradient, TikTok its cyan and magenta copies', () => {
        assert.match(iconSvg('instagram'), /<linearGradient id="ig-gradient"/);
        assert.match(iconSvg('instagram'), /fill="url\(#ig-gradient\)"/);
        assert.equal((iconSvg('instagram').match(/<stop /g) || []).length, 9);
        assert.match(iconSvg('tiktok'), /class="tiktok-cyan"/);
        assert.match(iconSvg('tiktok'), /class="tiktok-magenta"/);
    });

    test('a second footer on a page gets its own gradient id', () => {
        assert.match(socialIconsMarkup('-1'), /id="ig-gradient-1"/);
        assert.match(socialIconsMarkup('-1'), /url\(#ig-gradient-1\)/);
    });

    test('unknown icon names render nothing', () => {
        assert.equal(iconSvg('myspace'), '');
    });
});

describe('every page', () => {
    for (const page of PAGES) {
        const html = readFileSync(path.join(PUBLIC_DIR, `${page}.html`), 'utf8');

        test(`${page}: footer with years and social icons`, () => {
            assert.equal((html.match(/data-site-footer/g) || []).length, 1);
            assert.match(html, /<span data-copyright-years>2024<\/span>/);
            assert.match(html, /<ul class="social-icons" data-social-icons/);
            assert.match(html, /<script type="module" src="\/js\/site-footer\.js"><\/script>/);
            assert.doesNotMatch(html, /copyrightYear|&copy; 2024 Tanach/);
        });

        test(`${page}: has a meta description`, () => {
            assert.match(html, /<meta name="description" content="[^"]{40,}">/);
        });

        test(`${page}: body is in a page family for the shared styles`, () => {
            assert.match(html, /<body class="page-(gradient|light)">/);
        });
    }
});

describe('book index', () => {
    const index = JSON.parse(readFileSync(path.join(PUBLIC_DIR, 'data/books/index.json'), 'utf8'));

    test('lists all 39 books of the Tanach once', () => {
        assert.equal(index.length, 39);
        assert.equal(new Set(index.map((b) => b.id)).size, 39);
    });

    test('matches the book files (name and chapter count)', () => {
        for (const entry of index) {
            const book = JSON.parse(
                readFileSync(path.join(PUBLIC_DIR, 'data/books', entry.category, `${entry.id}.json`), 'utf8'),
            );
            assert.equal(entry.name, book.name, entry.id);
            assert.equal(entry.chapters, book.chapters.length, entry.id);
        }
    });
});

describe('reader book dropdown', () => {
    const css = readFileSync(path.join(PUBLIC_DIR, 'css/theme.css'), 'utf8');

    test('options get readable colours instead of the white header text', () => {
        assert.match(css, /\.book-selector option,\s*\.book-selector optgroup \{\s*color: var\(--color-text, #333\);\s*background-color: var\(--color-surface, #fff\);/);
    });
});
