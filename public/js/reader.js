/**
 * Tanach Reader - Navigation without page reloads
 * Uses history.pushState() to update URL without reloading
 */

import { getBook, getAllBooks, getChapter } from './books-service.js';

// Global state
let currentBook = null;
let currentChapter = 1;
let currentCategory = null;
let allBooks = [];
let showVerseNumbers = false;

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
        
        const params = new URLSearchParams(window.location.search);
        const book = params.get('book');
        const category = params.get('category');
        const chapter = params.get('chapter');
        const verse = params.get('verse');
        
        console.log('[Reader] URL parameters:', { book, category, chapter, verse });

        if (book && category) {
            console.log('[Reader] Loading book:', book, 'category:', category);
            await loadBook(book, category);
            if (chapter) {
                currentChapter = parseInt(chapter);
                console.log('[Reader] Loading chapter:', currentChapter);
                await loadChapter(currentChapter);
                // Scroll to verse if specified
                if (verse) {
                    console.log('[Reader] Scrolling to verse:', verse);
                    setTimeout(() => {
                        const verseElement = document.querySelector(`[data-verse="${verse}"]`);
                        if (verseElement) {
                            console.log('[Reader] Verse element found, scrolling');
                            verseElement.scrollIntoView({ behavior: 'smooth' });
                            verseElement.style.backgroundColor = '#fff3cd';
                        } else {
                            console.warn('[Reader] Verse element not found:', verse);
                        }
                    }, 500);
                }
            }
        } else {
            console.log('[Reader] No book/category in URL, loading book selector');
            await loadBookSelector();
        }
        
        console.log('[Reader] ===== INIT COMPLETED =====');
    } catch (error) {
        console.error('[Reader] ===== INIT ERROR =====', error);
        console.error('[Reader] Error stack:', error.stack);
        const bookInfo = document.getElementById('bookInfo');
        if (bookInfo) {
            bookInfo.innerHTML = `<div class="error">Fout bij initialiseren: ${error.message}</div>`;
        }
    }

    // Handle browser back/forward buttons
    window.addEventListener('popstate', async (event) => {
        const params = new URLSearchParams(window.location.search);
        const book = params.get('book');
        const category = params.get('category');
        const chapter = params.get('chapter');

        if (book && category) {
            await loadBook(book, category);
            if (chapter) {
                currentChapter = parseInt(chapter);
                await loadChapter(currentChapter);
            }
        } else {
            await loadBookSelector();
        }
    });
}

/**
 * Load the book selector dropdown
 */
async function loadBookSelector() {
    try {
        allBooks = await getAllBooks();
        const selector = document.getElementById('bookSelector');
        selector.innerHTML = '<option value="">Selecteer boek...</option>';

        const categories = ['torah', 'neviim', 'ketuvim'];
        const categoryLabels = {
            torah: 'Torah',
            neviim: 'Neviim',
            ketuvim: 'Ketuvim'
        };

        categories.forEach(category => {
            const categoryBooks = allBooks.filter(book => book.category === category);
            if (categoryBooks.length > 0) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = categoryLabels[category];
                categoryBooks.forEach(book => {
                    const option = document.createElement('option');
                    option.value = `${book.id}|${category}`;
                    option.textContent = book.name;
                    optgroup.appendChild(option);
                });
                selector.appendChild(optgroup);
            }
        });
    } catch (error) {
        console.error('Error loading books:', error);
    }
}

/**
 * Load a specific book
 */
async function loadBook(bookId, category) {
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
                ${currentBook.description || ''} • ${currentBook.chapters.length} hoofdstukken
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

        // Load chapter - either from URL or first chapter
        if (currentChapter && currentChapter >= 1 && currentChapter <= currentBook.chapters.length) {
            console.log('[Reader] Loading chapter from URL or previous selection:', currentChapter);
            await loadChapter(currentChapter);
        } else {
            currentChapter = 1;
            console.log('[Reader] Loading first chapter automatically');
            await loadChapter(1);
        }
        console.log('[Reader] loadBook() completed successfully');
    } catch (error) {
        console.error('[Reader] Error in loadBook():', error);
        const bookInfoEl = document.getElementById('bookInfo');
        if (bookInfoEl) {
            bookInfoEl.innerHTML = `
                <div class="error">Kon boek niet laden: ${error.message}</div>
            `;
        }
    }
}

/**
 * Load a specific chapter
 */
