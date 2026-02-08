# Sefer HaMitzvot Import Guide

## Overview

This guide explains how to import **Sefer HaMitzvot** (Book of Commandments) by Rambam. This is a separate work from Mishneh Torah that lists and explains the 613 commandments.

## What is Sefer HaMitzvot?

- **248 Positive Commandments** (Mitzvot Aseh)
- **365 Negative Commandments** (Mitzvot Lo Taaseh)
- **Total: 613 Mitzvot**

This work is referenced in the Daily Rambam study cycle as a separate program.

## Import Script

### Run the Import

```bash
npm run import:sefer-hamitzvot
```

This will:
1. Import "Sefer HaMitzvot, Positive Commandments" (248 mitzvot)
2. Import "Sefer HaMitzvot, Negative Commandments" (365 mitzvot)
3. Save files to `src/data/rambam/`
4. Create files:
   - `sefer_hamitzvot_positive_commandments.json`
   - `sefer_hamitzvot_negative_commandments.json`

### Estimated Time

- **Positive Commandments**: ~5-10 minutes (248 mitzvot)
- **Negative Commandments**: ~10-15 minutes (365 mitzvot)
- **Total**: ~15-25 minutes

### File Size

- **Estimated**: ~5-10 MB total
- Much smaller than Mishneh Torah (~100-150 MB)

## After Import

### Copy to Public Folder

After importing, copy the files to the public folder:

```bash
cp src/data/rambam/sefer_hamitzvot_*.json public/data/rambam/
```

Or copy all Rambam files:

```bash
cp -r src/data/rambam/*.json public/data/rambam/
```

### Rebuild

After copying files, rebuild the site:

```bash
npm run build
```

## How It Works

### Data Structure

Sefer HaMitzvot uses a different structure than Mishneh Torah:

**Mishneh Torah:**
```json
{
  "chapters": [
    {
      "chapter": 1,
      "halakhot": [...]
    }
  ]
}
```

**Sefer HaMitzvot:**
```json
{
  "mitzvot": [
    {
      "mitzvah": 1,
      "translations": {
        "hebrew": "...",
        "english": "..."
      }
    }
  ]
}
```

### Reader Support

The `rambam.html` reader has been updated to handle both structures:
- **Mishneh Torah**: Shows chapters with halakhot
- **Sefer HaMitzvot**: Shows mitzvot in pages of 50

### Link Generation

The `readings.html` page will automatically:
- Detect Sefer HaMitzvot references
- Generate internal links if files exist
- Fall back to Sefaria links if files don't exist

## Usage

Once imported, users can access Sefer HaMitzvot via:

```
/rambam.html?book=sefer_hamitzvot_positive_commandments&page=1
/rambam.html?book=sefer_hamitzvot_negative_commandments&page=1
```

The readings page will automatically link to these when "Positive Mitzvot" or "Negative Mitzvot" appear in daily readings.

## Troubleshooting

### Import Fails

- Check internet connection
- Verify Sefaria API is accessible
- Check for rate limiting (script includes delays)

### Files Not Showing

- Ensure files are copied to `public/data/rambam/`
- Rebuild the site: `npm run build`
- Check browser console for errors

### Links Not Working

- Verify file names match exactly:
  - `sefer_hamitzvot_positive_commandments.json`
  - `sefer_hamitzvot_negative_commandments.json`
- Check that files are in `public/data/rambam/` directory

## Next Steps

After importing:
1. ✅ Copy files to public folder
2. ✅ Rebuild site
3. ✅ Test links on readings page
4. ✅ Verify reader displays correctly
