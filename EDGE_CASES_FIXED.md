# Edge Cases Gefixed

## Nieuwe Validaties Toegevoegd:

### 1. Whitespace Normalisatie
- ✅ Meerdere spaces → enkele space
- ✅ Tabs → spaces
- ✅ Newlines → spaces
- ✅ HTML entities (&nbsp;, &amp;, etc.) → normale karakters

### 2. Verse Nummer Validatie
- ✅ Verse nummers moeten >= 1 zijn
- ✅ Verse ranges mogen niet reversed zijn (10-5 is invalid)
- ✅ Verse 0 wordt afgevangen
- ✅ Negatieve verse nummers worden afgevangen

### 3. Cross-Chapter Range Validatie
- ✅ End chapter >= start chapter
- ✅ Als zelfde chapter, end verse >= start verse
- ✅ Alle nummers moeten positief zijn

### 4. HTML Content Handling
- ✅ HTML tags worden verwijderd uit display text
- ✅ HTML entities worden gedecodeerd
- ✅ Whitespace wordt genormaliseerd

### 5. Sefaria URL Parsing Verbeteringen
- ✅ Handelt full URLs en relative paths af
- ✅ Roman numerals in book names (I_Kings → I Kings)
- ✅ Error handling voor malformed URLs
- ✅ Validatie van chapter nummers

### 6. Edge Cases Afgehandeld
- ✅ Lege strings
- ✅ Alleen whitespace
- ✅ Alleen nummers (geen book name)
- ✅ Incomplete references (Genesis 1:, Genesis 1:1-)
- ✅ Speciale karakters
- ✅ URL encoding voor book IDs

## Nog Te Valideren (Requires Book Data Loading):

### Verse Limits Per Chapter
- ⚠️ "Genesis 1:100" zou moeten falen (hoofdstuk 1 heeft maar 31 verzen)
- ⚠️ Dit vereist het laden van boek data om te valideren
- 💡 Kan worden toegevoegd in `generateReaderLink()` door async book data te laden
- 💡 Of in `loadChapter()` in reader.js waar data al geladen is

### Cross-Chapter Verse Validation
- ⚠️ "Genesis 1:1-2:100" zou moeten falen als hoofdstuk 2 maar 25 verzen heeft
- 💡 Vereist validatie tegen beide hoofdstukken

## Aanbevelingen Voor Toekomst:

1. **Async Verse Validation**: Laad boek data in `generateReaderLink()` om verse limits te valideren
2. **Caching**: Cache verse limits per hoofdstuk voor snellere validatie
3. **User Feedback**: Toon betere error messages aan gebruikers in plaats van alleen console warnings
4. **Fallback Links**: Als verse range invalid is, link naar hoofdstuk in plaats van foutmelding