async function loadChapter(chapterNum) {
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
        } else {
            console.error('[Reader] No verses found in chapter data!');
            console.error('[Reader] Chapter data structure:', JSON.stringify(chapterData, null, 2));
            const tabContent = document.getElementById('tabContent');
            if (tabContent) {
                tabContent.innerHTML = '<div class="error">Geen verzen gevonden in dit hoofdstuk. Debug info in console.</div>';
            }
        }

        // Update URL without reloading
        updateURL(chapterNum);
        console.log('[Reader] loadChapter() completed successfully');
    } catch (error) {
        console.error('[Reader] Error loading chapter:', error);
        const tabContent = document.getElementById('tabContent');
        if (tabContent) {
            tabContent.innerHTML = `<div class="error">Fout bij laden hoofdstuk: ${error.message}</div>`;
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
        hebrewVerses.innerHTML = '<div class="loading">Geen verzen gevonden</div>';
        englishVerses.innerHTML = '<div class="loading">Geen verzen gevonden</div>';
        bothVerses.innerHTML = '<div class="loading">Geen verzen gevonden</div>';
        return;
    }
    
    verses.forEach((verse, index) => {
        console.log(`[Reader] Rendering verse ${index + 1}/${verses.length}:`, verse.verse);
        const verseNumberClass = showVerseNumbers ? '' : 'hidden';

        // Hebrew tab
        const hebrewDiv = document.createElement('div');
        hebrewDiv.className = 'verse';
        hebrewDiv.setAttribute('data-verse', verse.verse);
        hebrewDiv.innerHTML = `
            <span class="verse-number ${verseNumberClass}">${verse.verse}</span>
            <span class="hebrew-text">${verse.translations?.hebrew || verse.hebrew || ''}</span>
        `;
        hebrewVerses.appendChild(hebrewDiv);

        // English tab
        const englishDiv = document.createElement('div');
        englishDiv.className = 'verse';
        englishDiv.setAttribute('data-verse', verse.verse);
        englishDiv.innerHTML = `
            <span class="verse-number ${verseNumberClass}">${verse.verse}</span>
            <span class="english-text">${verse.translations?.english || verse.english || ''}</span>
        `;
        englishVerses.appendChild(englishDiv);

        // Both tab
        const bothDiv = document.createElement('div');
        bothDiv.className = 'verse';
        bothDiv.setAttribute('data-verse', verse.verse);
        bothDiv.innerHTML = `
            <div style="margin-bottom: 10px;">
                <span class="verse-number ${verseNumberClass}">${verse.verse}</span>
                <span class="hebrew-text">${verse.translations?.hebrew || verse.hebrew || ''}</span>
            </div>
            <div>
                <span class="english-text">${verse.translations?.english || verse.english || ''}</span>
            </div>
        `;
        bothVerses.appendChild(bothDiv);
    });
    
    // Set default tab to "both"
    console.log('[Reader] About to call switchTab("both")');
    
    // Force visibility of tab content BEFORE switchTab
    const bothContent = document.getElementById('both-content');
    const tabContentContainer = document.getElementById('tabContent');
    
    console.log('[Reader] tabContentContainer element:', tabContentContainer);
    console.log('[Reader] tabContentContainer style.display:', tabContentContainer?.style.display);
    console.log('[Reader] tabContentContainer computed display:', window.getComputedStyle(tabContentContainer || document.body).display);
    
    if (bothContent) {
        bothContent.style.display = 'block';
        bothContent.style.visibility = 'visible';
        bothContent.style.opacity = '1';
        bothContent.classList.add('active');
        console.log('[Reader] Forced both-content to be visible');
        console.log('[Reader] both-content computed display:', window.getComputedStyle(bothContent).display);
        console.log('[Reader] both-content computed visibility:', window.getComputedStyle(bothContent).visibility);
    }
    
    if (tabContentContainer) {
        tabContentContainer.style.display = 'block';
        tabContentContainer.style.visibility = 'visible';
        console.log('[Reader] Forced tabContentContainer to be visible');
    }
    
    switchTab('both');
    
    console.log('[Reader] renderVerses() completed, rendered', verses.length, 'verses');
    console.log('[Reader] Hebrew verses element:', hebrewVerses);
    console.log('[Reader] English verses element:', englishVerses);
    console.log('[Reader] Both verses element:', bothVerses);
    console.log('[Reader] Hebrew verses count:', hebrewVerses.children.length);
    console.log('[Reader] English verses count:', englishVerses.children.length);
    console.log('[Reader] Both verses count:', bothVerses.children.length);
}

/**
 * Update URL using history.pushState (no page reload)
 */
function updateURL(chapterNum) {
    const params = new URLSearchParams();
    params.set('book', currentBook.id);
    params.set('category', currentCategory);
    params.set('chapter', chapterNum);
    
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ book: currentBook.id, category: currentCategory, chapter: chapterNum }, '', newURL);
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
    const selector = document.getElementById('bookSelector');
    const value = selector.value;
    if (value) {
        const [bookId, category] = value.split('|');
        currentChapter = 1; // Reset to first chapter
        await loadBook(bookId, category);
        // Update URL for new book
        updateURL(1);
    }
}

/**
 * Toggle verse numbers visibility
 */
function toggleVerseNumbers() {
    showVerseNumbers = !showVerseNumbers;
    const toggleBtn = document.getElementById('verseNumbersToggle');
    
    if (showVerseNumbers) {
        toggleBtn.textContent = 'Verberg versnummers';
        toggleBtn.classList.add('active');
    } else {
        toggleBtn.textContent = 'Toon versnummers';
        toggleBtn.classList.remove('active');
    }

    // Reload current chapter to update verse numbers
    if (currentBook) {
        loadChapter(currentChapter);
    }
}

/**
 * Switch language tab
 */
function switchTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active class to clicked tab (if event is available)
    if (typeof event !== 'undefined' && event.target) {
        event.target.classList.add('active');
    } else {
        // Fallback: find the tab button by text content
        document.querySelectorAll('.tab').forEach(tab => {
            if (tab.textContent.includes(tabName === 'hebrew' ? 'Hebreeuws' : tabName === 'english' ? 'Engels' : 'Beide')) {
                tab.classList.add('active');
            }
        });
    }

    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Show selected tab content
    document.getElementById(`${tabName}-content`).classList.add('active');
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

