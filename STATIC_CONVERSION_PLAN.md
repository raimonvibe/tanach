# Static Site Conversion Plan

## Overview
Converting from Node.js/Express server to fully static site using Vite bundler.

## Benefits
- ✅ No server required - deploy anywhere (GitHub Pages, Netlify, Vercel)
- ✅ Free hosting options
- ✅ Faster after initial load (no API calls)
- ✅ Works offline once cached
- ✅ Simpler deployment

## Architecture Change

### Before (Server-based):
```
Browser → Express Server → Hebcal APIs → JSON Response → Browser
         (server.js)        (Node.js)
```

### After (Static):
```
Browser → Bundled JavaScript → Hebcal (in browser) → Direct DOM updates
         (Vite build)
```

## Implementation Steps

### 1. Install Vite
```bash
npm install --save-dev vite
```

### 2. Create Frontend JavaScript Modules
- `public/js/hebcal-service.js` - Calendar calculations
- `public/js/calendar-ui.js` - Calendar rendering
- `public/js/search.js` - Search functionality (keep existing)

### 3. Update package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 4. Create vite.config.js
Configure for multi-page app (index.html, reader.html, calendar.html)

### 5. Move Logic to Frontend
- Calendar calculations
- Torah readings
- Times (candle lighting, havdalah, etc.)
- Hebrew date conversions

### 6. Keep Static Assets
- Book JSON files (already static)
- Images, icons
- CSS (inline in HTML)

## Files to Modify

### New Files:
- `vite.config.js` - Vite configuration
- `public/js/hebcal-service.js` - Hebcal wrapper
- `public/js/calendar-ui.js` - Calendar UI logic

### Modified Files:
- `package.json` - Update scripts
- `public/calendar.html` - Use modules
- `public/index.html` - Use modules for search

### Files to Keep:
- All book JSON data
- `public/reader.html`
- `public/index.html`
- Images and assets

### Files No Longer Needed:
- `src/server.js` - Can be archived/deleted
- Express dependency

## Deployment Options

### Option 1: GitHub Pages (Free)
```bash
npm run build
# Upload dist/ folder to gh-pages branch
```

### Option 2: Netlify (Free)
- Connect GitHub repo
- Build command: `npm run build`
- Publish directory: `dist`

### Option 3: Vercel (Free)
- Same as Netlify
- Automatic deployments on push

## Testing Plan

1. ✅ Calendar displays correctly
2. ✅ Torah readings update weekly
3. ✅ Times calculate accurately
4. ✅ Hebrew dates show properly
5. ✅ Search works
6. ✅ Month navigation works
7. ✅ All pages load independently

## Bundle Size Estimate
- @hebcal/core: ~150KB
- @hebcal/leyning: ~50KB
- Your code: ~20KB
- **Total**: ~220KB (acceptable for modern web)

## Rollback Plan
If issues arise:
- Keep `src/server.js` in repo (don't delete yet)
- Can switch back by running `npm start`
- Gradual migration possible (keep both versions)
