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
    'Bereishit': 'Genesis',
    'Shemot': 'Exodus',
    'Shmot': 'Exodus',
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

// Parashat name to Torah portion mapping (approximate chapters)
const PARASHAT_MAPPING = {
    'Bereshit': { book: 'Genesis', chapter: 1 },
    'Noach': { book: 'Genesis', chapter: 6 },
    'Lech-Lecha': { book: 'Genesis', chapter: 12 },
    'Vayera': { book: 'Genesis', chapter: 18 },
    'Chayei Sara': { book: 'Genesis', chapter: 23 },
    'Toldot': { book: 'Genesis', chapter: 25 },
    'Vayetzei': { book: 'Genesis', chapter: 28 },
    'Vayishlach': { book: 'Genesis', chapter: 32 },
    'Vayeshev': { book: 'Genesis', chapter: 37 },
    'Miketz': { book: 'Genesis', chapter: 41 },
    'Vayigash': { book: 'Genesis', chapter: 44 },
    'Vayechi': { book: 'Genesis', chapter: 47 },
    'Shemot': { book: 'Exodus', chapter: 1 },
    'Vaera': { book: 'Exodus', chapter: 6 },
    'Bo': { book: 'Exodus', chapter: 10 },
    'Beshalach': { book: 'Exodus', chapter: 13 },
    'Yitro': { book: 'Exodus', chapter: 18 },
    'Mishpatim': { book: 'Exodus', chapter: 21 },
    'Terumah': { book: 'Exodus', chapter: 25 },
    'Tetzaveh': { book: 'Exodus', chapter: 27 },
    'Ki Tisa': { book: 'Exodus', chapter: 30 },
    'Vayakhel': { book: 'Exodus', chapter: 35 },
    'Pekudei': { book: 'Exodus', chapter: 38 },
    'Vayikra': { book: 'Leviticus', chapter: 1 },
    'Tzav': { book: 'Leviticus', chapter: 6 },
    'Shmini': { book: 'Leviticus', chapter: 9 },
    'Tazria': { book: 'Leviticus', chapter: 12 },
    'Metzora': { book: 'Leviticus', chapter: 14 },
    'Achrei Mot': { book: 'Leviticus', chapter: 16 },
    'Kedoshim': { book: 'Leviticus', chapter: 19 },
    'Emor': { book: 'Leviticus', chapter: 21 },
    'Behar': { book: 'Leviticus', chapter: 25 },
    'Bechukotai': { book: 'Leviticus', chapter: 26 },
    'Bamidbar': { book: 'Numbers', chapter: 1 },
    'Nasso': { book: 'Numbers', chapter: 4 },
    'Beha\'alotcha': { book: 'Numbers', chapter: 8 },
    'Sh\'lach': { book: 'Numbers', chapter: 13 },
    'Korach': { book: 'Numbers', chapter: 16 },
    'Chukat': { book: 'Numbers', chapter: 19 },
    'Balak': { book: 'Numbers', chapter: 22 },
    'Pinchas': { book: 'Numbers', chapter: 25 },
    'Matot': { book: 'Numbers', chapter: 30 },
    'Masei': { book: 'Numbers', chapter: 33 },
    'Devarim': { book: 'Deuteronomy', chapter: 1 },
    'Vaetchanan': { book: 'Deuteronomy', chapter: 3 },
    'Eikev': { book: 'Deuteronomy', chapter: 7 },
    'Re\'eh': { book: 'Deuteronomy', chapter: 11 },
    'Shoftim': { book: 'Deuteronomy', chapter: 16 },
    'Ki Teitzei': { book: 'Deuteronomy', chapter: 21 },
    'Ki Tavo': { book: 'Deuteronomy', chapter: 26 },
    'Nitzavim': { book: 'Deuteronomy', chapter: 29 },
    'Vayeilech': { book: 'Deuteronomy', chapter: 31 },
    'Ha\'Azinu': { book: 'Deuteronomy', chapter: 32 },
    'V\'Zot HaBerachah': { book: 'Deuteronomy', chapter: 33 },
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
 * Get Torah portion info from parashat name
 * @param {string} parashatName - Name like "Chayei Sara" or "Parashat Vayera"
 * @returns {object|null} - { book, chapter } or null
 */
export function getParashatInfo(parashatName) {
    if (!parashatName) return null;

    // Remove "Parashat" prefix if present
    let cleanName = parashatName.replace(/^Parashat\s+/i, '').trim();

    // Direct lookup
    if (PARASHAT_MAPPING[cleanName]) {
        return PARASHAT_MAPPING[cleanName];
    }

    // Try case-insensitive lookup
    const lowerName = cleanName.toLowerCase();
    for (const [key, value] of Object.entries(PARASHAT_MAPPING)) {
        if (key.toLowerCase() === lowerName) {
            return value;
        }
    }

    return null;
}

/**
 * Parse a Sefaria reference like "Genesis 1:1-5" or "Exodus 12:1"
 * Returns { book, chapter, verseStart, verseEnd }
 */
export function parseReference(reference) {
    if (!reference) return null;

    // Clean up the reference
    reference = reference.trim();

    // Pattern: "Book Chapter:Verse-Chapter:Verse" (cross-chapter range) - e.g., "Judges 4:4-5:31"
    const crossChapterMatch = reference.match(/^(.+?)\s+(\d+):(\d+)-(\d+):(\d+)$/);
    if (crossChapterMatch) {
        // For cross-chapter ranges, use the start chapter and verse
        return {
            book: crossChapterMatch[1],
            chapter: parseInt(crossChapterMatch[2]),
            verseStart: parseInt(crossChapterMatch[3]),
            verseEnd: parseInt(crossChapterMatch[5])
        };
    }

    // Pattern: "Book Chapter:Verse" or "Book Chapter:Verse-Verse" (same chapter)
    const match = reference.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);

    if (!match) {
        // Try pattern: "Book Seder X" FIRST (before chapter match) - e.g., "Judges Seder 13" or "Kings Seder 30"
        const sederMatch = reference.match(/^(.+?)\s+Seder\s+(\d+)$/i);
        if (sederMatch) {
            // Approximate: each seder is roughly a chapter or portion
            let bookName = sederMatch[1].trim();
            // Handle "Kings" -> "I Kings" (default to I Kings for Tanakh Yomi)
            if (bookName === 'Kings') {
                bookName = 'I Kings';
            }
            return {
                book: bookName,
                chapter: parseInt(sederMatch[2]),
                verseStart: 1,
                verseEnd: null
            };
        }

        // Try pattern: "Book Chapter" (no verse) - e.g., "Exodus 5"
        const chapterMatch = reference.match(/^(.+?)\s+(\d+)(?:\s+\(\d+\))?$/);
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
