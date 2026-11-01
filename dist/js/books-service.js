/**
 * Books data service for static site
 * Loads book data from JSON files
 */

const CATEGORIES = ['torah', 'neviim', 'trei_asara', 'ketuvim'];

// Cache for loaded books
let booksCache = null;

/**
 * Get all books from all categories
 */
export async function getAllBooks() {
    if (booksCache) {
        return booksCache;
    }

    const allBooks = [];

    for (const category of CATEGORIES) {
        const categoryBooks = await getBooksByCategory(category);
        allBooks.push(...categoryBooks);
    }

    booksCache = allBooks;
    return allBooks;
}

/**
 * Get books by category
 */
export async function getBooksByCategory(category) {
    // Define the books in each category
    const categoryFiles = {
        torah: ['bereshit', 'shemot', 'vayikra', 'bamidbar', 'devarim'],
        neviim: ['yehoshua', 'shoftim', 'shmuel1', 'shmuel2', 'melachim1', 'melachim2',
                 'yeshayahu', 'yirmeyahu', 'yechezkel'],
        trei_asara: ['hoshea', 'yoel', 'amos', 'ovadya', 'yona', 'michah',
                     'nachum', 'chavakuk', 'tzefanya', 'chagai', 'zecharya', 'malachi'],
        ketuvim: ['tehillim', 'mishlei', 'iyov', 'shir_hashirim', 'rut', 'eicha',
                  'kohelet', 'esther', 'daniel', 'ezra', 'nechemya',
                  'divrei_hayamim1', 'divrei_hayamim2']
    };

    const files = categoryFiles[category] || [];
    const books = [];

    for (const bookId of files) {
        try {
            const response = await fetch(`/data/books/${category}/${bookId}.json`);
            if (response.ok) {
                const bookData = await response.json();
                books.push({
                    ...bookData,
                    category: category
                });
            }
        } catch (error) {
            console.error(`Error loading book ${bookId}:`, error);
        }
    }

    return books;
}

/**
 * Get a specific book
 */
export async function getBook(category, bookId) {
    try {
        const response = await fetch(`/data/books/${category}/${bookId}.json`);
        if (!response.ok) {
            throw new Error('Book not found');
        }
        return await response.json();
    } catch (error) {
        console.error(`Error loading book ${category}/${bookId}:`, error);
        throw error;
    }
}

/**
 * Get a specific chapter from a book
 */
export async function getChapter(category, bookId, chapterNum) {
    try {
        const bookData = await getBook(category, bookId);
        const chapter = bookData.chapters.find(ch => ch.chapter === parseInt(chapterNum));

        if (!chapter) {
            throw new Error('Chapter not found');
        }

        return {
            book: {
                id: bookData.id,
                name: bookData.name,
                category: category
            },
            chapter: chapter
        };
    } catch (error) {
        console.error(`Error loading chapter ${category}/${bookId}/${chapterNum}:`, error);
        throw error;
    }
}

/**
 * Search through all books
 */
export async function searchBooks(query) {
    const books = await getAllBooks();
    const results = [];
    const searchTerm = query.toLowerCase();

    for (const book of books) {
        // Check if book name matches
        const bookNameMatch = book.name.toLowerCase().includes(searchTerm) ||
                              book.id.toLowerCase().includes(searchTerm);

        if (bookNameMatch) {
            // Return first few verses of the book
            if (book.chapters && book.chapters.length > 0) {
                const firstChapter = book.chapters[0];
                const verses = firstChapter.verses.slice(0, 3);

                verses.forEach(verse => {
                    results.push({
                        book: book.name,
                        bookId: book.id,
                        category: book.category,
                        chapter: firstChapter.chapter,
                        verse: verse.verse,
                        hebrew: verse.hebrew,
                        english: verse.english
                    });
                });
            }
        } else {
            // Search in verses
            for (const chapter of book.chapters) {
                for (const verse of chapter.verses) {
                    const hebrewMatch = verse.hebrew && verse.hebrew.toLowerCase().includes(searchTerm);
                    const englishMatch = verse.english && verse.english.toLowerCase().includes(searchTerm);

                    if (hebrewMatch || englishMatch) {
                        results.push({
                            book: book.name,
                            bookId: book.id,
                            category: book.category,
                            chapter: chapter.chapter,
                            verse: verse.verse,
                            hebrew: verse.hebrew,
                            english: verse.english
                        });

                        // Limit results
                        if (results.length >= 100) {
                            return results;
                        }
                    }
                }
            }
        }
    }

    return results;
}
