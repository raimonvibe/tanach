#!/usr/bin/env node

/**
 * Fix Missing Content - Find and re-download missing verses/pages
 * This script scans all imported files and fixes any empty content
 */

const fs = require('fs-extra');
const path = require('path');

class ContentFixer {
    constructor() {
        this.baseUrl = 'https://www.sefaria.org/api/texts';
        this.talmudDir = path.join(__dirname, '../data/talmud');
        this.mishnahDir = path.join(__dirname, '../data/mishnah');
        this.rambamDir = path.join(__dirname, '../data/rambam');

        this.missingContent = {
            talmud: [],
            mishnah: [],
            rambam: []
        };

        this.fixed = 0;
        this.errors = 0;
    }

    /**
     * Main function
     */
    async fixAllContent() {
        console.log('🔍 CONTENT INTEGRITY CHECKER & FIXER');
        console.log('='.repeat(60));
        console.log('Scanning all imported files for missing content...\n');

        try {
            // Step 1: Scan for missing content
            await this.scanTalmud();
            await this.scanMishnah();
            await this.scanRambam();

            // Step 2: Display findings
            this.displayFindings();

            // Step 3: Fix missing content
            if (this.hasAnyMissing()) {
                await this.fixMissingContent();
            } else {
                console.log('✅ No missing content found! All files are complete.\n');
            }

            console.log('\n🎉 SCAN COMPLETE!');
            console.log('='.repeat(60));
            console.log(`✅ Fixed: ${this.fixed}`);
            console.log(`❌ Errors: ${this.errors}`);

        } catch (error) {
            console.error('❌ Error:', error.message);
            console.error(error.stack);
        }
    }

    /**
     * Check if there's any missing content
     */
    hasAnyMissing() {
        return this.missingContent.talmud.length > 0 ||
               this.missingContent.mishnah.length > 0 ||
               this.missingContent.rambam.length > 0;
    }

    /**
     * Scan Talmud files for missing content
     */
    async scanTalmud() {
        console.log('📖 Scanning Talmud...');

        try {
            const files = await fs.readdir(this.talmudDir);

            for (const file of files) {
                if (!file.endsWith('.json')) continue;

                const filePath = path.join(this.talmudDir, file);
                const data = await fs.readJson(filePath);

                if (!data.pages || !Array.isArray(data.pages)) continue;

                // Check each page
                for (let i = 0; i < data.pages.length; i++) {
                    const page = data.pages[i];

                    // Check if content is missing (empty or very short)
                    const hebrewMissing = !page.content?.hebrew || page.content.hebrew.trim().length < 10;
                    const englishMissing = !page.content?.english || page.content.english.trim().length < 10;

                    if (hebrewMissing || englishMissing) {
                        this.missingContent.talmud.push({
                            file: file,
                            tractate: data.name,
                            sefariaRef: data.sefariaRef,
                            pageRef: page.page,
                            pageIndex: i,
                            hebrewMissing,
                            englishMissing
                        });
                    }
                }
            }

            console.log(`  Found ${this.missingContent.talmud.length} missing pages\n`);

        } catch (error) {
            console.log(`  ⚠️  Error scanning Talmud: ${error.message}\n`);
        }
    }

    /**
     * Scan Mishnah files for missing content
     */
    async scanMishnah() {
        console.log('📜 Scanning Mishnah...');

        try {
            const files = await fs.readdir(this.mishnahDir);

            for (const file of files) {
                if (!file.endsWith('.json')) continue;

                const filePath = path.join(this.mishnahDir, file);
                const data = await fs.readJson(filePath);

                if (!data.chapters || !Array.isArray(data.chapters)) continue;

                // Check each chapter
                for (let i = 0; i < data.chapters.length; i++) {
                    const chapter = data.chapters[i];

                    if (!chapter.mishnayot || !Array.isArray(chapter.mishnayot)) continue;

                    // Check each mishnah
                    for (let j = 0; j < chapter.mishnayot.length; j++) {
                        const mishnah = chapter.mishnayot[j];

                        const hebrewMissing = !mishnah.translations?.hebrew || mishnah.translations.hebrew.trim().length < 10;
                        const englishMissing = !mishnah.translations?.english || mishnah.translations.english.trim().length < 10;

                        if (hebrewMissing || englishMissing) {
                            this.missingContent.mishnah.push({
                                file: file,
                                tractate: data.name,
                                sefariaRef: data.sefariaRef,
                                chapter: chapter.chapter,
                                mishnah: mishnah.mishnah,
                                chapterIndex: i,
                                mishnahIndex: j,
                                hebrewMissing,
                                englishMissing
                            });
                        }
                    }
                }
            }

            console.log(`  Found ${this.missingContent.mishnah.length} missing mishnayot\n`);

        } catch (error) {
            console.log(`  ⚠️  Error scanning Mishnah: ${error.message}\n`);
        }
    }

