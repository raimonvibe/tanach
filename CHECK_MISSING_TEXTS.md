# Check for Missing Texts in Readings

## Quick Analysis

Based on the readings page structure, here are texts that might be referenced:

### ✅ Already Have
1. **Pirkei Avot** - ✅ Exists (`avot.json` in mishnah folder)
2. **Mishnah** - ✅ Complete (63 tractates)
3. **Mishneh Torah** - ✅ Complete (91 files)
4. **Talmud** - ✅ Partial (22 tractates, covers current Daf Yomi)

### ❌ Missing (Known)
1. **Sefer HaMitzvot - Negative Commandments** 
   - Script exists but not yet run
   - Run: `npm run import:sefer-hamitzvot`
   - This imports BOTH positive and negative

### ⚠️ Potentially Missing (Need to Monitor)

**Other texts that might appear in Sefaria calendar:**
- **Shulchan Aruch** - Code of Jewish Law (very large, ~4 volumes)
- **Tanya** - Chabad text (Chabad study cycles)
- **Zohar** - Kabbalistic text (not in standard daily readings)
- **Midrash** - Various collections (advanced study)

## How to Check What's Actually Needed

### Method 1: Test the Readings Page
Visit the readings page and check what links are generated:
- Green links = Working ✅
- No link or error = Missing ❌

### Method 2: Check Sefaria Calendar API
```bash
# Check what texts appear in calendar
curl "https://www.sefaria.org/api/calendars?date=$(date +%Y-%m-%d)" | \
  jq '.calendar_items[] | select(.url != null) | .url' | \
  sort | uniq
```

### Method 3: Monitor Browser Console
Add logging to see what's being referenced:
```javascript
// In readings.html, add:
console.log('All calendar items:', calendarItems);
console.log('Items without links:', itemsWithoutLinks);
```

## Recommended Next Steps

1. **Run Sefer HaMitzvot import** (if not done):
   ```bash
   npm run import:sefer-hamitzvot
   cp src/data/rambam/sefer_hamitzvot_*.json public/data/rambam/
   ```

2. **Verify Pirkei Avot links work**:
   - Check if readings page links to `/mishnah.html?tractate=avot&chapter=X`
   - Should work since `avot.json` exists

3. **Monitor for other missing texts**:
   - Watch for any "book not found" errors
   - Check user feedback
   - Review Sefaria calendar data periodically

## Current Status Summary

| Text | Status | Action Needed |
|------|--------|---------------|
| Tanach | ✅ Complete | None |
| Mishnah | ✅ Complete | None |
| Mishneh Torah | ✅ Complete | None |
| Talmud | ⚠️ Partial (22/63) | Import missing if needed |
| Sefer HaMitzvot (Positive) | ❌ Missing | Run import script |
| Sefer HaMitzvot (Negative) | ❌ Missing | Run import script |
| Pirkei Avot | ✅ Have it | Verify links work |

## Most Likely Scenario

Based on standard Jewish daily study programs, you probably only need:
1. ✅ Sefer HaMitzvot (both parts) - **Action: Run import script**
2. ⚠️ Additional Talmud tractates - Only if current Daf Yomi cycle needs them

Other texts (Shulchan Aruch, Tanya, Zohar) are unlikely to appear in standard daily readings.
