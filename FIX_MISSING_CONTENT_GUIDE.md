# Fix Missing Content - Guide

## What This Does

After importing Talmud/Mishnah/Rambam, some pages or verses might be missing or empty (like the page 35b example you found). This script:

1. ✅ **Scans** all imported JSON files
2. 🔍 **Finds** pages/verses with empty or very short content (<10 characters)
3. 📥 **Re-downloads** missing content from Sefaria API
4. 💾 **Updates** the JSON files with complete content

## When to Use This

Run this script:
- **After** running `npm run import:readings` or any import command
- When you notice missing content (like empty pages)
- To verify data integrity before deploying

## How to Run

```bash
npm run fix:missing
```

That's it!

## What You'll See

```
🔍 CONTENT INTEGRITY CHECKER & FIXER
==================================================
Scanning all imported files for missing content...

📖 Scanning Talmud...
  Found 15 missing pages

📜 Scanning Mishnah...
  Found 3 missing mishnayot

📚 Scanning Rambam...
  Found 0 missing sections

📊 SCAN RESULTS
==================================================

📖 Talmud: 15 pages with missing content
  - Rosh Hashanah 35b (Hebrew, English)
  - Berakhot 12a (English)
  - Shabbat 45b (Hebrew, English)
  ... etc

📜 Mishnah: 3 mishnayot with missing content
  - Berakhot 2:3 (English)
  - Chullin 7:6 (Hebrew, English)

📚 Rambam: 0 sections with missing content

💾 FIXING MISSING CONTENT
==================================================

📖 Fixing 15 Talmud pages...

  Fixing rosh_hashanah.json (3 pages)...
    ✅ Fixed 35b
    ✅ Fixed 36a
    ✅ Fixed 36b
  💾 Saved rosh_hashanah.json

  Fixing berakhot.json (2 pages)...
    ✅ Fixed 12a
    ✅ Fixed 13b
  💾 Saved berakhot.json

  ... etc

📜 Fixing 3 Mishnah items...

  Fixing berakhot.json (1 mishnayot)...
    ✅ Fixed 2:3
  💾 Saved berakhot.json

  ... etc

🎉 SCAN COMPLETE!
==================================================
✅ Fixed: 18
❌ Errors: 0
```

## Example: The Page 35b Issue

You found that Rosh Hashanah page 35b was empty:
```json
{
  "page": "35b",
  "pageNumber": 35,
  "side": "b",
  "content": {
    "hebrew": "",
    "english": ""
  }
}
```

This script will:
1. Detect that both Hebrew and English are empty
2. Fetch from Sefaria: `Rosh Hashanah 35b`
3. Update the JSON with the correct content
4. Save the file

## What It Checks

### Talmud
- Scans all pages in each tractate
- Checks if `content.hebrew` or `content.english` is empty or <10 chars

### Mishnah
- Scans all chapters and mishnayot
- Checks if `translations.hebrew` or `translations.english` is empty or <10 chars

### Rambam
- Scans all sections
- Checks if `content.hebrew` or `content.english` is empty or <10 chars

## Time Estimate

- **Scanning**: 1-2 minutes (fast, just reading files)
- **Fixing**: Depends on how many are missing
  - 10 items: ~1-2 minutes
  - 100 items: ~10-15 minutes
  - 1000 items: ~1-2 hours

## If Everything Is Good

If no missing content is found:
```
✅ No missing content found! All files are complete.
```

## Troubleshooting

### If the script fails halfway:

Just run it again! It will:
- Re-scan all files
- Find remaining missing items
- Continue fixing

### If some items can't be fetched:

The script will show errors like:
```
❌ Could not fetch Berakhot 5b
```

Possible reasons:
- Sefaria API is down (temporary)
- That specific page doesn't exist in Sefaria
- Network issue

Wait a bit and run the script again.

### To see what would be fixed without fixing:

1. Edit `src/scripts/fix-missing-content.js`
2. Comment out the fixing section:
   ```javascript
   // await this.fixMissingContent();  // <-- Comment this
   ```
3. Run: `npm run fix:missing`
4. See the scan results without making changes

## Best Practice Workflow

1. **Import content:**
   ```bash
   npm run import:readings
   ```

2. **Check for missing content:**
   ```bash
   npm run fix:missing
   ```

3. **Copy to public folder:**
   ```bash
   cp -r src/data/talmud/*.json public/data/talmud/
   cp -r src/data/mishnah/*.json public/data/mishnah/
   cp -r src/data/rambam/*.json public/data/rambam/
   ```

4. **Test your site:**
   ```bash
   npm run dev
   ```

## Files Modified

The script modifies files in:
- `src/data/talmud/*.json`
- `src/data/mishnah/*.json`
- `src/data/rambam/*.json`

**Backup tip:** Before running, you can backup these directories:
```bash
cp -r src/data src/data.backup
```

## Help

```bash
node src/scripts/fix-missing-content.js --help
```
