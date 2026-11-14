/**
 * Tanach Reader - Navigation without page reloads
 * Uses history.pushState() to update URL without reloading
 */

import { getBook, getAllBooks, getChapter } from './books-service.js';
import {
    VIEW_MODES,
    FONT_SCALE_MIN,
    FONT_SCALE_MAX,
    DEFAULT_PREFS,
    loadPrefs,
    savePrefs,
    stepFontScale,
    saveLastPosition,
    loadLastPosition,
    positionUrl,
    positionLabel,
} from './reader-preferences.js';
import {
    parseReadingContext,
    isVerseInReading,
    formatReadingRange,
    setReadingParams,
} from './reading-range.js';
import { buildChapterMeta, applyMeta, DEFAULT_READER_META } from './chapter-meta.js';

const CATEGORY_META = {
    torah: {
        optgroup: 'Torah',
        name: 'Torah (The Five Books of Moses)',
        description: 'The first five books of the Tanach',
    },
    neviim: {
        optgroup: 'Nevi\'im',
        name: 'Nevi\'im (The Prophets)',
        description: 'The historical and prophetic books',
    },
    trei_asara: {
        optgroup: 'Trei Asar',
        name: 'Trei Asar (The Twelve Minor Prophets)',
        description: 'The twelve minor prophets',
    },
    ketuvim: {
        optgroup: 'Ketuvim',
        name: 'Ketuvim (The Writings)',
        description: 'Wisdom, poetry, and historical books',
    },
};

const CATEGORY_ORDER = ['torah', 'neviim', 'trei_asara', 'ketuvim'];

// Global state
let currentBook = null;
let currentChapter = 1;
let currentCategory = null;
let allBooks = [];
// Reading preferences (view mode, font size, verse numbers) — remembered between visits
let prefs = loadPrefs();
let showVerseNumbers = prefs.showVerseNumbers;
// Scheduled reading we were opened from (e.g. Parashat Noach), if any
let readingContext = null;

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Initialize the reader on page load
 */
async function init() {
    try {
        console.log('[Reader] ===== INIT START =====');
        console.log('[Reader] init() called');
        console.log('[Reader] Current URL:', window.location.href);
        console.log('[Reader] Document ready state:', document.readyState);
        
        // Wait a bit to ensure DOM is fully ready
        if (document.readyState === 'loading') {
            console.log('[Reader] Waiting for DOM to be ready...');
            await new Promise(resolve => {
                if (document.readyState === 'complete') {
                    resolve();
                } else {
                    document.addEventListener('DOMContentLoaded', resolve);
                }
            });
        }
        
        applyFontScale();
        syncVerseNumbersButton();
        setupPreferenceControls();

        const params = new URLSearchParams(window.location.search);
        const book = params.get('book');
        const category = params.get('category');
        const chapter = params.get('chapter');
        const verse = parseInt(params.get('verse'), 10) || null;

        console.log('[Reader] URL parameters:', { book, category, chapter, verse });

        if (book && category) {
            readingContext = parseReadingContext(params);
            currentChapter = parseInt(chapter, 10) || 1;
            // 'replace': opening a link must not add a second history entry,
            // otherwise the Back button returns to this same page.
            await loadBook(book, category, { history: 'replace', verse });
            if (verse) scrollToVerse(verse);
        } else {
            console.log('[Reader] No book/category in URL, loading book catalog');
            await showBookCatalog({ updateHistory: false });
        }

        setupCatalogNavigation();
        
        console.log('[Reader] ===== INIT COMPLETED =====');
    } catch (error) {
        console.error('[Reader] ===== INIT ERROR =====', error);
        console.error('[Reader] Error stack:', error.stack);
        const bookInfo = document.getElementById('bookInfo');
        if (bookInfo) {
            bookInfo.innerHTML = `<div class="error">Error initializing: ${error.message}</div>`;
        }
    }

    // Handle browser back/forward buttons
    window.addEventListener('popstate', async (event) => {
        const params = new URLSearchParams(window.location.search);
        const book = params.get('book');
        const category = params.get('category');
        const chapter = params.get('chapter');

        if (book && category) {
            readingContext = parseReadingContext(params);
            currentChapter = parseInt(chapter, 10) || 1;
            await loadBook(book, category, { history: 'none' });
        } else {
            await showBookCatalog({ updateHistory: false });
        }
    });
}

