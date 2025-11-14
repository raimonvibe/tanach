/**
 * Book Mapping Service
 * Maps Sefaria book names to internal book IDs and provides link generation
 */

// Comprehensive mapping of Sefaria book names to internal book structure
const BOOK_MAPPING = {
    // Torah
    'Genesis': { id: 'bereshit', category: 'torah', name: 'Genesis' },
    'Exodus': { id: 'shemot', category: 'torah', name: 'Exodus' },
    'Leviticus': { id: 'vayikra', category: 'torah', name: 'Leviticus' },
    'Numbers': { id: 'bamidbar', category: 'torah', name: 'Numbers' },
    'Deuteronomy': { id: 'devarim', category: 'torah', name: 'Deuteronomy' },

    // Neviim (Prophets)
    'Joshua': { id: 'yehoshua', category: 'neviim', name: 'Joshua' },
    'Judges': { id: 'shoftim', category: 'neviim', name: 'Judges' },
    'I Samuel': { id: 'shmuel1', category: 'neviim', name: 'I Samuel' },
    'II Samuel': { id: 'shmuel2', category: 'neviim', name: 'II Samuel' },
    'I Kings': { id: 'melachim1', category: 'neviim', name: 'I Kings' },
    'II Kings': { id: 'melachim2', category: 'neviim', name: 'II Kings' },
    'Isaiah': { id: 'yeshayahu', category: 'neviim', name: 'Isaiah' },
    'Jeremiah': { id: 'yirmeyahu', category: 'neviim', name: 'Jeremiah' },
    'Ezekiel': { id: 'yechezkel', category: 'neviim', name: 'Ezekiel' },

    // Trei Asar (Twelve Minor Prophets)
    'Hosea': { id: 'hoshea', category: 'trei_asara', name: 'Hosea' },
    'Joel': { id: 'yoel', category: 'trei_asara', name: 'Joël' },
    'Amos': { id: 'amos', category: 'trei_asara', name: 'Amos' },
    'Obadiah': { id: 'ovadya', category: 'trei_asara', name: 'Obadja' },
    'Jonah': { id: 'yona', category: 'trei_asara', name: 'Jona' },
    'Micah': { id: 'michah', category: 'trei_asara', name: 'Micha' },
    'Nahum': { id: 'nachum', category: 'trei_asara', name: 'Nahum' },
    'Habakkuk': { id: 'chavakuk', category: 'trei_asara', name: 'Habakuk' },
    'Zephaniah': { id: 'tzefanya', category: 'trei_asara', name: 'Zefanja' },
    'Haggai': { id: 'chagai', category: 'trei_asara', name: 'Haggai' },
    'Zechariah': { id: 'zecharya', category: 'trei_asara', name: 'Zacharia' },
    'Malachi': { id: 'malachi', category: 'trei_asara', name: 'Maleachi' },

    // Ketuvim (Writings)
    'Psalms': { id: 'tehillim', category: 'ketuvim', name: 'Psalms' },
    'Proverbs': { id: 'mishlei', category: 'ketuvim', name: 'Proverbs' },
    'Job': { id: 'iyov', category: 'ketuvim', name: 'Job' },
    'Song of Songs': { id: 'shir_hashirim', category: 'ketuvim', name: 'Song of Songs' },
    'Ruth': { id: 'rut', category: 'ketuvim', name: 'Ruth' },
    'Lamentations': { id: 'eicha', category: 'ketuvim', name: 'Lamentations' },
    'Ecclesiastes': { id: 'kohelet', category: 'ketuvim', name: 'Ecclesiastes' },
    'Esther': { id: 'esther', category: 'ketuvim', name: 'Esther' },
    'Daniel': { id: 'daniel', category: 'ketuvim', name: 'Daniel' },
    'Ezra': { id: 'ezra', category: 'ketuvim', name: 'Ezra' },
    'Nehemiah': { id: 'nechemya', category: 'ketuvim', name: 'Nehemiah' },
    'I Chronicles': { id: 'divrei_hayamim1', category: 'ketuvim', name: 'I Chronicles' },
    'II Chronicles': { id: 'divrei_hayamim2', category: 'ketuvim', name: 'II Chronicles' },
};

