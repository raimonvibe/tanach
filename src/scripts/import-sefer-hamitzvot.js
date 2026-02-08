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
        // Note: Sefaria uses "Sefer HaMitzvot, Positive Commandments" as the full reference
        this.seferHaMitzvotBooks = [
            { name: 'Sefer HaMitzvot, Positive Commandments', expectedCount: 248 },
            { name: 'Sefer HaMitzvot, Negative Commandments', expectedCount: 365 }
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
                console.log(`\n📖 ${book.name}...`);
                const bookData = await this.importBook(book.name, book.expectedCount);

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
    async importBook(bookName, expectedCount = null) {
        try {
            // Create file ID: "Sefer HaMitzvot, Positive Commandments" -> "sefer_hamitzvot_positive_commandments"
            const bookId = bookName.toLowerCase()
                .replace(/sefer hamitzvot, /g, '')
                .replace(/ /g, '_')
                .replace(/'/g, '');
            
            const sefariaRef = bookName;

            // Get book structure - try the direct reference first
            let indexUrl = `${this.baseUrl}/index/${encodeURIComponent(sefariaRef)}`;
            let response = await fetch(indexUrl);

            // If that fails, try the parent "Sefer HaMitzvot" index
            if (!response.ok) {
                indexUrl = `${this.baseUrl}/index/Sefer_HaMitzvot`;
                response = await fetch(indexUrl);
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const indexData = await response.json();

            // Check for API error
            if (indexData.error) {
                throw new Error(indexData.error);
            }

            // Try to find the count from schema, or use expected count
            let totalMitzvot = expectedCount;
            
            // Try to find in nested schema structure
            if (indexData.schema && indexData.schema.nodes) {
                const findMitzvotNode = (nodes) => {
                    for (const node of nodes) {
                        if (node.key === 'Mitzvot Ase' || node.key === 'Positive Commandments' || 
                            node.key === 'Mitzvot Lo Taase' || node.key === 'Negative Commandments') {
                            if (node.lengths && node.lengths.length > 0) {
                                return node.lengths[0];
                            }
                            // Check nested nodes
                            if (node.nodes) {
                                const nested = findMitzvotNode(node.nodes);
                                if (nested) return nested;
                            }
                        }
                        if (node.nodes) {
                            const nested = findMitzvotNode(node.nodes);
                            if (nested) return nested;
                        }
                    }
                    return null;
                };
                
                const foundCount = findMitzvotNode(indexData.schema.nodes);
                if (foundCount) {
                    totalMitzvot = foundCount;
                }
            }

            // Fallback: try to determine by testing if mitzvot exist
            if (!totalMitzvot) {
                console.log(`  ⚠️  Kon aantal niet bepalen, gebruik verwacht aantal: ${expectedCount || 'onbekend'}`);
                totalMitzvot = expectedCount || 248; // Default to positive count
            }

            console.log(`  📊 Totaal mitzvot: ${totalMitzvot}`);

            const mitzvot = [];

            // Import each mitzvah
            // Reference format: "Sefer HaMitzvot, Positive Commandments 1" (with space)
            let successCount = 0;
            let consecutiveFailures = 0;
            const maxConsecutiveFailures = 10; // Stop if 10 in a row fail
            
            for (let mitzvahNum = 1; mitzvahNum <= totalMitzvot; mitzvahNum++) {
                try {
                    const ref = `${sefariaRef} ${mitzvahNum}`;
                    const mitzvahData = await this.fetchMitzvah(ref);

                    if (mitzvahData && (mitzvahData.he || mitzvahData.text)) {
                        mitzvot.push({
                            mitzvah: mitzvahNum,
                            translations: {
                                hebrew: mitzvahData.he || '',
                                english: mitzvahData.text || ''
                            }
                        });
                        successCount++;
                        consecutiveFailures = 0;

                        if (mitzvahNum % 50 === 0) {
                            console.log(`    📄 Mitzvah ${mitzvahNum}... (${successCount} successvol)`);
                        }
                    } else {
                        consecutiveFailures++;
                        if (consecutiveFailures >= maxConsecutiveFailures) {
                            console.log(`    ⚠️  Gestopt na ${maxConsecutiveFailures} opeenvolgende fouten bij mitzvah ${mitzvahNum}`);
                            break;
                        }
                    }
                    
                    // Small delay to avoid rate limiting
                    await this.sleep(200);
                    
                } catch (error) {
                    consecutiveFailures++;
                    console.log(`    ⚠️  Mitzvah ${mitzvahNum}: ${error.message}`);
                    if (consecutiveFailures >= maxConsecutiveFailures) {
                        break;
                    }
                }
            }
            
            console.log(`  ✅ ${successCount} van ${totalMitzvot} mitzvot geïmporteerd`);

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
                    if (response.status === 404) {
                        return null; // Mitzvah doesn't exist
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                // Check for API error
                if (data.error) {
                    return null;
                }

                // Sefer HaMitzvot returns text in arrays
                if (Array.isArray(data.he) && Array.isArray(data.text)) {
                    // Join all seifim (sub-sections) together
                    const hebrew = data.he.map(h => h || '').join('\n\n').trim();
                    const english = data.text.map(t => t || '').join('\n\n').trim();
                    
                    if (hebrew || english) {
                        return {
                            he: hebrew,
                            text: english
                        };
                    }
                }

                // Fallback: single text
                if (data.he && data.text) {
                    return {
                        he: Array.isArray(data.he) ? data.he.join('\n\n') : data.he,
                        text: Array.isArray(data.text) ? data.text.join('\n\n') : data.text
                    };
                }

                return null;

            } catch (error) {
                if (attempt < retries) {
                    await this.sleep(1000 * (attempt + 1));
                    continue;
                } else {
                    // Don't throw, just return null so we can continue
                    return null;
                }
            }
        }
        return null;
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
