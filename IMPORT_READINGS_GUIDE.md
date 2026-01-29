# Import Readings Content - Quick Guide

## What This Does

Instead of importing ALL Jewish texts (1.5 GB, 4-5 hours), this smart script imports **only what you need** for your readings page:

- ✅ **Daf Yomi tractates** - Only tractates in current 7.5-year cycle
- ✅ **Daily Mishnah** - All tractates for annual cycle
- ✅ **Daily Rambam** - Books used in daily study

**Result:** ~200-500 MB in 1-3 hours (much better!)

## How to Run

```bash
npm run import:readings
```

That's it! The script will:

1. **Analyze** - Check Sefaria calendar for next 365 days
2. **Identify** - Find which Talmud/Mishnah/Rambam content is needed
3. **Import** - Download only those specific items
4. **Copy** - Move files to `public/data/` for website access

## What You'll See

```
📚 SMART READINGS CONTENT IMPORTER
==================================================
Analyzing calendar for next 365 days...

  ✓ Analyzed 30 days...
  ✓ Analyzed 60 days...
  ...
  ✓ Analyzed 365 days

✅ Analyzed 365 days

📊 ANALYSIS RESULTS
==================================================

📖 Talmud Tractates Found: 23
  - Berakhot
  - Shabbat
  - Eruvin
  - Zevachim
  ... etc

📜 Mishnah Tractates Found: 35
  - Berakhot
  - Peah
  - Chullin
  ... etc

📚 Rambam Sections Found: 180
  - Knowledge
  - Love
  - Times
  ... etc

💾 IMPORTING CONTENT
==================================================

📖 Importing 23 Talmud tractates...
  ✅ Berakhot imported
  ✅ Shabbat imported
  ... etc

📜 Importing 35 Mishnah tractates...
  ✅ Berakhot imported
  ... etc

📚 Importing 8 Rambam books...
  ✅ Mishneh Torah, Knowledge imported
  ... etc

🎉 IMPORT COMPLETE!
📊 Total items imported: 66

📋 Copying files to public folder...
  ✅ Copied src/data/talmud → public/data/talmud
  ✅ Copied src/data/mishnah → public/data/mishnah
  ✅ Copied src/data/rambam → public/data/rambam

✅ All done! Your readings content is ready.
```

## Time Estimates

- **Analysis**: 5-10 minutes (checking 365 days of calendars)
- **Import**: 1-2 hours (depending on number of tractates found)
- **Total**: 1-3 hours

## Troubleshooting

### If the script stops/crashes:

Just run it again! It will:
- Skip already imported files
- Continue where it left off

### If you want to see what would be imported without importing:

Edit the script and comment out the `await this.importContent()` line. The analysis will still run and show you what would be imported.

### If you want to import everything instead:

```bash
# Import ALL texts (not recommended - takes 4-5 hours, 1.5 GB)
npm run import:all-texts

# Or individually:
npm run import:talmud   # All 63 tractates, 500-800 MB, 2-3 hours
npm run import:mishnah  # All 63 tractates, 50-100 MB, 20-30 min
npm run import:rambam   # All 14 books, 100-150 MB, 30-40 min
```

## After Import

Your content will be in:
- `public/data/talmud/*.json`
- `public/data/mishnah/*.json`
- `public/data/rambam/*.json`

Next step: Create reader pages to display this content!
(See Phase 3 in JEWISH_TEXTS_EXPANSION_PLAN.md)

## Help

```bash
node src/scripts/import-readings-content.js --help
```

## Example: Checking What Would Be Imported

If you want to see what the script would import without actually importing:

1. Edit `src/scripts/import-readings-content.js`
2. Find the `importReadingsContent()` function
3. Comment out this line:
   ```javascript
   // await this.importContent();  // <-- Comment this out
   ```
4. Run: `npm run import:readings`
5. You'll see the analysis results without doing the import
6. Uncomment the line when you're ready to import
