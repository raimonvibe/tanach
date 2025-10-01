#!/usr/bin/env node

/**
 * Sefaria Importer - Importeer alle boeken van de Tanach uit Sefaria.org
 */

const fs = require('fs-extra');
const path = require('path');

class SefariaImporter {
    constructor() {
        this.baseUrl = 'https://www.sefaria.org/api/texts';
        this.booksDir = path.join(__dirname, '../data/books');
        
        // Mapping van Sefaria namen naar onze IDs
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
     * Importeer alle boeken
     */
    async importAllBooks() {
        console.log('📚 SEFARIA IMPORTER');
        console.log('=' .repeat(50));
        console.log('Importeer alle boeken van de Tanach uit Sefaria.org\n');

        let totalBooks = 0;
        let totalChapters = 0;
        let totalVerses = 0;

        for (const [category, books] of Object.entries(this.categories)) {
            console.log(`\n📖 ${category.toUpperCase()}:`);
            
            for (const sefariaName of books) {
                const bookId = this.bookMapping[sefariaName];
                if (!bookId) {
                    console.log(`  ❌ ${sefariaName}: Geen mapping gevonden`);
                    continue;
                }

                try {
                    console.log(`  📝 ${sefariaName} (${bookId})...`);
                    
                    const bookData = await this.importBook(sefariaName, bookId, category);
                    
                    if (bookData) {
                        totalBooks++;
                        totalChapters += bookData.chapters.length;
                        totalVerses += bookData.metadata.totalVerses;
                        console.log(`    ✅ ${bookData.chapters.length} hoofdstukken, ${bookData.metadata.totalVerses} verzen`);
                    } else {
                        console.log(`    ⚠️  Geen data opgehaald`);
                    }
                    
                    // Korte pauze tussen boeken
                    await this.sleep(1000);
                    
                } catch (error) {
                    console.log(`    ❌ Fout: ${error.message}`);
                }
            }
        }

        console.log('\n🎉 IMPORT VOLTOOID!');
        console.log('=' .repeat(50));
        console.log(`📚 Totaal boeken: ${totalBooks}`);
        console.log(`📄 Totaal hoofdstukken: ${totalChapters}`);
        console.log(`📝 Totaal verzen: ${totalVerses}`);
    }

    /**
     * Importeer een specifiek boek
     */
    async importBook(sefariaName, bookId, category) {
        try {
            // Haal boek informatie op
            const bookInfo = await this.fetchBookInfo(sefariaName);
            console.log(`    📊 Boek info: ${bookInfo} hoofdstukken`);
            if (!bookInfo) {
                throw new Error('Geen boek informatie gevonden');
            }

            const chapters = [];
            let totalVerses = 0;

            // Importeer elk hoofdstuk
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
                        console.log(`      📄 Hoofdstuk ${chapterNum}: ${verses.length} verzen`);
                    } else {
                        console.log(`      ⚠️  Hoofdstuk ${chapterNum}: Geen data`);
                    }
                } catch (error) {
                    console.log(`      ⚠️  Hoofdstuk ${chapterNum}: ${error.message}`);
                }
            }

            // Maak boek data
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

            // Sla boek op
            await this.saveBook(bookData, category);

