// Reader functionality for Tanach Reader
// This file handles navigation and content loading for reader.html

// Import books service (adjust path as needed)
import { getBooks, getChapter } from './books-service.js';

// State variables
let currentBook = null;
let currentChapter = 1;
let currentCategory = null;
let showVerseNumbers = true;
let allBooks = [];

// Initialize the reader
async function initReader() {
    try {
        console.log('Initializing Tanach Reader...');
        
        // Load all books
        allBooks = await getBooks();
        console.log('Books loaded:', allBooks.length);
        
        populateBookSelector();
        
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const bookParam = urlParams.get('book');
        const chapterParam = urlParams.get('chapter');
        const categoryParam = urlParams.get('category');
        
        console.log('URL params:', { bookParam, chapterParam, categoryParam });
        
        if (bookParam && categoryParam) {
            currentBook = bookParam;
            currentCategory = categoryParam;
            currentChapter = parseInt(chapterParam) || 1;
            await loadBookAndChapter();
        } else {
            showBookSelection();
        }
        
        // Handle browser back/forward buttons
        window.addEventListener('popstate', handlePopState);
        
    } catch (error) {
        console.error('Error initializing reader:', error);
        showError('Fout bij het laden van de applicatie: ' + error.message);
    }
}

// Handle browser back/forward navigation
function handlePopState(event) {
    console.log('Handling popstate event');
    const urlParams = new URLSearchParams(window.location.search);
    const bookParam = urlParams.get('book');
    const chapterParam = urlParams.get('chapter');
    const categoryParam = urlParams.get('category');
    
    if (bookParam && categoryParam) {
        currentBook = bookParam;
        currentCategory = categoryParam;
        currentChapter = parseInt(chapterParam) || 1;
        loadBookAndChapter();
    }
}

// Update URL without reloading the page
function updateURL(book, category, chapter) {
    const url = new URL(window.location);
    url.searchParams.set('book', book);
    url.searchParams.set('category', category);
    url.searchParams.set('chapter', chapter);
    
    console.log('Updating URL to:', url.toString());
    
    // Use pushState to update URL without reload - THIS IS KEY!
    window.history.pushState(
        { book, category, chapter },
        '',
        url.toString()
    );
}

// Populate book selector
function populateBookSelector() {
    const selector = document.getElementById('bookSelector');
    if (!selector) {
        console.error('Book selector not found');
        return;
    }
    
    selector.innerHTML = '<option value="">Selecteer boek...</option>';
    
    const categories = ['Torah', 'Prophets', 'Writings'];
    const categoryNames = {
        'Torah': 'Torah (Wet)',
        'Prophets': 'Neviim (Profeten)',
        'Writings': 'Ketuvim (Geschriften)'
    };
    
    categories.forEach(category => {
        const categoryBooks = allBooks.filter(b => b.category === category);
        if (categoryBooks.length > 0) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = categoryNames[category] || category;
            
            categoryBooks.forEach(book => {
                const option = document.createElement('option');
                option.value = `${book.book}|${book.category}`;
                option.textContent = `${book.hebrewName} (${book.englishName})`;
                if (currentBook === book.book) {
                    option.selected = true;
                }
                optgroup.appendChild(option);
            });
            
            selector.appendChild(optgroup);
        }
    });
}

// Change book from selector
window.changeBook = async function() {
    const selector = document.getElementById('bookSelector');
    if (!selector || !selector.value) return;
    
    console.log('Changing book:', selector.value);
    
    const [book, category] = selector.value.split('|');
    currentBook = book;
    currentCategory = category;
    currentChapter = 1;
    
    // Update URL without reload
    updateURL(currentBook, currentCategory, currentChapter);
    await loadBookAndChapter();
}

// Load book and chapter
async function loadBookAndChapter() {
    try {
        console.log('Loading book and chapter:', currentBook, currentCategory, currentChapter);
        
        // Show loading state
        showLoading();
        
        // Find book info
        const bookInfo = allBooks.find(b => 
            b.book === currentBook && b.category === currentCategory
        );
        
        if (!bookInfo) {
            showError('Boek niet gevonden');
            return;
        }
        
        console.log('Book info:', bookInfo);
        
        // Update book info display
        displayBookInfo(bookInfo);
        
        // Load chapter content
        const chapterData = await getChapter(currentCategory, currentBook, currentChapter);
        
        if (!chapterData) {
            showError('Hoofdstuk niet gevonden');
            return;
        }
        
        console.log('Chapter data loaded');
        
        // Display chapter content
        displayChapter(chapterData, bookInfo);
        
        // Update chapter navigation
        updateChapterNavigation(bookInfo);
        
        // Update navigation buttons
        updateNavigationButtons(bookInfo);
        
    } catch (error) {
        console.error('Error loading chapter:', error);
        showError('Fout bij het laden van het hoofdstuk: ' + error.message);
    }
}

// Change chapter (previous/next)
window.changeChapter = async function(direction) {
    console.log('Changing chapter by:', direction);
    
    const bookInfo = allBooks.find(b => 
        b.book === currentBook && b.category === currentCategory
    );
    
    if (!bookInfo) return;
    
    const newChapter = currentChapter + direction;
    
    if (newChapter < 1 || newChapter > bookInfo.chapters) {
        console.log('Chapter out of range:', newChapter);
        return;
    }
    
    currentChapter = newChapter;
    
    // Update URL without reload - THIS PREVENTS THE PAGE RELOAD!
    updateURL(currentBook, currentCategory, currentChapter);
    await loadBookAndChapter();
}

