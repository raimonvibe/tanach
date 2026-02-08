#!/usr/bin/env node

/**
 * Jewish Texts Importer - Import Talmud, Mishnah, and Rambam from Sefaria.org
 */

const fs = require('fs-extra');
const path = require('path');

class JewishTextsImporter {
    constructor() {
        this.baseUrl = 'https://www.sefaria.org/api';
        this.textsUrl = 'https://www.sefaria.org/api/texts';
        this.talmudDir = path.join(__dirname, '../data/talmud');
        this.mishnahDir = path.join(__dirname, '../data/mishnah');
        this.rambamDir = path.join(__dirname, '../data/rambam');

        // Babylonian Talmud - 63 tractates
        this.talmudTractates = [
            // Seder Zeraim
            'Berakhot',
            // Seder Moed
            'Shabbat', 'Eruvin', 'Pesachim', 'Shekalim', 'Yoma', 'Sukkah',
            'Beitzah', 'Rosh Hashanah', 'Taanit', 'Megillah', 'Moed Katan', 'Chagigah',
            // Seder Nashim
            'Yevamot', 'Ketubot', 'Nedarim', 'Nazir', 'Sotah', 'Gittin', 'Kiddushin',
            // Seder Nezikin
            'Bava Kamma', 'Bava Metzia', 'Bava Batra', 'Sanhedrin', 'Makkot',
            'Shevuot', 'Avodah Zarah', 'Horayot',
            // Seder Kodashim
            'Zevachim', 'Menachot', 'Chullin', 'Bekhorot', 'Arakhin', 'Temurah',
            'Keritot', 'Meilah', 'Tamid',
            // Seder Tahorot
            'Niddah'
        ];

        // Mishnah - 6 orders, 63 tractates
        this.mishnahOrders = {
            'Zeraim': ['Berakhot', 'Peah', 'Demai', 'Kilayim', 'Sheviit', 'Terumot',
                      'Maasrot', 'Maaser Sheni', 'Challah', 'Orlah', 'Bikkurim'],
            'Moed': ['Shabbat', 'Eruvin', 'Pesachim', 'Shekalim', 'Yoma', 'Sukkah',
                    'Beitzah', 'Rosh Hashanah', 'Taanit', 'Megillah', 'Moed Katan', 'Chagigah'],
            'Nashim': ['Yevamot', 'Ketubot', 'Nedarim', 'Nazir', 'Sotah', 'Gittin', 'Kiddushin'],
            'Nezikin': ['Bava Kamma', 'Bava Metzia', 'Bava Batra', 'Sanhedrin', 'Makkot',
                       'Shevuot', 'Eduyot', 'Avodah Zarah', 'Avot', 'Horayot'],
            'Kodashim': ['Zevachim', 'Menachot', 'Chullin', 'Bekhorot', 'Arakhin', 'Temurah',
                        'Keritot', 'Meilah', 'Tamid', 'Middot', 'Kinnim'],
            'Tahorot': ['Kelim', 'Oholot', 'Negaim', 'Parah', 'Tahorot', 'Mikvaot',
                       'Niddah', 'Makhshirin', 'Zavim', 'Tevul Yom', 'Yadayim', 'Uktzin']
        };

        // Rambam (Mishneh Torah) - Major treatises
        // Note: Mishneh Torah has 83 treatises organized in 14 books
        // We import the most commonly referenced treatises
        this.rambamBooks = [
            // Sefer Madda (Book of Knowledge)
            'Mishneh Torah, Foundations of the Torah',
            'Mishneh Torah, Human Dispositions',
            'Mishneh Torah, Torah Study',
            'Mishneh Torah, Foreign Worship and Customs of the Nations',
            'Mishneh Torah, Repentance',
            // Sefer Ahavah (Book of Love)
            'Mishneh Torah, Reading the Shema',
            'Mishneh Torah, Prayer and the Priestly Blessing',
            'Mishneh Torah, Tefillin, Mezuzah and the Torah Scroll',
            'Mishneh Torah, Fringes',
            'Mishneh Torah, Blessings',
            'Mishneh Torah, Circumcision',
            // Sefer Zemanim (Book of Times)
            'Mishneh Torah, Sabbath',
            'Mishneh Torah, Eruvin',
            'Mishneh Torah, Rest on the Tenth of Tishrei',
            'Mishneh Torah, Rest on a Holiday',
            'Mishneh Torah, Leavened and Unleavened Bread',
            'Mishneh Torah, Shofar, Sukkah and Lulav',
            'Mishneh Torah, Sheqel Dues',
            'Mishneh Torah, Sanctification of the New Month',
            'Mishneh Torah, Fasts',
            'Mishneh Torah, Scroll of Esther and Hanukkah',
            // Sefer Nashim (Book of Women)
            'Mishneh Torah, Marriage',
            'Mishneh Torah, Divorce',
            'Mishneh Torah, Virgin Maiden',
            'Mishneh Torah, Woman Suspected of Infidelity',
            // Sefer Kedushah (Book of Holiness)
            'Mishneh Torah, Forbidden Intercourse',
            'Mishneh Torah, Forbidden Foods',
            'Mishneh Torah, Ritual Slaughter',
            // Sefer Haflaah (Book of Utterances)
            'Mishneh Torah, Oaths',
            'Mishneh Torah, Vows',
            'Mishneh Torah, Nazariteship',
            'Mishneh Torah, Appraisals and Devoted Property',
            // Sefer Zeraim (Book of Seeds)
            'Mishneh Torah, Diverse Species',
            'Mishneh Torah, Gifts to the Poor',
            'Mishneh Torah, Heave Offerings',
            'Mishneh Torah, Tithes',
            'Mishneh Torah, Second Tithes and Fourth Year Produce',
            'Mishneh Torah, First Fruits and other Gifts to Priests',
            'Mishneh Torah, Sabbatical Year and the Jubilee',
            // Sefer Avodah (Book of Service)
            'Mishneh Torah, The Chosen Temple',
            'Mishneh Torah, Vessels of the Sanctuary',
            'Mishneh Torah, Entry into the Sanctuary',
            'Mishneh Torah, Things Forbidden on the Altar',
            'Mishneh Torah, The Order of Sacrifices',
            'Mishneh Torah, Daily Offerings and Additional Offerings',
            'Mishneh Torah, Sacrifices Rendered Unfit',
            'Mishneh Torah, Service on the Day of Atonement',
            'Mishneh Torah, Trespass',
            // Sefer Korbanot (Book of Sacrifices)
            'Mishneh Torah, Paschal Offering',
            'Mishneh Torah, Festival Offering',
            'Mishneh Torah, Firstlings',
            'Mishneh Torah, Offerings for Unintentional Transgressions',
            'Mishneh Torah, Offerings for Those with Incomplete Atonement',
            'Mishneh Torah, Substitution',
            // Sefer Taharah (Book of Purity)
            'Mishneh Torah, Defilement by a Corpse',
            'Mishneh Torah, Red Heifer',
            'Mishneh Torah, Defilement by Leprosy',
            'Mishneh Torah, Those Who Defile Bed or Seat',
            'Mishneh Torah, Other Sources of Defilement',
            'Mishneh Torah, Defilement of Foods',
            'Mishneh Torah, Vessels',
            'Mishneh Torah, Immersion Pools',
            // Sefer Nezikin (Book of Damages)
            'Mishneh Torah, Damages to Property',
            'Mishneh Torah, Theft',
            'Mishneh Torah, Robbery and Lost Property',
            'Mishneh Torah, One Who Injures a Person or Property',
            'Mishneh Torah, Murderer and the Preservation of Life',
            // Sefer Kinyan (Book of Acquisition)
            'Mishneh Torah, Sales',
            'Mishneh Torah, Ownerless Property and Gifts',
            'Mishneh Torah, Neighbors',
            'Mishneh Torah, Agents and Partners',
            'Mishneh Torah, Slaves',
            // Sefer Mishpatim (Book of Judgments)
            'Mishneh Torah, Hiring',
            'Mishneh Torah, Borrowing and Deposit',
            'Mishneh Torah, Creditor and Debtor',
            'Mishneh Torah, Plaintiff and Defendant',
            'Mishneh Torah, Inheritances',
            // Sefer Shofetim (Book of Judges)
            'Mishneh Torah, The Sanhedrin and the Penalties within Their Jurisdiction',
            'Mishneh Torah, Testimony',
            'Mishneh Torah, Rebels',
            'Mishneh Torah, Mourning',
            'Mishneh Torah, Kings and Wars'
        ];
    }