            return bookData;

        } catch (error) {
            throw new Error(`Import gefaald: ${error.message}`);
        }
    }

    /**
     * Haal boek informatie op via Sefaria API
     */
    async fetchBookInfo(sefariaName) {
        try {
            // Gebruik de Sefaria index API om de structuur te krijgen
            const url = `https://www.sefaria.org/api/index/${sefariaName}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Sefaria geeft de structuur terug in schema.lengths
            if (data.schema && data.schema.lengths && data.schema.lengths.length > 0) {
                return data.schema.lengths[0]; // Eerste element is aantal hoofdstukken
            }
            
            return 0;
            
        } catch (error) {
            throw new Error(`Kon boek info niet ophalen: ${error.message}`);
        }
    }

    /**
     * Haal hoofdstuk op
     */
    async fetchChapter(sefariaName, chapterNum) {
        try {
            const url = `${this.baseUrl}/${sefariaName}.${chapterNum}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Sefaria geeft zowel Hebreeuwse als Engelse teksten terug
            if (data.he && data.text && data.he.length > 0 && data.text.length > 0) {
                // Combineer Hebreeuws en Engels
                return data.he.map((hebrewVerse, index) => ({
                    he: hebrewVerse,
                    text: data.text[index] || ''
                }));
            } else if (data.he && data.he.length > 0) {
                // Alleen Hebreeuws
                return data.he.map(hebrewVerse => ({
                    he: hebrewVerse,
                    text: ''
                }));
            } else if (data.text && data.text.length > 0) {
                // Alleen Engels
                return data.text.map(englishVerse => ({
                    he: '',
                    text: englishVerse
                }));
            } else if (Array.isArray(data)) {
                return data;
            } else {
                console.log(`      ⚠️  Hoofdstuk ${chapterNum}: Geen tekst gevonden in data:`, Object.keys(data));
                return [];
            }
            
        } catch (error) {
            throw new Error(`Kon hoofdstuk niet ophalen: ${error.message}`);
        }
    }

    /**
     * Sla boek op
     */
    async saveBook(bookData, category) {
        const categoryDir = path.join(this.booksDir, category);
        await fs.ensureDir(categoryDir);
        
        const bookPath = path.join(categoryDir, `${bookData.id}.json`);
        await fs.writeJson(bookPath, bookData, { spaces: 2 });
    }

    /**
     * Krijg Nederlandse naam van boek
     */
    getBookName(bookId) {
        const names = {
            'bereshit': 'Genesis',
            'shemot': 'Exodus',
            'vayikra': 'Leviticus',
            'bamidbar': 'Numeri',
            'devarim': 'Deuteronomium',
            'yehoshua': 'Jozua',
            'shoftim': 'Richteren',
            'shmuel1': '1 Samuël',
            'shmuel2': '2 Samuël',
            'melachim1': '1 Koningen',
            'melachim2': '2 Koningen',
            'yeshayahu': 'Jesaja',
            'yirmeyahu': 'Jeremia',
            'yechezkel': 'Ezechiël',
            'hoshea': 'Hosea',
            'yoel': 'Joël',
            'amos': 'Amos',
            'ovadya': 'Obadja',
            'yona': 'Jona',
            'michah': 'Micha',
            'nachum': 'Nahum',
            'chavakuk': 'Habakuk',
            'tzefanya': 'Sefanja',
            'chagai': 'Haggai',
            'zecharya': 'Zacharia',
            'malachi': 'Maleachi',
            'tehillim': 'Psalmen',
            'mishlei': 'Spreuken',
            'iyov': 'Job',
            'shir_hashirim': 'Hooglied',
            'rut': 'Ruth',
            'eicha': 'Klaagliederen',
            'kohelet': 'Prediker',
            'esther': 'Esther',
            'daniel': 'Daniël',
            'ezra': 'Ezra',
            'nechemya': 'Nehemia',
            'divrei_hayamim1': '1 Kronieken',
            'divrei_hayamim2': '2 Kronieken'
        };
        return names[bookId] || bookId;
    }

    /**
     * Krijg beschrijving van boek
     */
    getBookDescription(bookId) {
        const descriptions = {
            'bereshit': 'Het boek van het begin',
            'shemot': 'Het boek van de uittocht',
            'vayikra': 'Het boek van de wetten',
            'bamidbar': 'Het boek van de woestijn',
            'devarim': 'Het boek van de herhaling van de wet',
            'tehillim': 'Het boek van de psalmen',
            'mishlei': 'Het boek van de spreuken',
            'iyov': 'Het boek van Job'
        };
        return descriptions[bookId] || '';
    }

    /**
     * Sleep functie
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
                    console.log(`Onbekend boek: ${sefariaName}`);
                }
            } else {
                console.log('Gebruik: node sefaria-importer.js book <sefariaName>');
            }
            break;
            
        default:
            console.log(`
Gebruik:
  node sefaria-importer.js all                    # Importeer alle boeken
  node sefaria-importer.js book <sefariaName>     # Importeer specifiek boek
            `);
    }
}

module.exports = SefariaImporter;