// Add alternate spellings and variations
const ALTERNATE_NAMES = {
    'Bereshit': 'Genesis',
    'Shemot': 'Exodus',
    'Vayikra': 'Leviticus',
    'Bamidbar': 'Numbers',
    'Devarim': 'Deuteronomy',
    'Yehoshua': 'Joshua',
    'Shoftim': 'Judges',
    'Shmuel I': 'I Samuel',
    'Shmuel II': 'II Samuel',
    'Melachim I': 'I Kings',
    'Melachim II': 'II Kings',
    'Yeshayahu': 'Isaiah',
    'Yirmeyahu': 'Jeremiah',
    'Yechezkel': 'Ezekiel',
    'Hoshea': 'Hosea',
    'Yoel': 'Joel',
    'Ovadya': 'Obadiah',
    'Yona': 'Jonah',
    'Michah': 'Micah',
    'Nachum': 'Nahum',
    'Chavakuk': 'Habakkuk',
    'Tzefanya': 'Zephaniah',
    'Chagai': 'Haggai',
    'Zecharya': 'Zechariah',
    'Tehillim': 'Psalms',
    'Mishlei': 'Proverbs',
    'Iyov': 'Job',
    'Shir HaShirim': 'Song of Songs',
    'Rut': 'Ruth',
    'Eicha': 'Lamentations',
    'Kohelet': 'Ecclesiastes',
    'Divrei HaYamim I': 'I Chronicles',
    'Divrei HaYamim II': 'II Chronicles',
    'Nechemya': 'Nehemiah',
};

/**
 * Get book info from Sefaria book name
 */
export function getBookInfo(sefariaName) {
    // Normalize the name
    let normalizedName = sefariaName.trim();

    // Check if it's an alternate name
    if (ALTERNATE_NAMES[normalizedName]) {
        normalizedName = ALTERNATE_NAMES[normalizedName];
    }

    return BOOK_MAPPING[normalizedName] || null;
}

/**
 * Parse a Sefaria reference like "Genesis 1:1-5" or "Exodus 12:1"
 * Returns { book, chapter, verseStart, verseEnd }
 */
export function parseReference(reference) {
    if (!reference) return null;

    // Clean up the reference
    reference = reference.trim();

    // Pattern: "Book Chapter:Verse" or "Book Chapter:Verse-Verse"
    const match = reference.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);

    if (!match) {
        // Try pattern: "Book Chapter" (no verse)
        const chapterMatch = reference.match(/^(.+?)\s+(\d+)$/);
        if (chapterMatch) {
            return {
                book: chapterMatch[1],
                chapter: parseInt(chapterMatch[2]),
                verseStart: 1,
                verseEnd: null
            };
        }
        return null;
    }

    return {
        book: match[1],
        chapter: parseInt(match[2]),
        verseStart: parseInt(match[3]),
        verseEnd: match[4] ? parseInt(match[4]) : null
    };
}

/**
 * Generate internal reader link from Sefaria reference
 * @param {string} reference - Sefaria style reference like "Genesis 1:1" or "Exodus 12:1-10"
 * @returns {string|null} - Internal link URL or null if not found
 */
export function generateReaderLink(reference) {
    const parsed = parseReference(reference);
    if (!parsed) return null;

    const bookInfo = getBookInfo(parsed.book);
    if (!bookInfo) return null;

    // Build the URL
    let url = `/reader.html?book=${bookInfo.id}&category=${bookInfo.category}`;

    if (parsed.chapter) {
        url += `&chapter=${parsed.chapter}`;
    }

    if (parsed.verseStart) {
        url += `&verse=${parsed.verseStart}`;
    }

    return url;
}

/**
 * Check if a book exists in our collection
 */
export function hasBook(sefariaName) {
    return getBookInfo(sefariaName) !== null;
}

/**
 * Get all supported book names
 */
export function getAllSupportedBooks() {
    return Object.keys(BOOK_MAPPING);
}

/**
 * Extract book name from various Sefaria formats
 * Examples:
 * - "Parashat Vayeitzei" -> extract the parashat name
 * - "Genesis 28:10-32:3" -> "Genesis"
 */
export function extractBookName(text) {
    if (!text) return null;

    // Check if it's a standard reference
    const parsed = parseReference(text);
    if (parsed && parsed.book) {
        return parsed.book;
    }

    // Check if any book name is mentioned in the text
    for (const bookName of Object.keys(BOOK_MAPPING)) {
        if (text.includes(bookName)) {
            return bookName;
        }
    }

    // Check alternate names
    for (const [altName, standardName] of Object.entries(ALTERNATE_NAMES)) {
        if (text.includes(altName)) {
            return standardName;
        }
    }

    return null;
}

/**
 * Convert a Sefaria URL to internal reader URL
 */
export function convertSefariaUrl(sefariaUrl) {
    if (!sefariaUrl) return null;

    // Extract the reference from Sefaria URL
    // Format: https://www.sefaria.org/Genesis.1.1 or /Genesis.1.1
    const match = sefariaUrl.match(/\/([^/]+\.\d+(?:\.\d+)?(?:-\d+)?)$/);

    if (!match) return null;

    // Convert dot notation to colon notation
    const reference = match[1].replace(/\./g, ' ').replace(/\s(\d+)\s(\d+)/, ' $1:$2');

    return generateReaderLink(reference);
}