    /**
     * Import all Talmud tractates
     */
    async importAllTalmud() {
        console.log('📚 TALMUD IMPORTER');
        console.log('='.repeat(50));
        console.log('Importeer Babylonische Talmud uit Sefaria.org\n');

        let totalTractates = 0;
        let totalPages = 0;

        for (const tractate of this.talmudTractates) {
            try {
                console.log(`\n📖 ${tractate}...`);
                const tractateData = await this.importTalmudTractate(tractate);

                if (tractateData) {
                    totalTractates++;
                    totalPages += tractateData.metadata.totalPages;
                    console.log(`  ✅ ${tractateData.metadata.totalPages} bladzijden (dapim)`);
                } else {
                    console.log(`  ⚠️  Geen data opgehaald`);
                }

                await this.sleep(1000);

            } catch (error) {
                console.log(`  ❌ Fout: ${error.message}`);
            }
        }

        console.log('\n🎉 TALMUD IMPORT VOLTOOID!');
        console.log('='.repeat(50));
        console.log(`📚 Totaal tractaten: ${totalTractates}`);
        console.log(`📄 Totaal bladzijden: ${totalPages}`);
    }

    /**
     * Import a single Talmud tractate
     */
    async importTalmudTractate(tractateName) {
        try {
            const tractateId = tractateName.toLowerCase().replace(/ /g, '_');
            const sefariaRef = `${tractateName}`;

            // Get tractate info
            const indexUrl = `${this.baseUrl}/index/${sefariaRef}`;
            const response = await fetch(indexUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const indexData = await response.json();

            // Get total pages from schema
            const totalPages = indexData.schema && indexData.schema.lengths ? indexData.schema.lengths[0] : 0;
            console.log(`  📊 Totaal bladzijden: ${totalPages}`);

            const pages = [];

            // Import each page (daf)
            // Talmud uses format like "Berakhot 2a", "Berakhot 2b", etc.
            let lastSuccessfulPage = null;
            let consecutiveFailures = 0;

            for (let pageNum = 2; pageNum <= totalPages + 2; pageNum++) {
                for (const side of ['a', 'b']) {
                    try {
                        const ref = `${tractateName} ${pageNum}${side}`;
                        const pageData = await this.fetchTalmudPage(ref);

                        if (pageData) {
                            pages.push({
                                page: `${pageNum}${side}`,
                                pageNumber: pageNum,
                                side: side,
                                content: {
                                    hebrew: pageData.he || '',
                                    english: pageData.text || ''
                                }
                            });
                            console.log(`    📄 Bladzijde ${pageNum}${side} ✓`);
                            lastSuccessfulPage = `${pageNum}${side}`;
                            consecutiveFailures = 0;
                        } else {
                            // Page doesn't exist or has no content
                            console.log(`    ⏭️  Bladzijde ${pageNum}${side} (bestaat niet)`);
                            consecutiveFailures++;

                            // If we've had 3 consecutive failures, the tractate likely ends
                            if (consecutiveFailures >= 3) {
                                console.log(`    ℹ️  Tractaat eindigt waarschijnlijk bij ${lastSuccessfulPage}`);
                                break;
                            }
                        }
                    } catch (error) {
                        console.log(`    ⚠️  Bladzijde ${pageNum}${side}: ${error.message}`);
                        consecutiveFailures++;

                        // Stop if too many errors in a row
                        if (consecutiveFailures >= 3) {
                            console.log(`    ℹ️  Te veel fouten, stoppen bij ${pageNum}${side}`);
                            break;
                        }
                    }
                }

                // Break outer loop if we broke inner loop
                if (consecutiveFailures >= 3) {
                    break;
                }
            }

            const tractateData = {
                id: tractateId,
                name: tractateName,
                type: 'talmud',
                sefariaRef: sefariaRef,
                pages: pages,
                metadata: {
                    imported: new Date().toISOString(),
                    totalPages: pages.length,
                    status: 'imported_sefaria'
                }
            };

            // Save tractate
            await this.saveTalmudTractate(tractateData);

            return tractateData;

        } catch (error) {
            throw new Error(`Import gefaald: ${error.message}`);
        }
    }

    /**
     * Fetch a single Talmud page with retry logic
     */
    async fetchTalmudPage(ref, retries = 2) {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const url = `${this.textsUrl}/${encodeURIComponent(ref)}`;
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                // Check if API returned an error (like "ends at Daf X")
                if (data.error) {
                    return null; // Page doesn't exist
                }

                // Validate that we have actual content
                const hebrew = Array.isArray(data.he) ? data.he.join('\n') : (data.he || '');
                const english = Array.isArray(data.text) ? data.text.join('\n') : (data.text || '');

                // Check if content is meaningful (more than just whitespace)
                const hasContent = (hebrew && hebrew.trim().length > 10) ||
                                 (english && english.trim().length > 10);

                if (!hasContent) {
                    return null; // Empty or invalid content
                }

                return {
                    he: hebrew,
                    text: english
                };

            } catch (error) {
                if (attempt < retries) {
                    // Retry after a short delay
                    await this.sleep(1000 * (attempt + 1));
                    continue;
                } else {
                    throw new Error(`Kon bladzijde niet ophalen: ${error.message}`);
                }
            }
        }
    }

    /**
     * Save Talmud tractate
     */
    async saveTalmudTractate(tractateData) {
        await fs.ensureDir(this.talmudDir);
        const filePath = path.join(this.talmudDir, `${tractateData.id}.json`);
        await fs.writeJson(filePath, tractateData, { spaces: 2 });
    }

    /**
     * Import all Mishnah
     */
    async importAllMishnah() {
        console.log('📚 MISHNAH IMPORTER');
        console.log('='.repeat(50));
        console.log('Importeer Mishnah uit Sefaria.org\n');

        let totalTractates = 0;
        let totalChapters = 0;

        for (const [order, tractates] of Object.entries(this.mishnahOrders)) {
            console.log(`\n📂 ${order}:`);

            for (const tractate of tractates) {
                try {
                    console.log(`  📖 Mishnah ${tractate}...`);
                    const tractateData = await this.importMishnahTractate(tractate);

                    if (tractateData) {
                        totalTractates++;
                        totalChapters += tractateData.chapters.length;
                        console.log(`    ✅ ${tractateData.chapters.length} hoofdstukken`);
                    } else {
                        console.log(`    ⚠️  Geen data opgehaald`);
                    }

                    await this.sleep(1000);

                } catch (error) {
                    console.log(`    ❌ Fout: ${error.message}`);
                }
            }
        }

        console.log('\n🎉 MISHNAH IMPORT VOLTOOID!');
        console.log('='.repeat(50));
        console.log(`📚 Totaal tractaten: ${totalTractates}`);
        console.log(`📄 Totaal hoofdstukken: ${totalChapters}`);
    }

    /**
     * Import a single Mishnah tractate
     */
    async importMishnahTractate(tractateName) {
        try {
            const tractateId = tractateName.toLowerCase().replace(/ /g, '_');
            const sefariaRef = `Mishnah ${tractateName}`;

            // Get tractate info
            const indexUrl = `${this.baseUrl}/index/${encodeURIComponent(sefariaRef)}`;
            const response = await fetch(indexUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const indexData = await response.json();
            const totalChapters = indexData.schema && indexData.schema.lengths ? indexData.schema.lengths[0] : 0;
            console.log(`    📊 Totaal hoofdstukken: ${totalChapters}`);

            const chapters = [];

            // Import each chapter
            for (let chapterNum = 1; chapterNum <= totalChapters; chapterNum++) {
                try {
                    const ref = `${sefariaRef} ${chapterNum}`;
                    const chapterData = await this.fetchMishnahChapter(ref);

                    if (chapterData && chapterData.length > 0) {
                        const mishnayot = chapterData.map((mishnah, index) => ({
                            mishnah: index + 1,
                            translations: {
                                hebrew: mishnah.he || '',
                                english: mishnah.text || ''
                            }
                        }));

                        chapters.push({
                            chapter: chapterNum,
                            mishnayot: mishnayot
                        });

                        console.log(`      📄 Hoofdstuk ${chapterNum}: ${mishnayot.length} mishnayot`);
                    }
                } catch (error) {
                    console.log(`      ⚠️  Hoofdstuk ${chapterNum}: ${error.message}`);
                }
            }

            const tractateData = {
                id: tractateId,
                name: tractateName,
                type: 'mishnah',
                sefariaRef: sefariaRef,
                chapters: chapters,
                metadata: {
                    imported: new Date().toISOString(),
                    totalChapters: chapters.length,
                    status: 'imported_sefaria'
                }
            };

            // Save tractate
            await this.saveMishnahTractate(tractateData);

            return tractateData;

        } catch (error) {
            throw new Error(`Import gefaald: ${error.message}`);
        }
    }

    /**
     * Fetch a Mishnah chapter with retry logic
     */
    async fetchMishnahChapter(ref, retries = 2) {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const url = `${this.textsUrl}/${encodeURIComponent(ref)}`;
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                // Check for API error
                if (data.error) {
                    return null;
                }

                if (data.he && data.text && data.he.length > 0) {
                    return data.he.map((hebrewText, index) => ({
                        he: hebrewText || '',
                        text: data.text[index] || ''
                    }));
                }

                return [];

            } catch (error) {
                if (attempt < retries) {
                    await this.sleep(1000 * (attempt + 1));
                    continue;
                } else {
                    throw new Error(`Kon hoofdstuk niet ophalen: ${error.message}`);
                }
            }
        }
    }

    /**
     * Save Mishnah tractate
     */
    async saveMishnahTractate(tractateData) {
        await fs.ensureDir(this.mishnahDir);
        const filePath = path.join(this.mishnahDir, `${tractateData.id}.json`);
        await fs.writeJson(filePath, tractateData, { spaces: 2 });
    }

    /**
     * Import all Rambam books
     */
    async importAllRambam() {
        console.log('📚 RAMBAM IMPORTER');
        console.log('='.repeat(50));
        console.log('Importeer Mishneh Torah uit Sefaria.org\n');

        let totalBooks = 0;
        let totalChapters = 0;

        for (const book of this.rambamBooks) {
            try {
                console.log(`\n📖 ${book}...`);
                const bookData = await this.importRambamBook(book);

                if (bookData) {
                    totalBooks++;
                    totalChapters += bookData.chapters.length;
                    console.log(`  ✅ ${bookData.chapters.length} hoofdstukken`);
                } else {
                    console.log(`  ⚠️  Geen data opgehaald`);
                }

                await this.sleep(1000);

            } catch (error) {
                console.log(`  ❌ Fout: ${error.message}`);
            }
        }

        console.log('\n🎉 RAMBAM IMPORT VOLTOOID!');
        console.log('='.repeat(50));
        console.log(`📚 Totaal boeken: ${totalBooks}`);
        console.log(`📄 Totaal hoofdstukken: ${totalChapters}`);
    }

    /**
     * Import a Rambam book
     */
    async importRambamBook(bookName) {
        try {
            const bookId = bookName.toLowerCase().replace(/mishneh torah, /g, '').replace(/ /g, '_').replace(/'/g, '');
            const sefariaRef = bookName;

            // Get book structure
            const indexUrl = `${this.baseUrl}/index/${encodeURIComponent(sefariaRef)}`;
            const response = await fetch(indexUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const indexData = await response.json();

            // Check for API error
            if (indexData.error) {
                throw new Error(indexData.error);
            }

            // Rambam has 2-level structure: Chapter (Perek) and Halakhah
            // schema.lengths[0] tells us how many chapters
            const totalChapters = indexData.schema && indexData.schema.lengths ? indexData.schema.lengths[0] : 0;
            console.log(`  📊 Totaal hoofdstukken: ${totalChapters}`);

            const chapters = [];

            // Import each chapter
            for (let chapterNum = 1; chapterNum <= totalChapters; chapterNum++) {
                try {
                    const ref = `${sefariaRef} ${chapterNum}`;
                    const chapterData = await this.fetchRambamChapter(ref);

                    if (chapterData && chapterData.length > 0) {
                        const halakhot = chapterData.map((halakha, index) => ({
                            halakha: index + 1,
                            translations: {
                                hebrew: halakha.he || '',
                                english: halakha.text || ''
                            }
                        }));

                        chapters.push({
                            chapter: chapterNum,
                            halakhot: halakhot
                        });

                        console.log(`    📄 Hoofdstuk ${chapterNum}: ${halakhot.length} halakhot`);
                    }
                } catch (error) {
                    console.log(`    ⚠️  Hoofdstuk ${chapterNum}: ${error.message}`);
                }
            }

            const bookData = {
                id: bookId,
                name: bookName,
                type: 'rambam',
                sefariaRef: sefariaRef,
                chapters: chapters,
                metadata: {
                    imported: new Date().toISOString(),
                    totalChapters: chapters.length,
                    status: 'imported_sefaria'
                }
            };

            // Save book
            await this.saveRambamBook(bookData);

            return bookData;

        } catch (error) {
            throw new Error(`Import gefaald: ${error.message}`);
        }
    }

    /**
     * Fetch a Rambam chapter with retry logic
     */
    async fetchRambamChapter(ref, retries = 2) {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const url = `${this.textsUrl}/${encodeURIComponent(ref)}`;
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                // Check for API error
                if (data.error) {
                    return null;
                }

                // Rambam chapters return arrays of halakhot
                if (data.he && data.text && data.he.length > 0) {
                    return data.he.map((hebrewText, index) => ({
                        he: hebrewText || '',
                        text: data.text[index] || ''
                    }));
                }

                return [];

            } catch (error) {
                if (attempt < retries) {
                    await this.sleep(1000 * (attempt + 1));
                    continue;
                } else {
                    throw new Error(`Kon hoofdstuk niet ophalen: ${error.message}`);
                }
            }
        }
    }

    /**
     * Save Rambam book
     */
    async saveRambamBook(bookData) {
        await fs.ensureDir(this.rambamDir);
        const filePath = path.join(this.rambamDir, `${bookData.id}.json`);
        await fs.writeJson(filePath, bookData, { spaces: 2 });
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
    const importer = new JewishTextsImporter();

    const args = process.argv.slice(2);
    const command = args[0] || 'help';

    switch (command) {
        case 'talmud':
            importer.importAllTalmud().catch(console.error);
            break;

        case 'mishnah':
            importer.importAllMishnah().catch(console.error);
            break;

        case 'rambam':
            importer.importAllRambam().catch(console.error);
            break;

        case 'all':
            (async () => {
                await importer.importAllTalmud();
                await importer.importAllMishnah();
                await importer.importAllRambam();
            })().catch(console.error);
            break;

        default:
            console.log(`
Gebruik:
  node jewish-texts-importer.js talmud     # Importeer Babylonische Talmud
  node jewish-texts-importer.js mishnah    # Importeer Mishnah
  node jewish-texts-importer.js rambam     # Importeer Rambam (Mishneh Torah)
  node jewish-texts-importer.js all        # Importeer alles
            `);
    }
}

module.exports = JewishTextsImporter;
