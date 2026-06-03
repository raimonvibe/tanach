#!/usr/bin/env node

/**
 * Sefaria Importer - Import all Tanach books from Sefaria.org
 */

const fs = require('fs-extra');
const path = require('path');

class SefariaImporter {
    constructor() {
        this.baseUrl = 'https://www.sefaria.org/api/texts';
        this.booksDir = path.join(__dirname, '../data/books');
        
        // Mapping of Sefaria names to our IDs
        this.bookMapping = {
            // Torah
            'Genesis': 'bereshit',
            'Exodus': 'shemot', 
            'Leviticus': 'vayikra',
            'Numbers': 'bamidbar',
            'Deuteronomy': 'devarim',
            
            // Neviim
            'Joshua': 'yehoshua',
            'Judges': 'shoftim',
            'I Samuel': 'shmuel1',
            'II Samuel': 'shmuel2',
            'I Kings': 'melachim1',
            'II Kings': 'melachim2',
            'Isaiah': 'yeshayahu',
            'Jeremiah': 'yirmeyahu',
            'Ezekiel': 'yechezkel',
            'Hosea': 'hoshea',
            'Joel': 'yoel',
            'Amos': 'amos',
            'Obadiah': 'ovadya',
            'Jonah': 'yona',
            'Micah': 'michah',
            'Nahum': 'nachum',
            'Habakkuk': 'chavakuk',
            'Zephaniah': 'tzefanya',
            'Haggai': 'chagai',
            'Zechariah': 'zecharya',
            'Malachi': 'malachi',
            
            // Ketuvim
            'Psalms': 'tehillim',
            'Proverbs': 'mishlei',
            'Job': 'iyov',
            'Song of Songs': 'shir_hashirim',
            'Ruth': 'rut',
            'Lamentations': 'eicha',
            'Ecclesiastes': 'kohelet',
            'Esther': 'esther',
            'Daniel': 'daniel',
            'Ezra': 'ezra',
            'Nehemiah': 'nechemya',
            'I Chronicles': 'divrei_hayamim1',
            'II Chronicles': 'divrei_hayamim2'
        };
        
        
        this.categories = {
            torah: ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'],
            neviim: ['Joshua', 'Judges', 'I Samuel', 'II Samuel', 'I Kings', 'II Kings', 'Isaiah', 'Jeremiah', 'Ezekiel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'],
            ketuvim: ['Psalms', 'Proverbs', 'Job', 'Song of Songs', 'Ruth', 'Lamentations', 'Ecclesiastes', 'Esther', 'Daniel', 'Ezra', 'Nehemiah', 'I Chronicles', 'II Chronicles']
        };
    }

    /**
     * Import all books
     */
    async importAllBooks() {
        console.log('📚 SEFARIA IMPORTER');
        console.log('=' .repeat(50));
        console.log('Import all Tanach books from Sefaria.org\n');

        let totalBooks = 0;
        let totalChapters = 0;
        let totalVerses = 0;

        for (const [category, books] of Object.entries(this.categories)) {
            console.log(`\n📖 ${category.toUpperCase()}:`);
            
            for (const sefariaName of books) {
                const bookId = this.bookMapping[sefariaName];
                if (!bookId) {
                    console.log(`  ❌ ${sefariaName}: No mapping found`);
                    continue;
                }

                try {
                    console.log(`  📝 ${sefariaName} (${bookId})...`);
                    
                    const bookData = await this.importBook(sefariaName, bookId, category);
                    
                    if (bookData) {
                        totalBooks++;
                        totalChapters += bookData.chapters.length;
                        totalVerses += bookData.metadata.totalVerses;
                        console.log(`    ✅ ${bookData.chapters.length} chapters, ${bookData.metadata.totalVerses} verses`);
                    } else {
                        console.log(`    ⚠️  No data fetched`);
                    }
                    
                    // Short pause between books
                    await this.sleep(1000);
                    
                } catch (error) {
                    console.log(`    ❌ Error: ${error.message}`);
                }
            }
        }

        console.log('\n🎉 IMPORT COMPLETE!');
        console.log('=' .repeat(50));
        console.log(`📚 Total books: ${totalBooks}`);
        console.log(`📄 Total chapters: ${totalChapters}`);
        console.log(`📝 Total verses: ${totalVerses}`);
    }

    /**
     * Import a specific book
     */
    async importBook(sefariaName, bookId, category) {
        try {
            // Fetch book information
            const bookInfo = await this.fetchBookInfo(sefariaName);
            console.log(`    📊 Book info: ${bookInfo} chapters`);
            if (!bookInfo) {
                throw new Error('No book information found');
            }

            const chapters = [];
            let totalVerses = 0;

            // Import each chapter
            for (let chapterNum = 1; chapterNum <= bookInfo; chapterNum++) {
                try {
                    const chapterData = await this.fetchChapter(sefariaName, chapterNum);
                    if (chapterData && chapterData.length > 0) {
                        const verses = chapterData.map((verse, index) => ({
                            verse: index + 1,
                            translations: {
                                hebrew: verse.he || '',
                                english: verse.text || ''
                            }
                        }));

                        chapters.push({
                            chapter: chapterNum,
                            verses: verses
                        });

                        totalVerses += verses.length;
                        console.log(`      📄 Chapter ${chapterNum}: ${verses.length} verses`);
                    } else {
                        console.log(`      ⚠️  Chapter ${chapterNum}: No data`);
                    }
                } catch (error) {
                    console.log(`      ⚠️  Chapter ${chapterNum}: ${error.message}`);
                }
            }

            // Create book data
            const bookData = {
                id: bookId,
                name: this.getBookName(bookId),
                description: this.getBookDescription(bookId),
                sefariaRef: sefariaName,
                chapters: chapters,
                metadata: {
                    imported: new Date().toISOString(),
                    totalChapters: chapters.length,
                    totalVerses: totalVerses,
                    status: 'imported_sefaria',
                    notes: 'Imported from Sefaria.org (Hebrew and English).'
                }
            };

            // Save book
            await this.saveBook(bookData, category);

            return bookData;

        } catch (error) {
            throw new Error(`Import failed: ${error.message}`);
        }
    }

