#!/usr/bin/env node

/**
 * Sefer HaMitzvot Importer - Import Sefer HaMitzvot (Positive and Negative Commandments) from Sefaria.org
 * This is a separate work by Rambam, not part of Mishneh Torah
 */

const fs = require('fs-extra');
const path = require('path');

class SeferHaMitzvotImporter {
    constructor() {
        this.baseUrl = 'https://www.sefaria.org/api';
        this.textsUrl = 'https://www.sefaria.org/api/texts';
        this.rambamDir = path.join(__dirname, '../data/rambam');
        
        // Sefer HaMitzvot has two parts
        this.seferHaMitzvotBooks = [
            'Sefer HaMitzvot, Positive Commandments',
            'Sefer HaMitzvot, Negative Commandments'
        ];
    }

    /**
     * Import all Sefer HaMitzvot books
     */
    async importAll() {
        console.log('📚 SEFER HAMITZVOT IMPORTER');
        console.log('='.repeat(50));
        console.log('Importeer Sefer HaMitzvot uit Sefaria.org\n');
        console.log('Dit is een apart werk van Rambam (niet onderdeel van Mishneh Torah)\n');

        let totalBooks = 0;
        let totalMitzvot = 0;

        for (const book of this.seferHaMitzvotBooks) {
            try {
                console.log(`\n📖 ${book}...`);
                const bookData = await this.importBook(book);

                if (bookData) {
                    totalBooks++;
                    totalMitzvot += bookData.mitzvot.length;
                    console.log(`  ✅ ${bookData.mitzvot.length} mitzvot geïmporteerd`);
                } else {
                    console.log(`  ⚠️  Geen data opgehaald`);
                }

                await this.sleep(1000);

            } catch (error) {
                console.log(`  ❌ Fout: ${error.message}`);
            }
        }

        console.log('\n🎉 SEFER HAMITZVOT IMPORT VOLTOOID!');
        console.log('='.repeat(50));
        console.log(`📚 Totaal boeken: ${totalBooks}`);
        console.log(`📄 Totaal mitzvot: ${totalMitzvot}`);
    }

    /**
     * Import a Sefer HaMitzvot book
     */
    async importBook(bookName) {
        try {
            // Create file ID: "Sefer HaMitzvot, Positive Commandments" -> "sefer_hamitzvot_positive_commandments"
            const bookId = bookName.toLowerCase()
                .replace(/sefer hamitzvot, /g, '')
                .replace(/ /g, '_')
                .replace(/'/g, '');
            
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

            // Sefer HaMitzvot structure: Each mitzvah is numbered (1-248 for positive, 1-365 for negative)
            // The structure might be flat or organized by chapters
            const totalMitzvot = indexData.schema && indexData.schema.lengths ? indexData.schema.lengths[0] : 0;
            console.log(`  📊 Totaal mitzvot: ${totalMitzvot}`);

            const mitzvot = [];

            // Import each mitzvah
            for (let mitzvahNum = 1; mitzvahNum <= totalMitzvot; mitzvahNum++) {
                try {
                    const ref = `${sefariaRef}.${mitzvahNum}`;
                    const mitzvahData = await this.fetchMitzvah(ref);

                    if (mitzvahData) {
                        mitzvot.push({
                            mitzvah: mitzvahNum,
                            translations: {
                                hebrew: mitzvahData.he || '',
                                english: mitzvahData.text || ''
                            }
                        });

                        if (mitzvahNum % 50 === 0) {
                            console.log(`    📄 Mitzvah ${mitzvahNum}...`);
                        }
                    }
                } catch (error) {
                    console.log(`    ⚠️  Mitzvah ${mitzvahNum}: ${error.message}`);
                }
            }

            const bookData = {
                id: bookId,
                name: bookName,
                type: 'sefer_hamitzvot',
                sefariaRef: sefariaRef,
                mitzvot: mitzvot,
                metadata: {
                    imported: new Date().toISOString(),
                    totalMitzvot: mitzvot.length,
                    status: 'imported_sefaria'
                }
            };

            // Save book
            await this.saveBook(bookData);

            console.log(`  ✅ ${mitzvot.length} mitzvot geïmporteerd`);
            return bookData;

        } catch (error) {
            throw new Error(`Import gefaald: ${error.message}`);
        }
    }

    /**
     * Fetch a single mitzvah with retry logic
     */
    async fetchMitzvah(ref, retries = 2) {
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

                // Sefer HaMitzvot returns text directly
                if (data.he && data.text) {
                    return {
                        he: data.he || '',
                        text: data.text || ''
                    };
                }

                // Sometimes it's an array
                if (Array.isArray(data.he) && Array.isArray(data.text)) {
                    return {
                        he: data.he.join('\n') || '',
                        text: data.text.join('\n') || ''
                    };
                }

                return null;

            } catch (error) {
                if (attempt < retries) {
                    await this.sleep(1000 * (attempt + 1));
                    continue;
                } else {
                    throw new Error(`Kon mitzvah niet ophalen: ${error.message}`);
                }
            }
        }
    }

    /**
     * Save Sefer HaMitzvot book
     */
    async saveBook(bookData) {
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

// Main execution
async function main() {
    const importer = new SeferHaMitzvotImporter();
    
    try {
        await importer.importAll();
        
        console.log('\n✅ Klaar! Bestanden zijn opgeslagen in:');
        console.log(`   ${importer.rambamDir}`);
        console.log('\n💡 Tip: Kopieer de bestanden naar public/data/rambam/ om ze beschikbaar te maken op de website');
        
    } catch (error) {
        console.error('\n❌ Fout bij import:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = SeferHaMitzvotImporter;