function setupCatalogNavigation() {
    const bookInfo = document.getElementById('bookInfo');
    if (!bookInfo || bookInfo.dataset.catalogNavBound) return;
    bookInfo.dataset.catalogNavBound = '1';
    bookInfo.addEventListener('click', (event) => {
        const link = event.target.closest('[data-book-id][data-book-category]');
        if (!link) return;
        event.preventDefault();
        const chapter = parseInt(link.dataset.bookChapter, 10) || 1;
        navigateToBook(link.dataset.bookId, link.dataset.bookCategory, chapter);
    });
}

function syncBookSelector() {
    const selector = document.getElementById('bookSelector');
    if (!selector) return;
    if (currentBook && currentCategory) {
        selector.value = `${currentBook.id}|${currentCategory}`;
    } else {
        selector.value = '';
    }
}

/**
 * "Continue where you left off" card, or '' when there is nothing to resume.
 */
function renderContinueReadingHtml(books) {
    const position = loadLastPosition();
    if (!position) return '';

    const book = books.find((b) => b.id === position.bookId && b.category === position.category);
    if (!book || position.chapter > book.chapters.length) return '';

    const target = { ...position, bookName: book.name };
    return `
        <a class="continue-reading" href="${positionUrl(target)}"
           data-book-id="${escapeHtml(book.id)}"
           data-book-category="${escapeHtml(book.category)}"
           data-book-chapter="${target.chapter}">
            <span class="continue-reading-label">Continue where you left off</span>
            <span class="continue-reading-target">${escapeHtml(positionLabel(target))} →</span>
        </a>
    `;
}