    /**
     * Scan Rambam files for missing content
     */
    async scanRambam() {
        console.log('📚 Scanning Rambam...');

        try {
            const files = await fs.readdir(this.rambamDir);

            for (const file of files) {
                if (!file.endsWith('.json')) continue;

                const filePath = path.join(this.rambamDir, file);
                const data = await fs.readJson(filePath);

                if (!data.sections || !Array.isArray(data.sections)) continue;

                // Check each section
                for (let i = 0; i < data.sections.length; i++) {
                    const section = data.sections[i];

                    const hebrewMissing = !section.content?.hebrew || section.content.hebrew.trim().length < 10;
                    const englishMissing = !section.content?.english || section.content.english.trim().length < 10;

                    if (hebrewMissing || englishMissing) {
                        this.missingContent.rambam.push({
                            file: file,
                            book: data.name,
                            section: section.title,
                            ref: section.ref,
                            sectionIndex: i,
                            hebrewMissing,
                            englishMissing
                        });
                    }
                }
            }

            console.log(`  Found ${this.missingContent.rambam.length} missing sections\n`);

        } catch (error) {
            console.log(`  ⚠️  Error scanning Rambam: ${error.message}\n`);
        }
    }

    /**
     * Display findings
     */
    displayFindings() {
        console.log('📊 SCAN RESULTS');
        console.log('='.repeat(60));

        console.log(`\n📖 Talmud: ${this.missingContent.talmud.length} pages with missing content`);
        if (this.missingContent.talmud.length > 0 && this.missingContent.talmud.length <= 20) {
            this.missingContent.talmud.forEach(item => {
                const missing = [];
                if (item.hebrewMissing) missing.push('Hebrew');
                if (item.englishMissing) missing.push('English');
                console.log(`  - ${item.tractate} ${item.pageRef} (${missing.join(', ')})`);
            });
        } else if (this.missingContent.talmud.length > 20) {
            this.missingContent.talmud.slice(0, 10).forEach(item => {
                const missing = [];
                if (item.hebrewMissing) missing.push('Hebrew');
                if (item.englishMissing) missing.push('English');
                console.log(`  - ${item.tractate} ${item.pageRef} (${missing.join(', ')})`);
            });
            console.log(`  ... and ${this.missingContent.talmud.length - 10} more`);
        }

        console.log(`\n📜 Mishnah: ${this.missingContent.mishnah.length} mishnayot with missing content`);
        if (this.missingContent.mishnah.length > 0 && this.missingContent.mishnah.length <= 20) {
            this.missingContent.mishnah.forEach(item => {
                const missing = [];
                if (item.hebrewMissing) missing.push('Hebrew');
                if (item.englishMissing) missing.push('English');
                console.log(`  - ${item.tractate} ${item.chapter}:${item.mishnah} (${missing.join(', ')})`);
            });
        } else if (this.missingContent.mishnah.length > 20) {
            this.missingContent.mishnah.slice(0, 10).forEach(item => {
                const missing = [];
                if (item.hebrewMissing) missing.push('Hebrew');
                if (item.englishMissing) missing.push('English');
                console.log(`  - ${item.tractate} ${item.chapter}:${item.mishnah} (${missing.join(', ')})`);
            });
            console.log(`  ... and ${this.missingContent.mishnah.length - 10} more`);
        }

        console.log(`\n📚 Rambam: ${this.missingContent.rambam.length} sections with missing content`);
        if (this.missingContent.rambam.length > 0 && this.missingContent.rambam.length <= 20) {
            this.missingContent.rambam.forEach(item => {
                const missing = [];
                if (item.hebrewMissing) missing.push('Hebrew');
                if (item.englishMissing) missing.push('English');
                console.log(`  - ${item.book} - ${item.section} (${missing.join(', ')})`);
            });
        } else if (this.missingContent.rambam.length > 20) {
            this.missingContent.rambam.slice(0, 10).forEach(item => {
                const missing = [];
                if (item.hebrewMissing) missing.push('Hebrew');
                if (item.englishMissing) missing.push('English');
                console.log(`  - ${item.book} - ${item.section} (${missing.join(', ')})`);
            });
            console.log(`  ... and ${this.missingContent.rambam.length - 10} more`);
        }

        console.log('\n');
    }

