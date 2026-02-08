#!/usr/bin/env node

/**
 * Check Missing Texts Script
 * Analyzes Sefaria calendar data to identify texts that are referenced
 * but not in our collection
 */

const fs = require('fs-extra');
const path = require('path');

class MissingTextsChecker {
    constructor() {
        this.baseUrl = 'https://www.sefaria.org/api';
        this.rambamDir = path.join(__dirname, '../data/rambam');
        this.mishnahDir = path.join(__dirname, '../data/mishnah');
        this.talmudDir = path.join(__dirname, '../data/talmud');
        
        // Known texts we have
        this.knownRambam = new Set();
        this.knownMishnah = new Set();
        this.knownTalmud = new Set();
    }

    /**
     * Load list of available files
     */
    async loadAvailableFiles() {
        // Load Rambam files
        if (await fs.pathExists(this.rambamDir)) {
            const rambamFiles = await fs.readdir(this.rambamDir);
            rambamFiles
                .filter(f => f.endsWith('.json'))
                .forEach(f => {
                    const name = f.replace('.json', '');
                    this.knownRambam.add(name);
                    // Also add alternative names for Sefer HaMitzvot
                    if (name === 'sefer_hamitzvot_positive_commandments') {
                        this.knownRambam.add('positive_mitzvot');
                        this.knownRambam.add('positive_commandments');
                    }
                    if (name === 'sefer_hamitzvot_negative_commandments') {
                        this.knownRambam.add('negative_mitzvot');
                        this.knownRambam.add('negative_commandments');
                    }
                });
        }

        // Load Mishnah files
        if (await fs.pathExists(this.mishnahDir)) {
            const mishnahFiles = await fs.readdir(this.mishnahDir);
            mishnahFiles
                .filter(f => f.endsWith('.json'))
                .forEach(f => this.knownMishnah.add(f.replace('.json', '')));
        }

        // Load Talmud files
        if (await fs.pathExists(this.talmudDir)) {
            const talmudFiles = await fs.readdir(this.talmudDir);
            talmudFiles
                .filter(f => f.endsWith('.json'))
                .forEach(f => this.knownTalmud.add(f.replace('.json', '')));
        }
    }

