const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { HebrewDate, HDate } = require('@hebcal/core');

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
        const categories = ['torah', 'neviim', 'trei_asara', 'ketuvim'];
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
        const categories = ['torah', 'neviim', 'trei_asara', 'ketuvim'];
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
        // Definieer de correcte volgorde van boeken per categorie volgens traditionele Joodse indeling
        const bookOrder = {
            torah: ['bereshit', 'shemot', 'vayikra', 'bamidbar', 'devarim'],
            neviim: [
                'yehoshua', 'shoftim', 'shmuel1', 'shmuel2', 'melachim1', 'melachim2',
                'yeshayahu', 'yirmeyahu', 'yechezkel'
            ],
            trei_asara: [
                'hoshea', 'yoel', 'amos', 'ovadya', 'yona', 'michah', 
                'nachum', 'chavakuk', 'tzefanya', 'chagai', 'zecharya', 'malachi'
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
                description: 'De profeten - Vroege en Late Profeten',
                books: []
            },
            trei_asara: {
                name: 'Trei Asara (תרי עשר)',
                description: 'De twaalf kleine profeten',
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

// Calendar API Routes

// Get calendar data for a specific month
app.get('/api/calendar/:year/:month', async (req, res) => {
    try {
        const { year, month } = req.params;
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        
        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return res.status(400).json({ error: 'Ongeldige datum parameters' });
        }

        // For now, return mock data
        // In production, you would integrate with HebCal API here
        const calendarData = await getCalendarData(yearNum, monthNum);
        res.json(calendarData);
        
    } catch (error) {
        console.error('Calendar API error:', error);
        res.status(500).json({ error: 'Kon kalender data niet laden' });
    }
});

// Get weekly Torah reading information
app.get('/api/calendar/weekly', async (req, res) => {
    try {
        // Mock data for weekly Torah reading
        const weeklyData = {
            parashat: 'Bereshit',
            haftarah: 'Yeshayahu 42:5-43:10',
            roshChodesh: null,
            specialShabbat: null
        };
        
        res.json(weeklyData);
        
    } catch (error) {
        console.error('Weekly API error:', error);
        res.status(500).json({ error: 'Kon week informatie niet laden' });
    }
});

// Get candle lighting and other times
app.get('/api/calendar/times', async (req, res) => {
    try {
        // Mock data for times
        // In production, you would calculate these based on location and date
        const timesData = {
            candleLighting: '18:30',
            havdalah: '19:30',
            sunrise: '07:15',
            sunset: '17:45',
            location: 'Amsterdam, Nederland'
        };
        
        res.json(timesData);
        
    } catch (error) {
        console.error('Times API error:', error);
        res.status(500).json({ error: 'Kon tijden niet laden' });
    }
});

// Get Hebrew date for a specific date
app.get('/api/calendar/hebrew-date/:year/:month/:day', async (req, res) => {
    try {
        const { year, month, day } = req.params;
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        const dayNum = parseInt(day);
        
        if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) {
            return res.status(400).json({ error: 'Ongeldige datum parameters' });
        }

        const date = new Date(yearNum, monthNum - 1, dayNum);
        const hebrewDate = getHebrewDate(date);
        
        const responseData = {
            gregorian: date.toLocaleDateString('nl-NL'),
            hebrew: hebrewDate
        };
        
        res.json(responseData);
        
    } catch (error) {
        console.error('Hebrew date API error:', error);
        res.status(500).json({ error: 'Kon Joodse datum niet berekenen' });
    }
});

// Helper function to generate calendar data
async function getCalendarData(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month - 1, daysInMonth);
    
    const days = [];
    const holidays = [];
    
    // Generate days for the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const hebrewDate = getHebrewDate(date);
        
        days.push({
            day: day,
            date: date.toISOString().split('T')[0],
            hebrewDate: hebrewDate,
            isToday: isToday(date),
            isShabbat: date.getDay() === 6,
            events: getDayEvents(date)
        });
    }
    
    // Add some mock holidays based on month
    if (month === 1) {
        holidays.push({
            day: 1,
            name: 'Nieuwjaar',
            type: 'holiday',
            description: 'Gregoriaans nieuwjaar'
        });
    }
    
    return {
        year: year,
        month: month,
        days: days,
        holidays: holidays,
        parashat: getWeeklyParashat(year, month)
    };
}

