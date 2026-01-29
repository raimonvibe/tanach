# Current Content Status

## What You Already Have ✅

### Mishnah: Complete! 🎉
- **63 tractates** (All of them!)
- **Size**: ~50-100 MB
- **Location**: `src/data/mishnah/`
- **Status**: Ready to use!

Tractates include:
- Berakhot, Peah, Demai, Kilayim, Sheviit, Terumot, Maasrot, etc.
- All 6 orders: Zeraim, Moed, Nashim, Nezikin, Kodashim, Tahorot

### Rambam: Complete! 🎉
- **14 books** (All of Mishneh Torah!)
- **Size**: ~100-150 MB
- **Location**: `src/data/rambam/`
- **Status**: Ready to use!

Books include:
- Knowledge, Love, Times, Women, Holiness, Utterances, Seeds
- Service, Sacrifices, Purity, Damages, Acquisition, Judgments, Judges

### Talmud: Partial
- **20 tractates** (out of 63 total)
- **Size**: ~200-250 MB
- **Location**: `src/data/talmud/`

Tractates you have:
- Berakhot, Shabbat, Eruvin, Pesachim, Shekalim, Yoma
- Sukkah, Beitzah, Rosh Hashanah, Taanit, Megillah, Moed Katan
- Chagigah, Yevamot, Ketubot, Nedarim, Nazir, Gittin, Kiddushin, Sotah

## What Happens When You Run `npm run import:readings`

The smart script will:

1. ✅ **Check existing files** (see above)
2. 🔍 **Analyze next 365 days** of calendar
3. 📊 **Show you what's needed** vs what you have
4. ⏭️ **Skip all Mishnah** (already complete!)
5. ⏭️ **Skip all Rambam** (already complete!)
6. 📥 **Import only missing Talmud tractates** needed for Daf Yomi

## Estimated Results

Based on current Daf Yomi cycle (2020-2027), you'll likely need:

- **Additional Talmud tractates**: ~20-30 more
- **Time**: 1-2 hours (only Talmud import)
- **Space**: ~250-350 MB (additional)
- **Total after**: ~400-600 MB (much smaller than 1.5 GB!)

## Next Steps

### Option 1: Run the Smart Import (Recommended)
```bash
npm run import:readings
```

This will:
- Skip your 63 Mishnah tractates ✅
- Skip your 14 Rambam books ✅
- Import only missing Talmud tractates needed for readings

### Option 2: Copy to Public Folder (If you're done importing)
```bash
# Copy everything to public folder for website access
cp -r src/data/mishnah/*.json public/data/mishnah/
cp -r src/data/talmud/*.json public/data/talmud/
cp -r src/data/rambam/*.json public/data/rambam/
```

### Option 3: Import Remaining Talmud (If you want everything)
```bash
npm run import:talmud
```

This would import ALL 63 Talmud tractates (~500-800 MB, 2-3 hours)
But you probably don't need all of them for the readings!

## File Sizes

Current content:
```
src/data/mishnah/    ~50-100 MB  (63 files)
src/data/talmud/     ~200-250 MB (20 files)
src/data/rambam/     ~100-150 MB (14 files)
-----------------------------------------
Total:               ~350-500 MB
```

After smart import (estimated):
```
src/data/mishnah/    ~50-100 MB  (63 files) - unchanged
src/data/talmud/     ~400-500 MB (40-50 files) - add ~250 MB
src/data/rambam/     ~100-150 MB (14 files) - unchanged
-----------------------------------------
Total:               ~550-750 MB
```

Much better than 1.5 GB! 🎉

## Quick Test (Optional)

Want to see what would be imported without actually importing?

1. Edit `src/scripts/import-readings-content.js`
2. Comment out line 39: `// await this.importContent();`
3. Run: `npm run import:readings`
4. See the analysis without importing
5. Uncomment when ready to import

## Questions?

Check:
- `IMPORT_READINGS_GUIDE.md` - How to use the import script
- `READINGS_CONTENT_ANALYSIS.md` - What readings need which texts
- `JEWISH_TEXTS_EXPANSION_PLAN.md` - Original expansion plan
