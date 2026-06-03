# Potential Issues Analysis

## Issues found:

### 1. Seder numbers out of range
- **Kings Seder 50**: Max is 47 (22 + 25) → should fail
- **Samuel Seder 60**: Max is 55 (31 + 24) → should fail  
- **Chronicles Seder 70**: Max is 65 (29 + 36) → should fail

### 2. Chapter numbers out of range
- **Genesis 51**: Max is 50 → should fail
- **Exodus 0**: Min is 1 → should fail
- **Psalms 151**: Max is 150 → should fail
- **Job 43**: Max is 42 → should fail

### 3. No validation
- There is no check whether the chapter number falls within book bounds
- There is no check whether verse numbers fall within chapter bounds
- Cross-chapter ranges are not validated

### 4. Edge cases
- Negative numbers
- Numbers that are too large
- Empty strings
- Special characters
- Name variants that are not recognized

## Solution:
Add validation in `generateReaderLink()` and `parseReference()` to check that:
1. Chapter number falls within book bounds
2. Verse numbers fall within chapter bounds
3. Seder numbers fall within total range
4. Error messages are returned instead of crashes