// Helper function to get Hebrew date (accurate)
function getHebrewDate(date) {
    try {
        // Use the @hebcal/core library
        const hDate = new HDate(date);
        
        const hebrewDay = hDate.getDate();
        const hebrewMonth = hDate.getMonthName();
        const hebrewYear = hDate.getFullYear();
        
        // Convert Hebrew month names to transliterated versions
        const hebrewMonthTransliterated = getHebrewMonthTransliterated(hebrewMonth);
        
        // Add Hebrew numerals for day
        const hebrewNumerals = [
            '', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י',
            'יא', 'יב', 'יג', 'יד', 'טו', 'טז', 'יז', 'יח', 'יט', 'כ',
            'כא', 'כב', 'כג', 'כד', 'כה', 'כו', 'כז', 'כח', 'כט', 'ל'
        ];
        
        const hebrewDayNumeral = hebrewNumerals[hebrewDay] || hebrewDay.toString();
        
        return {
            day: hebrewDay,
            month: hebrewMonthTransliterated,
            year: hebrewYear,
            dayNumeral: hebrewDayNumeral,
            display: `${hebrewDay} ${hebrewMonthTransliterated} ${hebrewYear}`,
            hebrewDisplay: `${hebrewDay} ${hebrewMonthTransliterated} ${hebrewYear}`
        };
    } catch (error) {
        console.error('Error calculating Hebrew date:', error);
        // Fallback to simplified calculation
        const hebrewMonths = [
            'Tishrei', 'Cheshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar',
            'Nisan', 'Iyar', 'Sivan', 'Tammuz', 'Av', 'Elul'
        ];
        
        const day = date.getDate();
        const month = hebrewMonths[date.getMonth()];
        const year = date.getFullYear() + 3760;
        
        return {
            day: day,
            month: month,
            year: year,
            dayNumeral: day.toString(),
            display: `${day} ${month} ${year}`,
            hebrewDisplay: `${day} ${month} ${year}`
        };
    }
}

// Helper function to convert Hebrew month names to transliterated versions
function getHebrewMonthTransliterated(hebrewMonth) {
    const monthMap = {
        'Tishrei': 'Tishrei',
        'Cheshvan': 'Cheshvan', 
        'Kislev': 'Kislev',
        'Tevet': 'Tevet',
        'Shevat': 'Shevat',
        'Adar': 'Adar',
        'Adar I': 'Adar Alef',
        'Adar II': 'Adar Bet',
        'Nisan': 'Nisan',
        'Iyar': 'Iyar',
        'Sivan': 'Sivan',
        'Tammuz': 'Tammuz',
        'Av': 'Av',
        'Elul': 'Elul'
    };
    return monthMap[hebrewMonth] || hebrewMonth;
}

// Helper function to check if date is today
function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

// Helper function to get events for a specific day
function getDayEvents(date) {
    const events = [];
    
    // Add Shabbat
    if (date.getDay() === 6) {
        events.push({
            name: 'Sjabbat',
            type: 'shabbat',
            description: 'Dag van rust'
        });
    }
    
    // Get Hebrew date to check for Jewish holidays
    const hebrewDate = getHebrewDate(date);
    
    // Add Rosh Chodesh (first day of Hebrew month)
    if (hebrewDate.day === 1) {
        events.push({
            name: 'Rosh Chodesh',
            type: 'roshChodesh',
            description: 'Nieuwe maan'
        });
    }
    
    // Add major Jewish holidays
    const holidays = getJewishHolidays(hebrewDate);
    events.push(...holidays);
    
    return events;
}

