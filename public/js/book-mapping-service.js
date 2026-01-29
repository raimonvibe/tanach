/**
 * Book Mapping Service
 * Maps Sefaria book names to internal book IDs and provides link generation
 */

import { getBook, getChapter } from './books-service.js';

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

    // Clean up the reference - handle whitespace, HTML entities, and special characters
    reference = reference.trim()
        .replace(/\s+/g, ' ')  // Normalize multiple spaces to single space
        .replace(/\t/g, ' ')   // Replace tabs with spaces
        .replace(/\n/g, ' ')   // Replace newlines with spaces
        .replace(/&nbsp;/g, ' ') // Replace HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
    
    // Check for empty string after cleanup
    if (!reference || reference.length === 0) {
        return null;
    }
    
    // Check for obviously invalid patterns
    if (reference.match(/^[:\d\s-]+$/) || reference.match(/^[\d\s-:]+$/)) {
        // Only numbers, colons, dashes, spaces - no book name
        console.warn(`[BookMapping] Invalid reference (no book name): "${reference}"`);
        return null;
    }

    // Pattern: "Book Chapter:Verse-Chapter:Verse" (cross-chapter range) - e.g., "Judges 4:4-5:31"
    const crossChapterMatch = reference.match(/^(.+?)\s+(\d+):(\d+)-(\d+):(\d+)$/);
    if (crossChapterMatch) {
        const startChapter = parseInt(crossChapterMatch[2]);
        const startVerse = parseInt(crossChapterMatch[3]);
        const endChapter = parseInt(crossChapterMatch[4]);
        const endVerse = parseInt(crossChapterMatch[5]);
        
        // Validate numbers are positive
        if (startChapter < 1 || startVerse < 1 || endChapter < 1 || endVerse < 1) {
            console.warn(`[BookMapping] Invalid cross-chapter range (negative or zero): "${reference}"`);
            return null;
        }
        
        // Validate range is logical (end >= start)
        if (endChapter < startChapter || (endChapter === startChapter && endVerse < startVerse)) {
            console.warn(`[BookMapping] Invalid cross-chapter range (reversed): "${reference}"`);
            return null;
        }
        
        // For cross-chapter ranges, use the start chapter and verse
        return {
            book: crossChapterMatch[1].trim(),
            chapter: startChapter,
            verseStart: startVerse,
            verseEnd: endVerse
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
            const sederNum = parseInt(sederMatch[2]);
            
            // Handle "Kings" - Seder numbers span across I Kings (22 chapters) and II Kings (25 chapters)
            if (bookName === 'Kings') {
                const maxSeder = 47; // 22 + 25
                if (sederNum < 1 || sederNum > maxSeder) {
                    console.warn(`[BookMapping] Kings Seder ${sederNum} is out of range (1-${maxSeder})`);
                    return null; // Invalid seder number
                }
                
                // I Kings has 22 chapters, so Seder 1-22 are I Kings, Seder 23+ are II Kings
                if (sederNum <= 22) {
                    bookName = 'I Kings';
                    return {
                        book: bookName,
                        chapter: sederNum,
                        verseStart: 1,
                        verseEnd: null
                    };
                } else {
                    bookName = 'II Kings';
                    const chapterNum = sederNum - 22; // Seder 23 = II Kings chapter 1, Seder 30 = II Kings chapter 8
                    if (chapterNum > 25) {
                        console.warn(`[BookMapping] Kings Seder ${sederNum} maps to II Kings chapter ${chapterNum}, but II Kings only has 25 chapters`);
                        return null;
                    }
                    return {
                        book: bookName,
                        chapter: chapterNum,
                        verseStart: 1,
                        verseEnd: null
                    };
                }
            }
            
            // Handle "Samuel" - I Samuel has 31 chapters, II Samuel has 24 chapters
            if (bookName === 'Samuel') {
                const maxSeder = 55; // 31 + 24
                if (sederNum < 1 || sederNum > maxSeder) {
                    console.warn(`[BookMapping] Samuel Seder ${sederNum} is out of range (1-${maxSeder})`);
                    return null; // Invalid seder number
                }
                
                if (sederNum <= 31) {
                    bookName = 'I Samuel';
                    return {
                        book: bookName,
                        chapter: sederNum,
                        verseStart: 1,
                        verseEnd: null
                    };
                } else {
                    bookName = 'II Samuel';
                    const chapterNum = sederNum - 31; // Seder 32 = II Samuel chapter 1
                    if (chapterNum > 24) {
                        console.warn(`[BookMapping] Samuel Seder ${sederNum} maps to II Samuel chapter ${chapterNum}, but II Samuel only has 24 chapters`);
                        return null;
                    }
                    return {
                        book: bookName,
                        chapter: chapterNum,
                        verseStart: 1,
                        verseEnd: null
                    };
                }
            }
            
            // Handle "Chronicles" - I Chronicles has 29 chapters, II Chronicles has 36 chapters
            if (bookName === 'Chronicles') {
                const maxSeder = 65; // 29 + 36
                if (sederNum < 1 || sederNum > maxSeder) {
                    console.warn(`[BookMapping] Chronicles Seder ${sederNum} is out of range (1-${maxSeder})`);
                    return null; // Invalid seder number
                }
                
                if (sederNum <= 29) {
                    bookName = 'I Chronicles';
                    return {
                        book: bookName,
                        chapter: sederNum,
                        verseStart: 1,
                        verseEnd: null
                    };
                } else {
                    bookName = 'II Chronicles';
                    const chapterNum = sederNum - 29; // Seder 30 = II Chronicles chapter 1
                    if (chapterNum > 36) {
                        console.warn(`[BookMapping] Chronicles Seder ${sederNum} maps to II Chronicles chapter ${chapterNum}, but II Chronicles only has 36 chapters`);
                        return null;
                    }
                    return {
                        book: bookName,
                        chapter: chapterNum,
                        verseStart: 1,
                        verseEnd: null
                    };
                }
            }
            
            // Default: treat seder as chapter number
            return {
                book: bookName,
                chapter: sederNum,
                verseStart: 1,
                verseEnd: null
            };
        }

        // Try pattern: "Book Chapter" (no verse) - e.g., "Exodus 5"
        const chapterMatch = reference.match(/^(.+?)\s+(\d+)(?:\s+\(\d+\))?$/);
        if (chapterMatch) {
            const chapterNum = parseInt(chapterMatch[2]);
            if (chapterNum < 1) {
                console.warn(`[BookMapping] Invalid chapter number: ${chapterNum} (must be >= 1)`);
                return null;
            }
            return {
                book: chapterMatch[1],
                chapter: chapterNum,
                verseStart: 1,
                verseEnd: null
            };
        }

        // Try pattern: "Book Name Only" (no chapter/verse) - e.g., "Song of Songs", "Ruth", "Esther"
        // Fallback: treat as book name and default to chapter 1
        const bookOnlyMatch = reference.match(/^([A-Za-z\s]+)$/);
        if (bookOnlyMatch) {
            const bookName = bookOnlyMatch[1].trim();
            // Only apply if it's a known book (to avoid false positives)
            const bookInfo = getBookInfo(bookName);
            if (bookInfo) {
                return {
                    book: bookName,
                    chapter: 1,
                    verseStart: 1,
                    verseEnd: null
                };
            }
        }

        return null;
    }

    const chapterNum = parseInt(match[2]);
    const verseStart = parseInt(match[3]);
    const verseEnd = match[4] ? parseInt(match[4]) : null;
    
    // Validate numbers are positive
    if (chapterNum < 1 || verseStart < 1) {
        console.warn(`[BookMapping] Invalid chapter or verse number (must be >= 1): "${reference}"`);
        return null;
    }
    
    // Validate verse range if present
    if (verseEnd !== null) {
        if (verseEnd < 1) {
            console.warn(`[BookMapping] Invalid verse end (must be >= 1): "${reference}"`);
            return null;
        }
        if (verseEnd < verseStart) {
            console.warn(`[BookMapping] Invalid verse range (reversed): "${reference}"`);
            return null;
        }
    }
    
    return {
        book: match[1].trim(),
        chapter: chapterNum,
        verseStart: verseStart,
        verseEnd: verseEnd
    };
}