    /**
     * Fix missing content
     */
    async fixMissingContent() {
        console.log('💾 FIXING MISSING CONTENT');
        console.log('='.repeat(60));

        // Fix Talmud
        if (this.missingContent.talmud.length > 0) {
            console.log(`\n📖 Fixing ${this.missingContent.talmud.length} Talmud pages...\n`);
            await this.fixTalmudPages();
        }

        // Fix Mishnah
        if (this.missingContent.mishnah.length > 0) {
            console.log(`\n📜 Fixing ${this.missingContent.mishnah.length} Mishnah items...\n`);
            await this.fixMishnahItems();
        }

        // Fix Rambam
        if (this.missingContent.rambam.length > 0) {
            console.log(`\n📚 Fixing ${this.missingContent.rambam.length} Rambam sections...\n`);
            await this.fixRambamSections();
        }
    }

    /**
     * Fix Talmud pages
     */
    async fixTalmudPages() {
        // Group by file
        const byFile = {};
        for (const item of this.missingContent.talmud) {
            if (!byFile[item.file]) byFile[item.file] = [];
            byFile[item.file].push(item);
        }

        // Fix each file
        for (const [file, items] of Object.entries(byFile)) {
            try {
                const filePath = path.join(this.talmudDir, file);
                const data = await fs.readJson(filePath);

                console.log(`  Fixing ${file} (${items.length} pages)...`);

                for (const item of items) {
                    try {
                        const ref = `${item.sefariaRef} ${item.pageRef}`;
                        const pageData = await this.fetchFromSefaria(ref);

                        if (pageData) {
                            // Update the page content
                            data.pages[item.pageIndex].content = {
                                hebrew: Array.isArray(pageData.he) ? pageData.he.join('\n') : pageData.he || '',
                                english: Array.isArray(pageData.text) ? pageData.text.join('\n') : pageData.text || ''
                            };

                            this.fixed++;
                            console.log(`    ✅ Fixed ${item.pageRef}`);
                        } else {
                            this.errors++;
                            console.log(`    ❌ Could not fetch ${item.pageRef}`);
                        }

                        await this.sleep(500);

                    } catch (error) {
                        this.errors++;
                        console.log(`    ❌ Error fixing ${item.pageRef}: ${error.message}`);
                    }
                }

                // Save updated file
                await fs.writeJson(filePath, data, { spaces: 2 });
                console.log(`  💾 Saved ${file}\n`);

            } catch (error) {
                console.log(`  ❌ Error processing ${file}: ${error.message}\n`);
            }
        }
    }