// Helper function to get Jewish holidays for a specific Hebrew date
function getJewishHolidays(hebrewDate) {
    const holidays = [];
    const { day, month, year } = hebrewDate;
    
    // Major holidays
    const holidayMap = {
        'Tishrei': {
            1: { name: 'Rosh Hashanah', type: 'holiday', description: 'Joods Nieuwjaar' },
            2: { name: 'Rosh Hashanah', type: 'holiday', description: 'Joods Nieuwjaar (dag 2)' },
            10: { name: 'Yom Kippur', type: 'holiday', description: 'Grote Verzoendag' },
            15: { name: 'Sukkot', type: 'holiday', description: 'Loofhuttenfeest' },
            16: { name: 'Sukkot', type: 'holiday', description: 'Loofhuttenfeest (dag 2)' },
            17: { name: 'Sukkot', type: 'holiday', description: 'Loofhuttenfeest (dag 3)' },
            18: { name: 'Sukkot', type: 'holiday', description: 'Loofhuttenfeest (dag 4)' },
            19: { name: 'Sukkot', type: 'holiday', description: 'Loofhuttenfeest (dag 5)' },
            20: { name: 'Sukkot', type: 'holiday', description: 'Loofhuttenfeest (dag 6)' },
            21: { name: 'Sukkot', type: 'holiday', description: 'Loofhuttenfeest (dag 7)' },
            22: { name: 'Shemini Atzeret', type: 'holiday', description: 'Slotfeest' },
            23: { name: 'Simchat Torah', type: 'holiday', description: 'Vreugde der Wet' }
        },
        'Kislev': {
            25: { name: 'Chanukah', type: 'holiday', description: 'Lichtfeest (dag 1)' },
            26: { name: 'Chanukah', type: 'holiday', description: 'Lichtfeest (dag 2)' },
            27: { name: 'Chanukah', type: 'holiday', description: 'Lichtfeest (dag 3)' },
            28: { name: 'Chanukah', type: 'holiday', description: 'Lichtfeest (dag 4)' },
            29: { name: 'Chanukah', type: 'holiday', description: 'Lichtfeest (dag 5)' }
        },
        'Tevet': {
            1: { name: 'Chanukah', type: 'holiday', description: 'Lichtfeest (dag 6)' },
            2: { name: 'Chanukah', type: 'holiday', description: 'Lichtfeest (dag 7)' },
            3: { name: 'Chanukah', type: 'holiday', description: 'Lichtfeest (dag 8)' },
            10: { name: 'Asara B\'Tevet', type: 'holiday', description: 'Vastendag' }
        },
        'Shevat': {
            15: { name: 'Tu B\'Shevat', type: 'holiday', description: 'Nieuwjaar der Bomen' }
        },
        'Adar': {
            14: { name: 'Purim', type: 'holiday', description: 'Lotfeest' },
            15: { name: 'Shushan Purim', type: 'holiday', description: 'Purim in ommuurde steden' }
        },
        'Nisan': {
            15: { name: 'Pesach', type: 'holiday', description: 'Pesach (dag 1)' },
            16: { name: 'Pesach', type: 'holiday', description: 'Pesach (dag 2)' },
            17: { name: 'Pesach', type: 'holiday', description: 'Pesach (dag 3)' },
            18: { name: 'Pesach', type: 'holiday', description: 'Pesach (dag 4)' },
            19: { name: 'Pesach', type: 'holiday', description: 'Pesach (dag 5)' },
            20: { name: 'Pesach', type: 'holiday', description: 'Pesach (dag 6)' },
            21: { name: 'Pesach', type: 'holiday', description: 'Pesach (dag 7)' },
            22: { name: 'Pesach', type: 'holiday', description: 'Pesach (dag 8)' }
        },
        'Iyar': {
            5: { name: 'Yom Ha\'Atzmaut', type: 'holiday', description: 'Onafhankelijkheidsdag' },
            18: { name: 'Lag B\'Omer', type: 'holiday', description: 'Feest van Rabbi Shimon' }
        },
        'Sivan': {
            6: { name: 'Shavuot', type: 'holiday', description: 'Wekenfeest (dag 1)' },
            7: { name: 'Shavuot', type: 'holiday', description: 'Wekenfeest (dag 2)' }
        },
        'Tammuz': {
            17: { name: 'Shiva Asar B\'Tammuz', type: 'holiday', description: 'Vastendag' }
        },
        'Av': {
            9: { name: 'Tisha B\'Av', type: 'holiday', description: 'Vastendag' },
            15: { name: 'Tu B\'Av', type: 'holiday', description: 'Liefdesfeest' }
        }
    };
    
    if (holidayMap[month] && holidayMap[month][day]) {
        holidays.push(holidayMap[month][day]);
    }
    
    return holidays;
}

// Helper function to get weekly parashat
function getWeeklyParashat(year, month) {
    const parashatList = [
        'Bereshit', 'Noach', 'Lech Lecha', 'Vayera', 'Chayei Sarah',
        'Toldot', 'Vayetzei', 'Vayishlach', 'Vayeshev', 'Miketz',
        'Vayigash', 'Vayechi', 'Shemot', 'Vaera', 'Bo',
        'Beshalach', 'Yitro', 'Mishpatim', 'Terumah', 'Tetzaveh',
        'Ki Tisa', 'Vayakhel', 'Pekudei', 'Vayikra', 'Tzav',
        'Shemini', 'Tazria', 'Metzora', 'Acharei Mot', 'Kedoshim',
        'Emor', 'Behar', 'Bechukotai', 'Bamidbar', 'Naso',
        'Behaalotecha', 'Shlach', 'Korach', 'Chukat', 'Balak',
        'Pinchas', 'Matot', 'Masei', 'Devarim', 'Vaetchanan',
        'Eikev', 'Reeh', 'Shoftim', 'Ki Teitzei', 'Ki Tavo',
        'Nitzavim', 'Vayelech', 'Haazinu', 'Vezot Haberacha'
    ];
    
    // Simple calculation - in reality this would be more complex
    const weekOfYear = Math.floor((new Date(year, month - 1, 1) - new Date(year, 0, 1)) / (7 * 24 * 60 * 60 * 1000));
    const parashatIndex = weekOfYear % parashatList.length;
    
    return parashatList[parashatIndex];
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Tanach Reader server draait op http://localhost:${PORT}`);
    console.log(`📚 Alle boeken zijn beschikbaar via de API`);
    console.log(`📅 Joodse kalender beschikbaar op /calendar.html`);
});

