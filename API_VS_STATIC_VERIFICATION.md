# Verificatie: API vs Static File Access

## Huidige Situatie

### 1. Static File Access (Production/Vercel)
- **Locatie**: `public/data/books/` → `dist/data/books/`
- **Gebruikt door**: `books-service.js` via `fetch('/data/books/${category}/${bookId}.json')`
- **Werkt op**: Vercel (static hosting)
- **Voordeel**: Geen server nodig, sneller, goedkoper

### 2. API Endpoints (Development Server)
- **Locatie**: `src/data/books/`
- **Gebruikt door**: `src/server.js` Express API endpoints
- **Endpoints**:
  - `GET /api/books` - Alle boeken
  - `GET /api/books/:category` - Boeken per categorie
  - `GET /api/books/:category/:bookId` - Specifiek boek
  - `GET /api/books/:category/:bookId/:chapter` - Specifiek hoofdstuk
- **Werkt op**: Development server (npm run server)
- **Voordeel**: Kan server-side processing doen, caching, etc.

## Belangrijk: Beide Systemen Gebruiken dezelfde Data

✅ **Beide systemen lezen van dezelfde JSON bestanden**
- `public/data/books/` (voor static hosting)
- `src/data/books/` (voor API server)

✅ **Data structuur is identiek**
- Beide gebruiken dezelfde JSON structuur
- Beide hebben dezelfde categorieën en boeken

## Hoe het werkt

### In Development:
1. Express server serveert `public/` als static files
2. `books-service.js` fetcht `/data/books/...` → werkt via static file serving
3. API endpoints zijn beschikbaar maar worden **niet gebruikt** door frontend

### In Production (Vercel):
1. Vercel serveert `dist/` als static files
2. `books-service.js` fetcht `/data/books/...` → werkt via static file serving
3. API endpoints zijn **niet beschikbaar** (geen server)

## Conclusie

✅ **Beide systemen werken correct en onafhankelijk:**
- Static file access werkt in beide omgevingen
- API endpoints zijn optioneel voor toekomstige features
- Geen conflict tussen beide systemen
- Data blijft gesynchroniseerd omdat beide dezelfde source gebruiken

## Aanbeveling

De huidige setup is correct:
- ✅ Static files voor production (Vercel)
- ✅ API endpoints voor development (optioneel)
- ✅ Beide gebruiken dezelfde data structuur
- ✅ Geen verwarring in de code - frontend gebruikt altijd static files