// Book chapter limits for validation
const BOOK_CHAPTER_LIMITS = {
    'bereshit': 50,
    'shemot': 40,
    'vayikra': 27,
    'bamidbar': 36,
    'devarim': 34,
    'yehoshua': 24,
    'shoftim': 21,
    'shmuel1': 31,
    'shmuel2': 24,
    'melachim1': 22,
    'melachim2': 25,
    'yeshayahu': 66,
    'yirmeyahu': 52,
    'yechezkel': 48,
    'hoshea': 14,
    'yoel': 4,
    'amos': 9,
    'ovadya': 1,
    'yona': 4,
    'michah': 7,
    'nachum': 3,
    'chavakuk': 3,
    'tzefanya': 3,
    'chagai': 2,
    'zecharya': 14,
    'malachi': 3,
    'tehillim': 150,
    'mishlei': 31,
    'iyov': 42,
    'shir_hashirim': 8,
    'rut': 4,
    'eicha': 5,
    'kohelet': 12,
    'esther': 10,
    'daniel': 12,
    'ezra': 10,
    'nechemya': 13,
    'divrei_hayamim1': 29,
    'divrei_hayamim2': 36
};

/**
 * Generate internal reader link from Sefaria reference
 * @param {string} reference - Sefaria style reference like "Genesis 1:1" or "Exodus 12:1-10"
 * @returns {Promise<string|null>} - Internal link URL or null if not found
 */
