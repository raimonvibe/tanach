#!/usr/bin/env node

/**
 * Smart Importer - Import only content needed for daily/weekly/yearly readings
 * This script analyzes the next year of readings and imports only what's needed
 */

const fs = require('fs-extra');
const path = require('path');
const JewishTextsImporter = require('./jewish-texts-importer');

class ReadingsContentImporter {
    constructor() {
        this.importer = new JewishTextsImporter();
        this.talmudTractates = new Set();
        this.mishnahTractates = new Set();
        this.rambamSections = new Set();
    }

    /**
     * Main function - analyze and import
     */
    async importReadingsContent() {
        console.log('📚 SMART READINGS CONTENT IMPORTER');
        console.log('='.repeat(60));
        console.log('Analyzing readings for the next year...\n');

        try {
            // Step 1: Check what's already imported
            await this.checkExistingContent();

            // Step 2: Analyze calendar for next year
            await this.analyzeYearOfReadings();

            // Step 3: Display what we found
            this.displayAnalysis();

            // Step 4: Import the content
            await this.importContent();

            console.log('\n🎉 IMPORT COMPLETE!');
            console.log('='.repeat(60));

        } catch (error) {
            console.error('❌ Error:', error.message);
            console.error(error.stack);
        }
    }

    /**
     * Check what content is already imported
     */
    async checkExistingContent() {
        console.log('🔍 Checking existing content...\n');

        const existingTalmud = new Set();
        const existingMishnah = new Set();
        const existingRambam = new Set();

        // Check Talmud
        const talmudDir = path.join(this.importer.talmudDir);
        try {
            const files = await fs.readdir(talmudDir);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const name = file.replace('.json', '').replace(/_/g, ' ');
                    // Capitalize first letter of each word
                    const tractate = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    existingTalmud.add(tractate);
                }
            });
        } catch (error) {
            // Directory doesn't exist yet
        }

        // Check Mishnah
        const mishnahDir = path.join(this.importer.mishnahDir);
        try {
            const files = await fs.readdir(mishnahDir);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const name = file.replace('.json', '').replace(/_/g, ' ');
                    const tractate = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    existingMishnah.add(tractate);
                }
            });
        } catch (error) {
            // Directory doesn't exist yet
        }

        // Check Rambam
        const rambamDir = path.join(this.importer.rambamDir);
        try {
            const files = await fs.readdir(rambamDir);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const name = file.replace('.json', '').replace(/_/g, ' ');
                    const book = name.charAt(0).toUpperCase() + name.slice(1);
                    existingRambam.add(book);
                }
            });
        } catch (error) {
            // Directory doesn't exist yet
        }

        console.log(`  ✅ Found ${existingTalmud.size} Talmud tractates`);
        console.log(`  ✅ Found ${existingMishnah.size} Mishnah tractates`);
        console.log(`  ✅ Found ${existingRambam.size} Rambam books\n`);

        // Store for later use
        this.existingTalmud = existingTalmud;
        this.existingMishnah = existingMishnah;
        this.existingRambam = existingRambam;
    }

    /**
     * Analyze the next year of readings from Sefaria calendar API
     */
    async analyzeYearOfReadings() {
        console.log('📅 Analyzing calendar for next 365 days...\n');

        const today = new Date();
        const daysToCheck = 365;

        for (let i = 0; i < daysToCheck; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);

            const dateString = date.toISOString().split('T')[0];

            try {
                const response = await fetch(`https://www.sefaria.org/api/calendars?date=${dateString}`);

                if (!response.ok) {
                    console.log(`  ⚠️  Could not fetch calendar for ${dateString}`);
                    continue;
                }

                const data = await response.json();

                if (data.calendar_items) {
                    this.extractReadings(data.calendar_items);
                }

                // Progress indicator every 30 days
                if ((i + 1) % 30 === 0) {
                    console.log(`  ✓ Analyzed ${i + 1} days...`);
                }

                // Small delay to be nice to the API
                await this.sleep(100);

            } catch (error) {
                console.log(`  ⚠️  Error fetching ${dateString}: ${error.message}`);
            }
        }

        console.log(`\n✅ Analyzed ${daysToCheck} days\n`);
    }

    /**
     * Extract readings from calendar items
     */
    extractReadings(calendarItems) {
        for (const item of calendarItems) {
            const title = item.title?.en || '';
            const displayValue = item.displayValue?.en || '';
            const url = item.url || '';

            // Daf Yomi (Talmud)
            if (title === 'Daf Yomi') {
                const tractate = this.extractTalmudTractate(displayValue);
                if (tractate) {
                    this.talmudTractates.add(tractate);
                }
            }

            // Daily Mishnah
            if (title === 'Daily Mishnah') {
                const tractate = this.extractMishnahTractate(displayValue);
                if (tractate) {
                    this.mishnahTractates.add(tractate);
                }
            }

            // Daily Rambam
            if (title === 'Daily Rambam' || title === 'Daily Rambam (3 Chapters)') {
                const section = this.extractRambamSection(displayValue, url);
                if (section) {
                    this.rambamSections.add(section);
                }
            }
        }
    }

    /**
     * Extract Talmud tractate name from "Tractate Page" format
     * Example: "Zevachim 61" -> "Zevachim"
     */
    extractTalmudTractate(text) {
        const match = text.match(/^([A-Za-z\s]+)\s+\d+/);
        if (match) {
            return match[1].trim();
        }
        return null;
    }

    /**
     * Extract Mishnah tractate name
     * Example: "Mishnah Chullin 7:5-6" -> "Chullin"
     */
    extractMishnahTractate(text) {
        const match = text.match(/^Mishnah\s+([A-Za-z\s]+)\s+\d+/);
        if (match) {
            return match[1].trim();
        }
        return null;
    }

    /**
     * Extract Rambam book name from display text or URL
     */
    extractRambamSection(text, url) {
        // Try to extract from URL first
        if (url) {
            const match = url.match(/Mishneh_Torah,_([^/]+)/);
            if (match) {
                return match[1].replace(/_/g, ' ');
            }
        }

        // Otherwise return the text (it's usually the section name)
        return text;
    }

    /**
     * Display analysis results
     */
    displayAnalysis() {
        console.log('📊 ANALYSIS RESULTS');
        console.log('='.repeat(60));

        // Talmud
        const talmudNeeded = Array.from(this.talmudTractates).filter(t => !this.existingTalmud.has(t));
        const talmudAlreadyHave = Array.from(this.talmudTractates).filter(t => this.existingTalmud.has(t));

        console.log(`\n📖 Talmud Tractates:`);
        console.log(`  Total needed: ${this.talmudTractates.size}`);
        console.log(`  Already imported: ${talmudAlreadyHave.length}`);
        console.log(`  Need to import: ${talmudNeeded.length}`);

        if (talmudNeeded.length > 0) {
            console.log(`\n  Missing tractates:`);
            talmudNeeded.sort().forEach(t => console.log(`    - ${t}`));
        }

        // Mishnah
        const mishnahNeeded = Array.from(this.mishnahTractates).filter(t => !this.existingMishnah.has(t));
        const mishnahAlreadyHave = Array.from(this.mishnahTractates).filter(t => this.existingMishnah.has(t));

        console.log(`\n📜 Mishnah Tractates:`);
        console.log(`  Total needed: ${this.mishnahTractates.size}`);
        console.log(`  Already imported: ${mishnahAlreadyHave.length}`);
        console.log(`  Need to import: ${mishnahNeeded.length}`);

        if (mishnahNeeded.length > 0 && mishnahNeeded.length <= 10) {
            console.log(`\n  Missing tractates:`);
            mishnahNeeded.sort().forEach(t => console.log(`    - ${t}`));
        }

        // Rambam
        const rambamBooks = new Set();
        for (const section of this.rambamSections) {
            const book = this.mapRambamSectionToBook(section);
            if (book) {
                rambamBooks.add(book.replace('Mishneh Torah, ', ''));
            }
        }

        const rambamNeeded = Array.from(rambamBooks).filter(b => !this.existingRambam.has(b));
        const rambamAlreadyHave = Array.from(rambamBooks).filter(b => this.existingRambam.has(b));

        console.log(`\n📚 Rambam Books:`);
        console.log(`  Total needed: ${rambamBooks.size}`);
        console.log(`  Already imported: ${rambamAlreadyHave.length}`);
        console.log(`  Need to import: ${rambamNeeded.length}`);

        if (rambamNeeded.length > 0) {
            console.log(`\n  Missing books:`);
            rambamNeeded.sort().forEach(b => console.log(`    - ${b}`));
        }

        console.log('\n');
    }

    /**
     * Import the identified content
     */
    async importContent() {
        console.log('💾 IMPORTING CONTENT');
        console.log('='.repeat(60));

        let totalImported = 0;
        let totalSkipped = 0;

        // Import Talmud tractates
        const talmudNeeded = Array.from(this.talmudTractates).filter(t => !this.existingTalmud.has(t));

        if (talmudNeeded.length > 0) {
            console.log(`\n📖 Importing ${talmudNeeded.length} Talmud tractates...\n`);
            for (const tractate of talmudNeeded) {
                try {
                    console.log(`  Importing ${tractate}...`);
                    await this.importer.importTalmudTractate(tractate);
                    totalImported++;
                    console.log(`  ✅ ${tractate} imported`);
                    await this.sleep(1000);
                } catch (error) {
                    console.log(`  ❌ Failed to import ${tractate}: ${error.message}`);
                }
            }
        } else {
            console.log(`\n📖 Talmud: All needed tractates already imported! ✅`);
        }

        const talmudSkipped = this.talmudTractates.size - talmudNeeded.length;
        if (talmudSkipped > 0) {
            totalSkipped += talmudSkipped;
            console.log(`  ⏭️  Skipped ${talmudSkipped} already imported`);
        }

        // Import Mishnah tractates
        const mishnahNeeded = Array.from(this.mishnahTractates).filter(t => !this.existingMishnah.has(t));

        if (mishnahNeeded.length > 0) {
            console.log(`\n📜 Importing ${mishnahNeeded.length} Mishnah tractates...\n`);
            for (const tractate of mishnahNeeded) {
                try {
                    console.log(`  Importing ${tractate}...`);
                    await this.importer.importMishnahTractate(tractate);
                    totalImported++;
                    console.log(`  ✅ ${tractate} imported`);
                    await this.sleep(1000);
                } catch (error) {
                    console.log(`  ❌ Failed to import ${tractate}: ${error.message}`);
                }
            }
        } else {
            console.log(`\n📜 Mishnah: All needed tractates already imported! ✅`);
        }

        const mishnahSkipped = this.mishnahTractates.size - mishnahNeeded.length;
        if (mishnahSkipped > 0) {
            totalSkipped += mishnahSkipped;
            console.log(`  ⏭️  Skipped ${mishnahSkipped} already imported`);
        }

        // Import Rambam sections
        console.log(`\n📚 Rambam sections...\n`);
        console.log('  Note: Rambam import imports entire books, not individual sections');

        // Extract unique book names from sections
        const rambamBooks = new Set();
        for (const section of this.rambamSections) {
            // Try to map section to book
            const book = this.mapRambamSectionToBook(section);
            if (book) {
                const bookName = book.replace('Mishneh Torah, ', '');
                rambamBooks.add(bookName);
            }
        }

        console.log(`  Found ${rambamBooks.size} unique Rambam books needed\n`);

        const rambamNeeded = Array.from(rambamBooks).filter(b => !this.existingRambam.has(b));

        if (rambamNeeded.length > 0) {
            console.log(`  Importing ${rambamNeeded.length} Rambam books...\n`);
            for (const bookName of rambamNeeded) {
                try {
                    const fullBookName = `Mishneh Torah, ${bookName}`;
                    console.log(`  Importing ${fullBookName}...`);
                    await this.importer.importRambamBook(fullBookName);
                    totalImported++;
                    console.log(`  ✅ ${fullBookName} imported`);
                    await this.sleep(1000);
                } catch (error) {
                    console.log(`  ❌ Failed to import ${bookName}: ${error.message}`);
                }
            }
        } else {
            console.log(`  All needed Rambam books already imported! ✅`);
        }

        const rambamSkipped = rambamBooks.size - rambamNeeded.length;
        if (rambamSkipped > 0) {
            totalSkipped += rambamSkipped;
            console.log(`  ⏭️  Skipped ${rambamSkipped} already imported`);
        }

        console.log(`\n📊 Summary:`);
        console.log(`  ✅ Imported: ${totalImported}`);
        console.log(`  ⏭️  Skipped: ${totalSkipped}`);
    }

    /**
     * Map Rambam section name to book name
     */
    mapRambamSectionToBook(section) {
        // Rambam sections often contain the book name
        // Try to match against known book names
        const knownBooks = [
            'Mishneh Torah, Knowledge',
            'Mishneh Torah, Love',
            'Mishneh Torah, Times',
            'Mishneh Torah, Women',
            'Mishneh Torah, Holiness',
            'Mishneh Torah, Utterances',
            'Mishneh Torah, Seeds',
            'Mishneh Torah, Service',
            'Mishneh Torah, Sacrifices',
            'Mishneh Torah, Purity',
            'Mishneh Torah, Damages',
            'Mishneh Torah, Acquisition',
            'Mishneh Torah, Judgments',
            'Mishneh Torah, Judges'
        ];

        // Try to find a match
        for (const book of knownBooks) {
            const bookName = book.replace('Mishneh Torah, ', '');
            if (section.includes(bookName)) {
                return book;
            }
        }

        // Default to Knowledge book if no match
        return 'Mishneh Torah, Knowledge';
    }

    /**
     * Copy imported files to public folder
     */
    async copyToPublic() {
        console.log('\n📋 Copying files to public folder...');

        const copies = [
            { from: 'src/data/talmud', to: 'public/data/talmud' },
            { from: 'src/data/mishnah', to: 'public/data/mishnah' },
            { from: 'src/data/rambam', to: 'public/data/rambam' }
        ];

        for (const { from, to } of copies) {
            try {
                const fromPath = path.join(__dirname, '..', '..', from);
                const toPath = path.join(__dirname, '..', '..', to);

                await fs.ensureDir(toPath);
                await fs.copy(fromPath, toPath, { overwrite: true });

                console.log(`  ✅ Copied ${from} → ${to}`);
            } catch (error) {
                console.log(`  ⚠️  Could not copy ${from}: ${error.message}`);
            }
        }
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
    const args = process.argv.slice(2);
    const importer = new ReadingsContentImporter();

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
📚 Smart Readings Content Importer

This script analyzes your readings page calendar for the next year
and imports ONLY the content you actually need, saving time and space.

Usage:
  node import-readings-content.js              # Analyze and import
  node import-readings-content.js --help       # Show this help

What it does:
  1. Queries Sefaria calendar API for next 365 days
  2. Identifies all Talmud tractates in Daf Yomi cycle
  3. Identifies all Mishnah tractates in daily cycle
  4. Identifies all Rambam sections in daily cycle
  5. Imports ONLY those specific items (not everything)
  6. Copies to public folder for website access

Estimated time: 1-3 hours (depending on how many items found)
Estimated size: 200-500 MB (much smaller than importing everything!)
        `);
        process.exit(0);
    }

    importer.importReadingsContent()
        .then(() => importer.copyToPublic())
        .then(() => {
            console.log('\n✅ All done! Your readings content is ready.');
            console.log('📁 Files are in: public/data/talmud, public/data/mishnah, public/data/rambam');
        })
        .catch(error => {
            console.error('❌ Fatal error:', error);
            process.exit(1);
        });
}

module.exports = ReadingsContentImporter;