    /**
     * Check calendar for next N days
     */
    async checkCalendar(days = 30) {
        console.log('🔍 CHECKING FOR MISSING TEXTS');
        console.log('='.repeat(50));
        console.log(`Analyzing Sefaria calendar for next ${days} days...\n`);

        await this.loadAvailableFiles();

        const missingTexts = {
            rambam: new Set(),
            mishnah: new Set(),
            talmud: new Set(),
            other: new Set()
        };

        const today = new Date();
        
        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;

            try {
                const response = await fetch(`${this.baseUrl}/calendars?date=${dateString}`);
                if (!response.ok) continue;

                const data = await response.json();
                if (!data.calendar_items) continue;

                for (const item of data.calendar_items) {
                    if (!item.url) continue;

                    // Check Rambam
                    if (item.url.includes('Mishneh_Torah')) {
                        const match = item.url.match(/Mishneh_Torah,_([A-Za-z_,]+)\./);
                        if (match) {
                            const book = match[1].toLowerCase();
                            if (!this.knownRambam.has(book)) {
                                missingTexts.rambam.add(book);
                            }
                        }
                    }
                    // Check Sefer HaMitzvot
                    else if (item.url.includes('Sefer_HaMitzvot') || 
                             item.url.includes('Positive_Commandments') ||
                             item.url.includes('Negative_Commandments') ||
                             item.url.includes('Positive_Mitzvot') ||
                             item.url.includes('Negative_Mitzvot')) {
                        // Extract the type from URL
                        let isPositive = item.url.includes('Positive');
                        let isNegative = item.url.includes('Negative');
                        
                        // Check various possible names
                        const hasPositive = this.knownRambam.has('sefer_hamitzvot_positive_commandments') ||
                                          this.knownRambam.has('positive_mitzvot') ||
                                          this.knownRambam.has('positive_commandments');
                        const hasNegative = this.knownRambam.has('sefer_hamitzvot_negative_commandments') ||
                                          this.knownRambam.has('negative_mitzvot') ||
                                          this.knownRambam.has('negative_commandments');
                        
                        if (isPositive && !hasPositive) {
                            missingTexts.rambam.add('Sefer HaMitzvot, Positive Commandments');
                        }
                        if (isNegative && !hasNegative) {
                            missingTexts.rambam.add('Sefer HaMitzvot, Negative Commandments');
                        }
                    }
                    // Check Mishnah
                    else if (item.url.includes('Mishnah_')) {
                        const match = item.url.match(/Mishnah_([A-Za-z_]+)\./);
                        if (match) {
                            const tractate = match[1].toLowerCase();
                            if (!this.knownMishnah.has(tractate)) {
                                missingTexts.mishnah.add(tractate);
                            }
                        }
                    }
                    // Check Talmud (exclude Tanach books)
                    // Tanach books: Genesis, Exodus, Leviticus, Numbers, Deuteronomy, etc.
                    else if (item.url.match(/^[A-Za-z_]+\.\d+[ab]?$/)) {
                        const match = item.url.match(/^([A-Za-z_]+)\./);
                        if (match) {
                            const tractate = match[1].toLowerCase();
                            // Exclude Tanach books (these are in our Tanach collection, not Talmud)
                            const tanachBooks = ['genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy',
                                                'joshua', 'judges', 'samuel', 'kings', 'isaiah', 'jeremiah',
                                                'ezekiel', 'hosea', 'joel', 'amos', 'obadiah', 'jonah', 'micah',
                                                'nahum', 'habakkuk', 'zephaniah', 'haggai', 'zechariah', 'malachi',
                                                'psalms', 'proverbs', 'job', 'song', 'ruth', 'lamentations',
                                                'ecclesiastes', 'esther', 'daniel', 'ezra', 'nehemiah', 'chronicles'];
                            
                            if (!tanachBooks.includes(tractate) && !this.knownTalmud.has(tractate)) {
                                missingTexts.talmud.add(tractate);
                            }
                        }
                    }
                    // Other texts
                    else if (!item.url.includes('Tanakh') && 
                             !item.url.includes('Tanach') &&
                             !item.url.includes('Torah')) {
                        missingTexts.other.add(item.url);
                    }
                }

                // Small delay to avoid rate limiting
                await this.sleep(100);

            } catch (error) {
                console.error(`Error checking ${dateString}:`, error.message);
            }
        }

        // Report results
        console.log('\n📊 MISSING TEXTS REPORT');
        console.log('='.repeat(50));

        if (missingTexts.rambam.size > 0) {
            console.log('\n❌ Missing Rambam/Mishneh Torah books:');
            Array.from(missingTexts.rambam).sort().forEach(book => {
                console.log(`   - ${book}`);
            });
        }

        if (missingTexts.mishnah.size > 0) {
            console.log('\n❌ Missing Mishnah tractates:');
            Array.from(missingTexts.mishnah).sort().forEach(tractate => {
                console.log(`   - ${tractate}`);
            });
        }

        if (missingTexts.talmud.size > 0) {
            console.log('\n❌ Missing Talmud tractates:');
            Array.from(missingTexts.talmud).sort().forEach(tractate => {
                console.log(`   - ${tractate}`);
            });
        }

        if (missingTexts.other.size > 0) {
            console.log('\n⚠️  Other referenced texts (may not need import):');
            Array.from(missingTexts.other).slice(0, 10).forEach(url => {
                console.log(`   - ${url}`);
            });
            if (missingTexts.other.size > 10) {
                console.log(`   ... and ${missingTexts.other.size - 10} more`);
            }
        }

        if (missingTexts.rambam.size === 0 && 
            missingTexts.mishnah.size === 0 && 
            missingTexts.talmud.size === 0 && 
            missingTexts.other.size === 0) {
            console.log('\n✅ No missing texts found! All referenced texts are in your collection.');
        }

        console.log('\n' + '='.repeat(50));
        console.log(`\n📈 Summary:`);
        console.log(`   Rambam: ${missingTexts.rambam.size} missing`);
        console.log(`   Mishnah: ${missingTexts.mishnah.size} missing`);
        console.log(`   Talmud: ${missingTexts.talmud.size} missing`);
        console.log(`   Other: ${missingTexts.other.size} referenced`);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Main execution
async function main() {
    const checker = new MissingTextsChecker();
    const days = process.argv[2] ? parseInt(process.argv[2]) : 30;
    
    try {
        await checker.checkCalendar(days);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = MissingTextsChecker;
