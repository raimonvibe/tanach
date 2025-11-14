#!/usr/bin/env node

/**
 * Test import - Import just Mishnah Berakhot for testing
 */

const JewishTextsImporter = require('./jewish-texts-importer');

(async () => {
    const importer = new JewishTextsImporter();

    console.log('Testing import with Mishnah Berakhot...\n');

    try {
        const result = await importer.importMishnahTractate('Berakhot');
        console.log('\n✅ Success!');
        console.log(`Imported: ${result.name}`);
        console.log(`Chapters: ${result.chapters.length}`);
        console.log(`ID: ${result.id}`);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
})();