    /**
     * Fix Mishnah items
     */
    async fixMishnahItems() {
        // Group by file
        const byFile = {};
        for (const item of this.missingContent.mishnah) {
            if (!byFile[item.file]) byFile[item.file] = [];
            byFile[item.file].push(item);
        }

        // Fix each file
        for (const [file, items] of Object.entries(byFile)) {
            try {
                const filePath = path.join(this.mishnahDir, file);
                const data = await fs.readJson(filePath);

                console.log(`  Fixing ${file} (${items.length} mishnayot)...`);

                // Group by chapter to minimize API calls
                const byChapter = {};
                for (const item of items) {
                    if (!byChapter[item.chapter]) byChapter[item.chapter] = [];
                    byChapter[item.chapter].push(item);
                }

                for (const [chapter, chapterItems] of Object.entries(byChapter)) {
                    try {
                        const ref = `${data.sefariaRef} ${chapter}`;
                        const chapterData = await this.fetchFromSefaria(ref);

                        if (chapterData && chapterData.he && chapterData.text) {
                            for (const item of chapterItems) {
                                const mishnahIndex = item.mishnah - 1;

                                if (chapterData.he[mishnahIndex] || chapterData.text[mishnahIndex]) {
                                    data.chapters[item.chapterIndex].mishnayot[item.mishnahIndex].translations = {
                                        hebrew: chapterData.he[mishnahIndex] || '',
                                        english: chapterData.text[mishnahIndex] || ''
                                    };

                                    this.fixed++;
                                    console.log(`    ✅ Fixed ${item.chapter}:${item.mishnah}`);
                                } else {
                                    this.errors++;
                                    console.log(`    ❌ No data for ${item.chapter}:${item.mishnah}`);
                                }
                            }
                        } else {
                            this.errors += chapterItems.length;
                            console.log(`    ❌ Could not fetch chapter ${chapter}`);
                        }

                        await this.sleep(500);

                    } catch (error) {
                        console.log(`    ❌ Error fixing chapter ${chapter}: ${error.message}`);
                    }
                }

                // Save updated file
                await fs.writeJson(filePath, data, { spaces: 2 });
                console.log(`  💾 Saved ${file}\n`);

            } catch (error) {
                console.log(`  ❌ Error processing ${file}: ${error.message}\n`);
            }
        }
    }

    /**
     * Fix Rambam sections
     */
    async fixRambamSections() {
        // Group by file
        const byFile = {};
        for (const item of this.missingContent.rambam) {
            if (!byFile[item.file]) byFile[item.file] = [];
            byFile[item.file].push(item);
        }

        // Fix each file
        for (const [file, items] of Object.entries(byFile)) {
            try {
                const filePath = path.join(this.rambamDir, file);
                const data = await fs.readJson(filePath);

                console.log(`  Fixing ${file} (${items.length} sections)...`);

                for (const item of items) {
                    try {
                        const sectionData = await this.fetchFromSefaria(item.ref);

                        if (sectionData) {
                            data.sections[item.sectionIndex].content = {
                                hebrew: sectionData.he || '',
                                english: sectionData.text || ''
                            };

                            this.fixed++;
                            console.log(`    ✅ Fixed ${item.section}`);
                        } else {
                            this.errors++;
                            console.log(`    ❌ Could not fetch ${item.section}`);
                        }

                        await this.sleep(500);

                    } catch (error) {
                        this.errors++;
                        console.log(`    ❌ Error fixing ${item.section}: ${error.message}`);
                    }
                }

                // Save updated file
                await fs.writeJson(filePath, data, { spaces: 2 });
                console.log(`  💾 Saved ${file}\n`);

            } catch (error) {
                console.log(`  ❌ Error processing ${file}: ${error.message}\n`);
            }
        }
    }

    /**
     * Fetch from Sefaria API
     */
    async fetchFromSefaria(ref) {
        try {
            const url = `${this.baseUrl}/${encodeURIComponent(ref)}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            throw new Error(`API error: ${error.message}`);
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
🔍 Content Integrity Checker & Fixer

This script scans all imported Talmud/Mishnah/Rambam files
and fixes any missing or empty content by re-downloading from Sefaria.

Usage:
  node fix-missing-content.js              # Scan and fix all files
  node fix-missing-content.js --help       # Show this help

What it does:
  1. Scans all JSON files in src/data/talmud, mishnah, rambam
  2. Identifies pages/chapters with missing Hebrew or English
  3. Re-downloads missing content from Sefaria API
  4. Updates JSON files with corrected content

Example issues it fixes:
  - Empty pages (like page 35b with no content)
  - Truncated or incomplete verses
  - Failed downloads during import

Time: 10-30 minutes (depending on how much content is missing)
        `);
        process.exit(0);
    }

    const fixer = new ContentFixer();
    fixer.fixAllContent()
        .then(() => {
            console.log('\n✅ All done!');
            if (fixer.fixed > 0) {
                console.log('💡 Tip: Run this script again to verify all fixes were successful.');
            }
        })
        .catch(error => {
            console.error('❌ Fatal error:', error);
            process.exit(1);
        });
}

module.exports = ContentFixer;
