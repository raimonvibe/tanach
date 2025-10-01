const express = require('express');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API Routes

// Get all books
app.get('/api/books', async (req, res) => {
    try {
        const booksDir = path.join(__dirname, 'data/books');
        const categories = ['torah', 'neviim', 'ketuvim'];
        const allBooks = [];

        for (const category of categories) {
            const categoryDir = path.join(booksDir, category);
            if (await fs.pathExists(categoryDir)) {
                const files = await fs.readdir(categoryDir);
                const jsonFiles = files.filter(file => file.endsWith('.json'));

                for (const file of jsonFiles) {
                    const bookPath = path.join(categoryDir, file);
                    const bookData = await fs.readJson(bookPath);
                    allBooks.push({
                        ...bookData,
                        category: category
                    });
                }
            }
        }

        res.json(allBooks);
    } catch (error) {
        res.status(500).json({ error: 'Kon boeken niet laden' });
    }
});

// Get books by category
app.get('/api/books/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const booksDir = path.join(__dirname, 'data/books', category);
        
        if (!await fs.pathExists(booksDir)) {
            return res.status(404).json({ error: 'Categorie niet gevonden' });
        }

        const files = await fs.readdir(booksDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        const books = [];

        for (const file of jsonFiles) {
            const bookPath = path.join(booksDir, file);
            const bookData = await fs.readJson(bookPath);
            books.push(bookData);
        }

        res.json(books);
    } catch (error) {
        res.status(500).json({ error: 'Kon boeken niet laden' });
    }
});

// Get specific book
app.get('/api/books/:category/:bookId', async (req, res) => {
    try {
        const { category, bookId } = req.params;
        const bookPath = path.join(__dirname, 'data/books', category, `${bookId}.json`);
        
        if (!await fs.pathExists(bookPath)) {
            return res.status(404).json({ error: 'Boek niet gevonden' });
        }

        const bookData = await fs.readJson(bookPath);
        res.json(bookData);
    } catch (error) {
        res.status(500).json({ error: 'Kon boek niet laden' });
    }
});

// Get specific chapter
app.get('/api/books/:category/:bookId/:chapter', async (req, res) => {
    try {
        const { category, bookId, chapter } = req.params;
        const bookPath = path.join(__dirname, 'data/books', category, `${bookId}.json`);
        
        if (!await fs.pathExists(bookPath)) {
            return res.status(404).json({ error: 'Boek niet gevonden' });
        }

        const bookData = await fs.readJson(bookPath);
        const chapterNum = parseInt(chapter);
        
        const chapterData = bookData.chapters.find(ch => ch.chapter === chapterNum);
        if (!chapterData) {
            return res.status(404).json({ error: 'Hoofstuk niet gevonden' });
        }

        res.json({
            book: {
                id: bookData.id,
                name: bookData.name,
                category: category
            },
            chapter: chapterData
        });
    } catch (error) {
        res.status(500).json({ error: 'Kon hoofdstuk niet laden' });
    }
});

// Search verses
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Zoekterm vereist' });
        }

        const booksDir = path.join(__dirname, 'data/books');
        const categories = ['torah', 'neviim', 'ketuvim'];
        const results = [];

        for (const category of categories) {
            const categoryDir = path.join(booksDir, category);
            if (await fs.pathExists(categoryDir)) {
                const files = await fs.readdir(categoryDir);
                const jsonFiles = files.filter(file => file.endsWith('.json'));

                for (const file of jsonFiles) {
                    const bookPath = path.join(categoryDir, file);
                    const bookData = await fs.readJson(bookPath);

                    for (const chapter of bookData.chapters) {
                        for (const verse of chapter.verses) {
                            const hebrewText = verse.translations.hebrew.toLowerCase();
                            const englishText = verse.translations.english.toLowerCase();
                            const searchTerm = q.toLowerCase();

                            if (hebrewText.includes(searchTerm) || englishText.includes(searchTerm)) {
                                results.push({
                                    book: {
                                        id: bookData.id,
                                        name: bookData.name,
                                        category: category
                                    },
                                    chapter: chapter.chapter,
                                    verse: verse.verse,
                                    text: {
                                        hebrew: verse.translations.hebrew,
                                        english: verse.translations.english
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Zoeken gefaald' });
    }
});

// Get Tanach structure
app.get('/api/structure', async (req, res) => {
    try {
        // Definieer de correcte volgorde van boeken per categorie
        const bookOrder = {
            torah: ['bereshit', 'shemot', 'vayikra', 'bamidbar', 'devarim'],
            neviim: [
                'yehoshua', 'shoftim', 'shmuel1', 'shmuel2', 'melachim1', 'melachim2',
                'yeshayahu', 'yirmeyahu', 'yechezkel', 'hoshea', 'yoel', 'amos',
                'ovadya', 'yona', 'michah', 'nachum', 'chavakuk', 'tzefanya',
                'chagai', 'zecharya', 'malachi'
            ],
            ketuvim: [
                'tehillim', 'mishlei', 'iyov', 'shir_hashirim', 'rut', 'eicha',
                'kohelet', 'esther', 'daniel', 'ezra', 'nechemya', 'divrei_hayamim1', 'divrei_hayamim2'
            ]
        };

        const structure = {
            torah: {
                name: 'Torah (תורה)',
                description: 'De vijf boeken van Mozes',
                books: []
            },
            neviim: {
                name: 'Neviim (נביאים)',
                description: 'De profeten',
                books: []
            },
            ketuvim: {
                name: 'Ketuvim (כתובים)',
                description: 'De geschriften',
                books: []
            }
        };

        const booksDir = path.join(__dirname, 'data/books');
        
        for (const category of Object.keys(structure)) {
            const categoryDir = path.join(booksDir, category);
            if (await fs.pathExists(categoryDir)) {
                // Laad boeken in de correcte volgorde
                for (const bookId of bookOrder[category]) {
                    const bookPath = path.join(categoryDir, `${bookId}.json`);
                    if (await fs.pathExists(bookPath)) {
                        const bookData = await fs.readJson(bookPath);
                        structure[category].books.push({
                            id: bookData.id,
                            name: bookData.name,
                            chapters: bookData.chapters.length
                        });
                    }
                }
            }
        }

        res.json(structure);
    } catch (error) {
        res.status(500).json({ error: 'Kon structuur niet laden' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Tanach Reader server draait op http://localhost:${PORT}`);
    console.log(`📚 Alle boeken zijn beschikbaar via de API`);
});

