# Potentiële Problemen Analyse

## Gevonden Problemen:

### 1. Seder Nummers Buiten Bereik
- **Kings Seder 50**: Max is 47 (22 + 25) → zou moeten falen
- **Samuel Seder 60**: Max is 55 (31 + 24) → zou moeten falen  
- **Chronicles Seder 70**: Max is 65 (29 + 36) → zou moeten falen

### 2. Hoofdstuknummers Buiten Bereik
- **Genesis 51**: Max is 50 → zou moeten falen
- **Exodus 0**: Min is 1 → zou moeten falen
- **Psalms 151**: Max is 150 → zou moeten falen
- **Job 43**: Max is 42 → zou moeten falen

### 3. Geen Validatie
- Er is geen check of hoofdstuknummer binnen boekgrenzen valt
- Er is geen check of verse nummers binnen hoofdstukgrenzen vallen
- Cross-chapter ranges worden niet gevalideerd

### 4. Edge Cases
- Negatieve nummers
- Te grote nummers
- Lege strings
- Speciale karakters
- Verschillende naamvarianten die niet worden herkend

## Oplossing:
Voeg validatie toe in `generateReaderLink()` en `parseReference()` om te controleren of:
1. Hoofdstuknummer binnen boekgrenzen valt
2. Verse nummers binnen hoofdstukgrenzen vallen
3. Seder nummers binnen totale bereik vallen
4. Foutmeldingen worden gegeven in plaats van crashes