    /**
     * Fetch book information via Sefaria API
     */
    async fetchBookInfo(sefariaName) {
        try {
            // Use the Sefaria index API to get the structure
            const url = `https://www.sefaria.org/api/index/${sefariaName}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Sefaria returns the structure in schema.lengths
            if (data.schema && data.schema.lengths && data.schema.lengths.length > 0) {
                return data.schema.lengths[0]; // First element is the number of chapters
            }
            
            return 0;
            
        } catch (error) {
            throw new Error(`Could not fetch book info: ${error.message}`);
        }
    }

    /**
     * Fetch chapter
     */
    async fetchChapter(sefariaName, chapterNum) {
        try {
            const url = `${this.baseUrl}/${sefariaName}.${chapterNum}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Sefaria returns both Hebrew and English texts
            if (data.he && data.text && data.he.length > 0 && data.text.length > 0) {
                // Combine Hebrew and English
                return data.he.map((hebrewVerse, index) => ({
                    he: hebrewVerse,
                    text: data.text[index] || ''
                }));
            } else if (data.he && data.he.length > 0) {
                // Hebrew only
                return data.he.map(hebrewVerse => ({
                    he: hebrewVerse,
                    text: ''
                }));
            } else if (data.text && data.text.length > 0) {
                // English only
                return data.text.map(englishVerse => ({
                    he: '',
                    text: englishVerse
                }));
            } else if (Array.isArray(data)) {
                return data;
            } else {
                console.log(`      ⚠️  Chapter ${chapterNum}: No text found in data:`, Object.keys(data));
                return [];
            }
            
        } catch (error) {
            throw new Error(`Could not fetch chapter: ${error.message}`);
        }
    }

    /**
     * Save book
     */
    async saveBook(bookData, category) {
        const categoryDir = path.join(this.booksDir, category);
        await fs.ensureDir(categoryDir);
        
        const bookPath = path.join(categoryDir, `${bookData.id}.json`);
        await fs.writeJson(bookPath, bookData, { spaces: 2 });
    }

    /**
     * Get display name of book
     */
    getBookName(bookId) {
        const names = {
            'bereshit': 'Genesis',
            'shemot': 'Exodus',
            'vayikra': 'Leviticus',
            'bamidbar': 'Numbers',
            'devarim': 'Deuteronomy',
            'yehoshua': 'Joshua',
            'shoftim': 'Judges',
            'shmuel1': '1 Samuel',
            'shmuel2': '2 Samuel',
            'melachim1': '1 Kings',
            'melachim2': '2 Kings',
            'yeshayahu': 'Isaiah',
            'yirmeyahu': 'Jeremiah',
            'yechezkel': 'Ezekiel',
            'hoshea': 'Hosea',
            'yoel': 'Joel',
            'amos': 'Amos',
            'ovadya': 'Obadiah',
            'yona': 'Jonah',
            'michah': 'Micah',
            'nachum': 'Nahum',
            'chavakuk': 'Habakkuk',
            'tzefanya': 'Zephaniah',
            'chagai': 'Haggai',
            'zecharya': 'Zechariah',
            'malachi': 'Malachi',
            'tehillim': 'Psalms',
            'mishlei': 'Proverbs',
            'iyov': 'Job',
            'shir_hashirim': 'Song of Songs',
            'rut': 'Ruth',
            'eicha': 'Lamentations',
            'kohelet': 'Ecclesiastes',
            'esther': 'Esther',
            'daniel': 'Daniel',
            'ezra': 'Ezra',
            'nechemya': 'Nehemiah',
            'divrei_hayamim1': '1 Chronicles',
            'divrei_hayamim2': '2 Chronicles'
        };
        return names[bookId] || bookId;
    }

    /**
     * Get book description
     */
    getBookDescription(bookId) {
        const descriptions = {
            'bereshit': 'The book of beginnings',
            'shemot': 'The book of the Exodus',
            'vayikra': 'The book of laws',
            'bamidbar': 'The book of the wilderness',
            'devarim': 'The book of the repetition of the law',
            'tehillim': 'The book of psalms',
            'mishlei': 'The book of proverbs',
            'iyov': 'The book of Job'
        };
        return descriptions[bookId] || '';
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// CLI interface
if (require.main === module) {
    const importer = new SefariaImporter();
    
    const args = process.argv.slice(2);
    const command = args[0] || 'all';
    
    switch (command) {
        case 'all':
            importer.importAllBooks().catch(console.error);
            break;
            
        case 'book':
            if (args[1]) {
                const sefariaName = args[1];
                const bookId = importer.bookMapping[sefariaName];
                const category = Object.keys(importer.categories).find(cat => 
                    importer.categories[cat].includes(sefariaName)
                );
                
                if (bookId && category) {
                    importer.importBook(sefariaName, bookId, category).catch(console.error);
                } else {
                    console.log(`Unknown book: ${sefariaName}`);
                }
            } else {
                console.log('Usage: node sefaria-importer.js book <sefariaName>');
            }
            break;
            
        default:
            console.log(`
Usage:
  node sefaria-importer.js all                    # Import all books
  node sefaria-importer.js book <sefariaName>     # Import a specific book
            `);
    }
}

module.exports = SefariaImporter;