export async function generateReaderLink(reference) {
    const parsed = parseReference(reference);
    if (!parsed) return null;

    const bookInfo = getBookInfo(parsed.book);
    if (!bookInfo) return null;

    // Validate chapter number
    if (parsed.chapter) {
        const maxChapters = BOOK_CHAPTER_LIMITS[bookInfo.id];
        if (maxChapters && (parsed.chapter < 1 || parsed.chapter > maxChapters)) {
            console.warn(`[BookMapping] Chapter ${parsed.chapter} is out of range for ${bookInfo.name} (1-${maxChapters})`);
            return null; // Invalid chapter number
        }
    }
    
    // Validate verse numbers if present (basic check)
    if (parsed.verseStart && parsed.verseStart < 1) {
        console.warn(`[BookMapping] Verse start ${parsed.verseStart} is invalid (must be >= 1)`);
        return null;
    }
    if (parsed.verseEnd && parsed.verseEnd < 1) {
        console.warn(`[BookMapping] Verse end ${parsed.verseEnd} is invalid (must be >= 1)`);
        return null;
    }
    if (parsed.verseStart && parsed.verseEnd && parsed.verseEnd < parsed.verseStart) {
        console.warn(`[BookMapping] Verse range is reversed: ${parsed.verseStart}-${parsed.verseEnd}`);
        return null;
    }
    
    // Validate verse numbers against actual book data if chapter and verses are specified
    if (parsed.chapter && parsed.verseStart) {
        try {
            const chapterData = await getChapter(bookInfo.category, bookInfo.id, parsed.chapter);
            if (chapterData && chapterData.chapter && chapterData.chapter.verses) {
                const verses = chapterData.chapter.verses;
                const maxVerse = verses.length > 0 ? verses[verses.length - 1].verse : 0;
                
                // Validate verse start
                if (parsed.verseStart > maxVerse) {
                    console.warn(`[BookMapping] Verse ${parsed.verseStart} is out of range for ${bookInfo.name} chapter ${parsed.chapter} (max: ${maxVerse})`);
                    return null;
                }
                
                // Validate verse end if present (same chapter)
                if (parsed.verseEnd && parsed.verseEnd > maxVerse) {
                    console.warn(`[BookMapping] Verse end ${parsed.verseEnd} is out of range for ${bookInfo.name} chapter ${parsed.chapter} (max: ${maxVerse})`);
                    return null;
                }
            }
        } catch (error) {
            // If we can't load the chapter data, continue anyway (might be network issue)
            console.warn(`[BookMapping] Could not validate verses against book data:`, error);
            // Don't fail the link generation, just skip verse validation
        }
    }

    // Build the URL - encode to handle special characters
    let url = `/reader.html?book=${encodeURIComponent(bookInfo.id)}&category=${encodeURIComponent(bookInfo.category)}`;
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