// Go to specific chapter
window.goToChapter = async function(chapter) {
    console.log('Going to chapter:', chapter);
    currentChapter = parseInt(chapter);
    
    // Update URL without reload - THIS PREVENTS THE PAGE RELOAD!
    updateURL(currentBook, currentCategory, currentChapter);
    await loadBookAndChapter();
}

// Display book info
function displayBookInfo(bookInfo) {
    const bookInfoDiv = document.getElementById('bookInfo');
    const bookTitle = document.getElementById('bookTitle');
    
    if (bookTitle) {
        bookTitle.textContent = `${bookInfo.hebrewName} (${bookInfo.englishName})`;
    }
    
    if (bookInfoDiv) {
        bookInfoDiv.innerHTML = `
            <h2 class="book-title">${bookInfo.hebrewName} - ${bookInfo.englishName}</h2>
            <p class="book-meta">
                Categorie: ${getCategoryName(bookInfo.category)} | 
                Hoofdstukken: ${bookInfo.chapters} | 
                Huidig hoofdstuk: ${currentChapter}
            </p>
        `;
    }
}

// Display chapter content
function displayChapter(chapterData, bookInfo) {
    const contentArea = document.getElementById('contentArea');
    if (contentArea) {
        contentArea.style.display = 'block';
    }
    
    // Display Hebrew verses
    const hebrewVerses = document.getElementById('hebrewVerses');
    if (hebrewVerses && chapterData.hebrew) {
        hebrewVerses.innerHTML = chapterData.hebrew.map((verse, index) => `
            <div class="verse hebrew-text">
                <span class="verse-number ${showVerseNumbers ? '' : 'hidden'}">${index + 1}.</span>
                ${verse}
            </div>
        `).join('');
    }
    
    // Display English verses
    const englishVerses = document.getElementById('englishVerses');
    if (englishVerses && chapterData.english) {
        englishVerses.innerHTML = chapterData.english.map((verse, index) => `
            <div class="verse english-text">
                <span class="verse-number ${showVerseNumbers ? '' : 'hidden'}">${index + 1}.</span>
                ${verse}
            </div>
        `).join('');
    }
    
    // Display both languages
    const bothVerses = document.getElementById('bothVerses');
    if (bothVerses && chapterData.hebrew && chapterData.english) {
        bothVerses.innerHTML = chapterData.hebrew.map((hebrewVerse, index) => `
            <div class="verse">
                <div class="hebrew-text" style="margin-bottom: 10px;">
                    <span class="verse-number ${showVerseNumbers ? '' : 'hidden'}">${index + 1}.</span>
                    ${hebrewVerse}
                </div>
                <div class="english-text">
                    <span class="verse-number ${showVerseNumbers ? '' : 'hidden'}">${index + 1}.</span>
                    ${chapterData.english[index] || ''}
                </div>
            </div>
        `).join('');
    }
}

// Update chapter navigation
function updateChapterNavigation(bookInfo) {
    const chapterNav = document.getElementById('chapterNav');
    const chapterButtons = document.getElementById('chapterButtons');
    
    if (!chapterNav || !chapterButtons) return;
    
    chapterNav.style.display = 'block';
    chapterButtons.innerHTML = '';
    
    for (let i = 1; i <= bookInfo.chapters; i++) {
        const button = document.createElement('button');
        button.className = `chapter-btn ${i === currentChapter ? 'active' : ''}`;
        button.textContent = i;
        // Use onclick handler, NOT href - this prevents page reload!
        button.onclick = () => goToChapter(i);
        chapterButtons.appendChild(button);
    }
}

// Update navigation buttons
function updateNavigationButtons(bookInfo) {
    const prevBtn = document.getElementById('prevChapter');
    const nextBtn = document.getElementById('nextChapter');
    
    if (prevBtn) {
        prevBtn.disabled = currentChapter <= 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentChapter >= bookInfo.chapters;
    }
}

// Switch language tab
window.switchTab = function(tab) {
    const clickedTab = event.target;
    
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    clickedTab.classList.add('active');
    
    // Update content visibility
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`${tab}-content`).classList.add('active');
}

// Toggle verse numbers
window.toggleVerseNumbers = function() {
    showVerseNumbers = !showVerseNumbers;
    
    document.querySelectorAll('.verse-number').forEach(num => {
        if (showVerseNumbers) {
            num.classList.remove('hidden');
        } else {
            num.classList.add('hidden');
        }
    });
    
    const toggleBtn = document.getElementById('verseNumbersToggle');
    if (toggleBtn) {
        toggleBtn.classList.toggle('active', showVerseNumbers);
    }
}

// Show loading state
function showLoading() {
    const bookInfo = document.getElementById('bookInfo');
    if (bookInfo) {
        bookInfo.innerHTML = '<div class="loading">Laden...</div>';
    }
    
    const contentArea = document.getElementById('contentArea');
    if (contentArea) {
        contentArea.style.display = 'none';
    }
}

// Show error
function showError(message) {
    const bookInfo = document.getElementById('bookInfo');
    if (bookInfo) {
        bookInfo.innerHTML = `<div class="error">${message}</div>`;
    }
}

// Show book selection
function showBookSelection() {
    const bookInfo = document.getElementById('bookInfo');
    if (bookInfo) {
        bookInfo.innerHTML = `
            <div class="loading">
                Selecteer een boek uit het menu hierboven om te beginnen met lezen.
            </div>
        `;
    }
}

// Get category display name
function getCategoryName(category) {
    const names = {
        'Torah': 'Torah (Wet)',
        'Prophets': 'Neviim (Profeten)',
        'Writings': 'Ketuvim (Geschriften)'
    };
    return names[category] || category;
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReader);
} else {
    initReader();
}

console.log('Reader module loaded');