function renderBookCatalogHtml(books) {
    const grouped = Object.fromEntries(
        CATEGORY_ORDER.map((key) => [key, books.filter((book) => book.category === key)]),
    );

    let html = `
        ${renderContinueReadingHtml(books)}
        <p class="book-catalog-intro">Choose a book below or use the dropdown above.</p>
        <div class="book-catalog">
    `;

    for (const categoryKey of CATEGORY_ORDER) {
        const categoryBooks = grouped[categoryKey];
        if (!categoryBooks.length) continue;
        const meta = CATEGORY_META[categoryKey];
        html += `
            <div class="category">
                <h3>${meta.name}</h3>
                <p>${meta.description}</p>
                <ul class="books-list">
                    ${categoryBooks
                        .map(
                            (book) => `
                        <li>
                            <a href="/reader.html?book=${encodeURIComponent(book.id)}&category=${encodeURIComponent(categoryKey)}"
                               data-book-id="${book.id}"
                               data-book-category="${categoryKey}">
                                ${book.name} (${book.chapters.length} chapters)
                            </a>
                        </li>
                    `,
                        )
                        .join('')}
                </ul>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

async function populateBookSelector() {
    allBooks = await getAllBooks();
    const selector = document.getElementById('bookSelector');
    if (!selector) return;

    selector.innerHTML = '<option value="">Select a book...</option>';

    for (const categoryKey of CATEGORY_ORDER) {
        const categoryBooks = allBooks.filter((book) => book.category === categoryKey);
        if (!categoryBooks.length) continue;

        const optgroup = document.createElement('optgroup');
        optgroup.label = CATEGORY_META[categoryKey].optgroup;
        categoryBooks.forEach((book) => {
            const option = document.createElement('option');
            option.value = `${book.id}|${categoryKey}`;
            option.textContent = book.name;
            optgroup.appendChild(option);
        });
        selector.appendChild(optgroup);
    }
}

async function showBookCatalog(options = {}) {
    const { updateHistory = true } = options;

    window.dispatchEvent(new Event('read-aloud-stop'));
    currentBook = null;
    currentCategory = null;
    currentChapter = 1;
    readingContext = null;
    renderReadingBanner();
    applyMeta(DEFAULT_READER_META);

    const bookTitleEl = document.getElementById('bookTitle');
    const bookInfoEl = document.getElementById('bookInfo');
    const chapterNav = document.getElementById('chapterNav');
    const contentArea = document.getElementById('contentArea');

    if (bookTitleEl) bookTitleEl.textContent = 'Tanach Reader';
    if (chapterNav) chapterNav.style.display = 'none';
    if (contentArea) contentArea.style.display = 'none';

    if (bookInfoEl) {
        bookInfoEl.innerHTML = '<div class="loading">Loading books...</div>';
    }

    try {
        await populateBookSelector();
        syncBookSelector();
        if (bookInfoEl) {
            bookInfoEl.innerHTML = renderBookCatalogHtml(allBooks);
        }
        if (updateHistory && window.location.search) {
            window.history.pushState({}, '', window.location.pathname);
        }
    } catch (error) {
        console.error('[Reader] Error loading book catalog:', error);
        if (bookInfoEl) {
            bookInfoEl.innerHTML = `<div class="error">Could not load books: ${error.message}</div>`;
        }
    }
}

/**
 * @deprecated Use showBookCatalog() — kept as alias for clarity in older call sites.
 */
async function loadBookSelector() {
    await showBookCatalog({ updateHistory: false });
}

async function navigateToBook(bookId, category, chapter = 1) {
    readingContext = null;
    currentChapter = chapter;
    await loadBook(bookId, category);
    syncBookSelector();
}

/**
 * Load a specific book
 */
async function loadBook(bookId, category, options = {}) {
    console.log('[Reader] loadBook() called with:', bookId, category);
    try {
        console.log('[Reader] Fetching book data...');
        currentBook = await getBook(category, bookId);
        currentCategory = category;
        console.log('[Reader] Book loaded:', currentBook);

        const bookTitleEl = document.getElementById('bookTitle');
        const bookInfoEl = document.getElementById('bookInfo');
        
        if (!bookTitleEl) {
            console.error('[Reader] bookTitle element not found!');
            return;
        }
        if (!bookInfoEl) {
            console.error('[Reader] bookInfo element not found!');
            return;
        }

        bookTitleEl.textContent = currentBook.name;
        bookInfoEl.innerHTML = `
            <div class="book-title">${currentBook.name}</div>
            <div class="book-meta">
                ${currentBook.description || ''} • ${currentBook.chapters.length} chapters
            </div>
        `;

        // Create chapter buttons
        const chapterButtons = document.getElementById('chapterButtons');
        if (!chapterButtons) {
            console.error('[Reader] chapterButtons element not found!');
            return;
        }
        
        chapterButtons.innerHTML = '';
        console.log('[Reader] Creating', currentBook.chapters.length, 'chapter buttons');
        for (let i = 1; i <= currentBook.chapters.length; i++) {
            const button = document.createElement('button');
            button.className = 'chapter-btn';
            button.textContent = i;
            button.onclick = () => navigateToChapter(i);
            chapterButtons.appendChild(button);
        }

        const chapterNav = document.getElementById('chapterNav');
        const contentArea = document.getElementById('contentArea');
        if (chapterNav) {
            chapterNav.style.display = 'block';
        }
        if (contentArea) {
            contentArea.style.display = 'block';
        }

        syncBookSelector();

        // Load chapter - either from URL or first chapter
        if (currentChapter && currentChapter >= 1 && currentChapter <= currentBook.chapters.length) {
            console.log('[Reader] Loading chapter from URL or previous selection:', currentChapter);
            await loadChapter(currentChapter, options);
        } else {
            currentChapter = 1;
            console.log('[Reader] Loading first chapter automatically');
            await loadChapter(1, { ...options, verse: null });
        }
        console.log('[Reader] loadBook() completed successfully');
    } catch (error) {
        console.error('[Reader] Error in loadBook():', error);
        const bookInfoEl = document.getElementById('bookInfo');
        if (bookInfoEl) {
            bookInfoEl.innerHTML = `
                <div class="error">Could not load book: ${error.message}</div>
            `;
        }
    }
}

/**
 * Load a specific chapter
 */
async function loadChapter(chapterNum, options = {}) {
    const { history = 'push', verse = null } = options;
    window.dispatchEvent(new Event('read-aloud-stop'));
    if (!currentBook) return;

    try {
        const chapterData = await getChapter(currentCategory, currentBook.id, chapterNum);
        currentChapter = chapterNum;

        // Update active chapter button
        document.querySelectorAll('.chapter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.textContent) === chapterNum) {
                btn.classList.add('active');
            }
        });

        // Update navigation buttons
        const prevBtn = document.getElementById('prevChapter');
        const nextBtn = document.getElementById('nextChapter');
        if (prevBtn) prevBtn.disabled = chapterNum <= 1;
        if (nextBtn) nextBtn.disabled = chapterNum >= currentBook.chapters.length;

        // Render verses
        console.log('[Reader] About to render verses...');
        console.log('[Reader] Chapter data:', chapterData);
        console.log('[Reader] Chapter.verses:', chapterData.chapter?.verses);
        console.log('[Reader] Verse count:', chapterData.chapter?.verses?.length || 0);
        
        if (chapterData.chapter && chapterData.chapter.verses && chapterData.chapter.verses.length > 0) {
            console.log('[Reader] Calling renderVerses() with', chapterData.chapter.verses.length, 'verses');
            renderVerses(chapterData.chapter.verses);
            renderReadingBanner();
            // Per-chapter title, description and share tags ("Genesis 1 - Tanach Reader")
            applyMeta(
                buildChapterMeta({
                    book: currentBook,
                    category: currentCategory,
                    chapter: chapterNum,
                    verses: chapterData.chapter.verses,
                    origin: window.location.origin,
                }),
            );
            // Remember this spot for "Continue where you left off"
            saveLastPosition({
                bookId: currentBook.id,
                category: currentCategory,
                chapter: chapterNum,
                bookName: currentBook.name,
            });
        } else {
            console.error('[Reader] No verses found in chapter data!');
            console.error('[Reader] Chapter data structure:', JSON.stringify(chapterData, null, 2));
            const tabContent = document.getElementById('tabContent');
            if (tabContent) {
                tabContent.innerHTML = '<div class="error">No verses found in this chapter. See console for debug info.</div>';
            }
        }

        // Update URL without reloading
        if (history !== 'none') {
            updateURL(chapterNum, { mode: history, verse });
        }
        console.log('[Reader] loadChapter() completed successfully');
    } catch (error) {
        console.error('[Reader] Error loading chapter:', error);
        const tabContent = document.getElementById('tabContent');
        if (tabContent) {
            tabContent.innerHTML = `<div class="error">Error loading chapter: ${error.message}</div>`;
        }
    }
}

/**
 * Render verses in all three tabs
 */
function renderVerses(verses) {
    console.log('[Reader] renderVerses() called with', verses ? verses.length : 0, 'verses');
    
    // Get or create tab content divs
    const tabContent = document.getElementById('tabContent');
    if (!tabContent) {
        console.error('[Reader] tabContent element not found!');
        return;
    }
    
    let hebrewVerses = document.getElementById('hebrew-content');
    let englishVerses = document.getElementById('english-content');
    let bothVerses = document.getElementById('both-content');
    
    // Create tab content divs if they don't exist
    if (!hebrewVerses) {
        hebrewVerses = document.createElement('div');
        hebrewVerses.id = 'hebrew-content';
        hebrewVerses.className = 'tab-content';
        tabContent.appendChild(hebrewVerses);
    }
    
    if (!englishVerses) {
        englishVerses = document.createElement('div');
        englishVerses.id = 'english-content';
        englishVerses.className = 'tab-content';
        tabContent.appendChild(englishVerses);
    }
    
    if (!bothVerses) {
        bothVerses = document.createElement('div');
        bothVerses.id = 'both-content';
        bothVerses.className = 'tab-content';
        tabContent.appendChild(bothVerses);
    }

    // Clear existing content
    hebrewVerses.innerHTML = '';
    englishVerses.innerHTML = '';
    bothVerses.innerHTML = '';
    
    if (!verses || verses.length === 0) {
        console.warn('[Reader] No verses to render');
        hebrewVerses.innerHTML = '<div class="loading">No verses found</div>';
        englishVerses.innerHTML = '<div class="loading">No verses found</div>';
        bothVerses.innerHTML = '<div class="loading">No verses found</div>';
        return;
    }
    
    verses.forEach((verse) => {
        const verseNumberClass = showVerseNumbers ? '' : 'hidden';
        const inReading = isVerseInReading(readingContext, currentChapter, verse.verse);
        const verseClass = inReading ? 'verse verse-in-reading' : 'verse';
        const hebrew = verse.translations?.hebrew || verse.hebrew || '';
        const english = verse.translations?.english || verse.english || '';

        // Hebrew tab
        const hebrewDiv = document.createElement('div');
        hebrewDiv.className = verseClass;
        hebrewDiv.setAttribute('data-verse', verse.verse);
        hebrewDiv.innerHTML = `
            <span class="verse-number ${verseNumberClass}">${verse.verse}</span>
            <span class="hebrew-text">${hebrew}</span>
        `;
        hebrewVerses.appendChild(hebrewDiv);

        // English tab
        const englishDiv = document.createElement('div');
        englishDiv.className = verseClass;
        englishDiv.setAttribute('data-verse', verse.verse);
        englishDiv.innerHTML = `
            <span class="verse-number ${verseNumberClass}">${verse.verse}</span>
            <span class="english-text">${english}</span>
        `;
        englishVerses.appendChild(englishDiv);

        // Side-by-side tab: Hebrew and English next to each other on wide screens,
        // stacked on narrow ones (see .verse-pair in reader.html)
        const bothDiv = document.createElement('div');
        bothDiv.className = `${verseClass} verse-pair`;
        bothDiv.setAttribute('data-verse', verse.verse);
        bothDiv.innerHTML = `
            <div class="verse-pair-hebrew">
                <span class="verse-number ${verseNumberClass}">${verse.verse}</span>
                <span class="hebrew-text">${hebrew}</span>
            </div>
            <div class="verse-pair-english">
                <span class="english-text">${english}</span>
            </div>
        `;
        bothVerses.appendChild(bothDiv);
    });

    const tabContentContainer = document.getElementById('tabContent');
    if (tabContentContainer) {
        tabContentContainer.style.display = 'block';
        tabContentContainer.style.visibility = 'visible';
    }

    // Show the view the reader chose last time (Hebrew, English or side by side)
    switchTab(prefs.viewMode);

    window.dispatchEvent(new CustomEvent('read-aloud-content-updated'));

    console.log('[Reader] renderVerses() completed, rendered', verses.length, 'verses');
}

/**
 * Scroll to a verse in the visible tab and highlight it
 */
function scrollToVerse(verse) {
    const verseNum = parseInt(verse, 10);
    if (!verseNum) return;
    setTimeout(() => {
        document.querySelectorAll('.verse-highlight').forEach((el) => el.classList.remove('verse-highlight'));
        document.querySelectorAll(`.tab-content [data-verse="${verseNum}"]`).forEach((el) => {
            el.classList.add('verse-highlight');
        });
        const visible = document.querySelector(`.tab-content.active [data-verse="${verseNum}"]`);
        if (visible) {
            visible.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            console.warn('[Reader] Verse element not found:', verseNum);
        }
    }, 300);
}

/**
 * Banner shown when the reader was opened from the reading schedule
 */
function renderReadingBanner() {
    const banner = document.getElementById('readingBanner');
    if (!banner) return;

    if (!readingContext || !currentBook) {
        banner.hidden = true;
        banner.textContent = '';
        return;
    }

    banner.textContent = '';

    const info = document.createElement('div');
    info.className = 'reading-banner-info';

    const label = document.createElement('strong');
    label.textContent = readingContext.label || 'Scheduled reading';
    info.appendChild(label);

    const range = formatReadingRange(readingContext);
    if (range) {
        const rangeEl = document.createElement('span');
        rangeEl.className = 'reading-banner-range';
        rangeEl.textContent = `${currentBook.name} ${range}`;
        info.appendChild(rangeEl);
    }

    const actions = document.createElement('div');
    actions.className = 'reading-banner-actions';

    const start = readingContext.start;
    if (start && currentChapter !== start.chapter && start.chapter <= currentBook.chapters.length) {
        const startBtn = document.createElement('button');
        startBtn.type = 'button';
        startBtn.className = 'reading-banner-btn';
        startBtn.textContent = 'Go to start';
        startBtn.addEventListener('click', async () => {
            await loadChapter(start.chapter, { verse: start.verse });
            scrollToVerse(start.verse);
        });
        actions.appendChild(startBtn);
    }

    const back = document.createElement('a');
    back.className = 'reading-banner-btn';
    back.href = '/readings.html';
    back.textContent = '← Reading schedule';
    actions.appendChild(back);

    banner.appendChild(info);
    banner.appendChild(actions);
    banner.hidden = false;
}

/**
 * Update URL using history.pushState (no page reload)
 */
function updateURL(chapterNum, options = {}) {
    const { mode = 'push', verse = null } = options;
    const params = new URLSearchParams();
    params.set('book', currentBook.id);
    params.set('category', currentCategory);
    params.set('chapter', chapterNum);
    if (verse) params.set('verse', verse);
    // Keep the scheduled-reading range in the URL so reload and Back keep the context
    setReadingParams(params, readingContext);

    const newURL = `${window.location.pathname}?${params.toString()}`;
    const state = { book: currentBook.id, category: currentCategory, chapter: chapterNum };
    const currentURL = `${window.location.pathname}${window.location.search}`;
    if (mode === 'replace' || newURL === currentURL) {
        window.history.replaceState(state, '', newURL);
    } else {
        window.history.pushState(state, '', newURL);
    }
}

/**
 * Navigate to a specific chapter (updates URL and loads content)
 */
async function navigateToChapter(chapterNum) {
    await loadChapter(chapterNum);
}

/**
 * Change chapter by offset (previous/next)
 */
function changeChapter(offset) {
    const newChapter = currentChapter + offset;
    if (newChapter >= 1 && newChapter <= currentBook.chapters.length) {
        navigateToChapter(newChapter);
    }
}

/**
 * Change book from selector
 */
async function changeBook() {
    window.dispatchEvent(new Event('read-aloud-stop'));
    const selector = document.getElementById('bookSelector');
    const value = selector.value;
    if (!value) {
        await showBookCatalog();
        return;
    }
    const [bookId, category] = value.split('|');
    readingContext = null;
    currentChapter = 1;
    await loadBook(bookId, category);
}

/**
 * Keep the verse-numbers button in sync with the current setting
 */
function syncVerseNumbersButton() {
    const toggleBtn = document.getElementById('toggleVerseNumbers');
    if (!toggleBtn) return;
    toggleBtn.textContent = showVerseNumbers ? 'Hide verse numbers' : 'Verse numbers';
    toggleBtn.classList.toggle('active', showVerseNumbers);
    toggleBtn.setAttribute('aria-pressed', String(showVerseNumbers));
}

/**
 * Toggle verse numbers visibility (remembered between visits)
 */
function toggleVerseNumbers() {
    showVerseNumbers = !showVerseNumbers;
    prefs = savePrefs({ ...prefs, showVerseNumbers });
    syncVerseNumbersButton();

    document.querySelectorAll('#tabContent .verse-number').forEach((el) => {
        el.classList.toggle('hidden', !showVerseNumbers);
    });
}

/**
 * Apply the stored font size to the text area and update the size controls
 */
function applyFontScale() {
    const contentArea = document.getElementById('contentArea');
    if (contentArea) {
        contentArea.style.setProperty('--reader-font-scale', String(prefs.fontScale));
    }
    const label = document.getElementById('fontScaleLabel');
    if (label) label.textContent = `${Math.round(prefs.fontScale * 100)}%`;

    const decrease = document.getElementById('fontDecrease');
    const increase = document.getElementById('fontIncrease');
    const reset = document.getElementById('fontReset');
    if (decrease) decrease.disabled = prefs.fontScale <= FONT_SCALE_MIN;
    if (increase) increase.disabled = prefs.fontScale >= FONT_SCALE_MAX;
    if (reset) reset.disabled = prefs.fontScale === DEFAULT_PREFS.fontScale;
}

function changeFontScale(direction) {
    const fontScale =
        direction === 0 ? DEFAULT_PREFS.fontScale : stepFontScale(prefs.fontScale, direction);
    prefs = savePrefs({ ...prefs, fontScale });
    applyFontScale();
}

function setupPreferenceControls() {
    const bindings = [
        ['fontDecrease', -1],
        ['fontIncrease', 1],
        ['fontReset', 0],
    ];
    for (const [id, direction] of bindings) {
        const button = document.getElementById(id);
        if (button && !button.dataset.bound) {
            button.dataset.bound = '1';
            button.addEventListener('click', () => changeFontScale(direction));
        }
    }
}

/**
 * Switch language view: 'hebrew', 'english' or 'both' (side by side).
 * The choice is remembered between visits.
 */
function switchTab(tabName) {
    const mode = VIEW_MODES.includes(tabName) ? tabName : DEFAULT_PREFS.viewMode;

    document.querySelectorAll('.tab').forEach((tab) => {
        const isActive = tab.dataset.tab === mode;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
    });

    document.querySelectorAll('.tab-content').forEach((content) => {
        content.classList.toggle('active', content.id === `${mode}-content`);
    });

    if (prefs.viewMode !== mode) {
        prefs = savePrefs({ ...prefs, viewMode: mode });
    }
}

// Export functions to global scope for onclick handlers
window.changeChapter = changeChapter;
window.changeBook = changeBook;
window.toggleVerseNumbers = toggleVerseNumbers;
window.switchTab = switchTab;

// Immediate log when script file is executed
console.log('[Reader JS] ===== SCRIPT FILE LOADED =====');
console.log('[Reader JS] Script file executed at:', new Date().toISOString());
console.log('[Reader JS] Current URL:', window.location.href);
console.log('[Reader JS] Document readyState:', document.readyState);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    console.log('[Reader JS] Adding DOMContentLoaded listener');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[Reader JS] DOMContentLoaded fired, calling init()');
        init();
    });
} else {
    console.log('[Reader JS] DOM already ready, calling init() immediately');
    // Use setTimeout to ensure all scripts are loaded
    setTimeout(() => {
        console.log('[Reader JS] setTimeout callback executing, calling init()');
        init();
    }, 0);
}

