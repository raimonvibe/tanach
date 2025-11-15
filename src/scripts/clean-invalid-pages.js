#!/usr/bin/env node

/**
 * Clean Invalid Pages - Remove empty pages that don't exist in Sefaria
 * This script checks each Talmud page and removes ones that are empty AND don't exist
 */

const fs = require('fs-extra');
const path = require('path');

class PageCleaner {
    constructor() {
        this.baseUrl = 'https://www.sefaria.org/api/texts';
        this.talmudDir = path.join(__dirname, '../../src/data/talmud');

        this.stats = {
            filesProcessed: 0,
            pagesRemoved: 0,
            pagesKept: 0
        };
    }

    /**
     * Main function
     */
    async cleanAllFiles() {
        console.log('🧹 INVALID PAGE CLEANER');
        console.log('='.repeat(60));
        console.log('Removing empty pages that don\'t exist in Sefaria...\n');

        try {
            const files = await fs.readdir(this.talmudDir);
            const jsonFiles = files.filter(f => f.endsWith('.json'));

            for (const file of jsonFiles) {
                await this.cleanFile(file);
            }

            console.log('\n🎉 CLEANING COMPLETE!');
            console.log('='.repeat(60));
            console.log(`📁 Files processed: ${this.stats.filesProcessed}`);
            console.log(`✅ Pages kept: ${this.stats.pagesKept}`);
            console.log(`🗑️  Pages removed: ${this.stats.pagesRemoved}`);

        } catch (error) {
            console.error('❌ Error:', error.message);
            console.error(error.stack);
        }
    }

    /**
     * Clean a single file
     */
    async cleanFile(filename) {
        const filePath = path.join(this.talmudDir, filename);

        try {
            console.log(`\n📖 Processing ${filename}...`);
            const data = await fs.readJson(filePath);

            if (!data.pages || !Array.isArray(data.pages)) {
                console.log('  ⚠️  No pages array found, skipping');
                return;
            }

            const originalCount = data.pages.length;
            const validPages = [];
            let removed = 0;

            for (const page of data.pages) {
                // Check if page is empty
                const isEmpty = this.isPageEmpty(page);

                if (isEmpty) {
                    // Verify with Sefaria if this page should exist
                    const exists = await this.checkPageExists(data.sefariaRef, page.page);

                    if (!exists) {
                        console.log(`  🗑️  Removing ${page.page} (doesn't exist in Sefaria)`);
                        removed++;
                        this.stats.pagesRemoved++;
                    } else {
                        console.log(`  ⚠️  Keeping ${page.page} (empty but should exist)`);
                        validPages.push(page);
                        this.stats.pagesKept++;
                    }
                } else {
                    // Page has content, keep it
                    validPages.push(page);
                    this.stats.pagesKept++;
                }
            }

            // Update the data
            data.pages = validPages;

            // Save the cleaned file
            await fs.writeJson(filePath, data, { spaces: 2 });

            console.log(`  ✅ Complete: ${originalCount} pages → ${validPages.length} pages (removed ${removed})`);
            this.stats.filesProcessed++;

        } catch (error) {
            console.error(`  ❌ Error processing ${filename}: ${error.message}`);
        }
    }

    /**
     * Check if a page is empty
     */
    isPageEmpty(page) {
        const hebrewEmpty = !page.content?.hebrew || page.content.hebrew.trim().length < 10;
        const englishEmpty = !page.content?.english || page.content.english.trim().length < 10;
        return hebrewEmpty && englishEmpty;
    }

    /**
     * Check if a page exists in Sefaria
     */
    async checkPageExists(tractate, pageRef) {
        try {
            const ref = `${tractate} ${pageRef}`;
            const url = `${this.baseUrl}/${encodeURIComponent(ref)}`;

            const response = await fetch(url);
            const data = await response.json();

            // If there's an error property, the page doesn't exist
            if (data.error) {
                return false;
            }

            // If there's Hebrew or English text, it exists
            if (data.he || data.text) {
                return true;
            }

            return false;

        } catch (error) {
            console.error(`    ⚠️  Error checking ${tractate} ${pageRef}: ${error.message}`);
            // On error, assume it exists to be safe
            return true;
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

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🧹 Invalid Page Cleaner

This script removes empty pages that don't exist in Sefaria from your Talmud files.

Usage:
  node clean-invalid-pages.js              # Clean all Talmud files
  node clean-invalid-pages.js --help       # Show this help

What it does:
  1. Scans all JSON files in src/data/talmud
  2. For each empty page, checks if it exists in Sefaria
  3. Removes pages that are empty AND don't exist
  4. Keeps pages that have content or should exist
  5. Saves the cleaned JSON files

Example:
  If Beitzah has pages 41a-80b that are empty, and Sefaria says
  "Beitzah ends at 40b", those pages will be removed.

Time: 2-5 minutes (depending on number of invalid pages)
        `);
        process.exit(0);
    }

    const cleaner = new PageCleaner();
    cleaner.cleanAllFiles()
        .then(() => {
            console.log('\n✅ All done!');
        })
        .catch(error => {
            console.error('❌ Fatal error:', error);
            process.exit(1);
        });
}

module.exports = PageCleaner;
