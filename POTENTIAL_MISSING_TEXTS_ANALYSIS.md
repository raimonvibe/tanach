# Potential Missing Texts Analysis

## Overview
This document identifies other Jewish texts that might be referenced in the readings page but are not currently in our collection.

## Currently Handled ✅

### Daily Readings
- **Daf Yomi** (Talmud) - ✅ Partial (22/63 tractates)
- **Daily Mishnah** - ✅ Complete (63/63 tractates)
- **Daily Rambam** (Mishneh Torah) - ✅ Complete (91 files)
- **Chok LeYisrael** - ✅ Handled (links to Tanach/parashat)

### Yearly Cycles
- **929** - ✅ Complete (Tanach)
- **Tanakh Yomi** - ✅ Complete (Tanach)
- **Nach Yomi** - ✅ Complete (Tanach)
- **Psalms** - ✅ Complete (Tanach)
- **Pirkei Avot** - ⚠️ **CHECK NEEDED** (might be in Mishnah collection)

## Potentially Missing Texts

### 1. Pirkei Avot (Ethics of the Fathers)
**Status:** Likely available (part of Mishnah)
- **Location:** Mishnah tractate "Avot"
- **Check:** Should be in `public/data/mishnah/avot.json`
- **Action:** Verify it exists and is properly linked

### 2. Sefer HaMitzvot - Negative Commandments
**Status:** ❌ Not imported yet
- **Similar to:** Positive Commandments (which we just created script for)
- **Action:** Use same import script, or extend it to import both

### 3. Other Rambam Works (Less Likely)
- **Guide for the Perplexed** (Moreh Nevukhim) - Rarely in daily readings
- **Commentary on the Mishnah** - Usually referenced via Mishnah
- **Responsa** - Not typically in calendar readings

### 4. Shulchan Aruch (Code of Jewish Law)
**Status:** ❌ Not in collection
- **When referenced:** Sometimes in advanced study programs
- **Size:** Very large (~4 volumes)
- **Priority:** Low (not in standard daily readings)

### 5. Tanya (Chabad)
**Status:** ❌ Not in collection
- **When referenced:** In Chabad study cycles
- **Priority:** Low (specific to Chabad)

### 6. Zohar (Kabbalah)
**Status:** ❌ Not in collection
- **When referenced:** In Kabbalah study programs
- **Priority:** Low (not in standard daily readings)

### 7. Midrash Collections
**Status:** ❌ Not in collection
- **Examples:** Midrash Rabbah, Midrash Tanchuma
- **When referenced:** In advanced study programs
- **Priority:** Low (not in standard daily readings)

## Recommended Actions

### High Priority (Do Now)
1. ✅ **Sefer HaMitzvot - Negative Commandments**
   - Extend existing import script
   - Already have script structure
   - Estimated: 10-15 minutes

2. ✅ **Verify Pirkei Avot**
   - Check if `avot.json` exists in mishnah folder
   - Ensure it's properly linked in readings

### Medium Priority (Consider Later)
3. **Complete Talmud Collection**
   - Currently have 22/63 tractates
   - Missing ~41 tractates
   - Needed for complete Daf Yomi coverage

### Low Priority (Future)
4. **Shulchan Aruch** - Only if users request it
5. **Other works** - Only if they appear in readings

## How to Check What's Actually Referenced

### Method 1: Monitor Readings Page
Check the readings page over time to see what texts appear:
```javascript
// Add logging to readings.html
console.log('Calendar items:', calendarItems);
console.log('Missing links:', itemsWithoutLinks);
```

### Method 2: Query Sefaria API
Check what texts are in the calendar for next 365 days:
```bash
# Check what texts appear in calendar
curl "https://www.sefaria.org/api/calendars?date=2024-01-01" | jq '.calendar_items[].title.en' | sort | uniq
```

### Method 3: Check Error Logs
Monitor for 404 errors or "book not found" messages in:
- Browser console
- Server logs (if applicable)
- User reports

## Quick Fix Script

Create a script to check what's missing:

```javascript
// check-missing-texts.js
// Analyzes readings for next 365 days and reports missing texts
```

## Summary

**Most Likely Missing:**
1. ✅ Sefer HaMitzvot - Negative Commandments (we have script now)
2. ⚠️ Pirkei Avot (probably have it, just need to verify)
3. ⚠️ Some Talmud tractates (22/63, but may not all be needed)

**Unlikely to Need:**
- Shulchan Aruch (not in standard daily readings)
- Tanya (Chabad-specific)
- Zohar (Kabbalah-specific)
- Midrash (advanced study)

**Recommendation:**
1. Import Sefer HaMitzvot (both positive and negative)
2. Verify Pirkei Avot is accessible
3. Monitor readings page for any other missing texts
4. Import additional texts only as needed
