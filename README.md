# Tanach Reader

![Jewish Bible](public/jewish-bible.png)

**Live Website:** [https://tanach.vercel.app/](https://tanach.vercel.app/)

## Over dit project

Tanach Reader is een online applicatie voor het lezen van de Joodse Bijbel (Tanach) in zowel Hebreeuws als Engels. De applicatie biedt een gebruiksvriendelijke interface voor het bestuderen van de heilige teksten.

## Functionaliteiten

- 📖 **Tanach Reader**: Lees alle boeken van de Tanach in Hebreeuws en Engels
- 📅 **Joodse Kalender**: Bekijk de Joodse kalender met belangrijke data en feestdagen
- 🔍 **Zoekfunctie**: Zoek door de teksten in Hebreeuws of Engels
- 📊 **Statistieken**: Overzicht van alle boeken, hoofdstukken en verzen
- 📱 **Responsive Design**: Werkt op desktop, tablet en mobiel

## Technologie

- **Fully Static Site** - No server required!
- **Vite** - Modern build tool and dev server
- **@hebcal/core & @hebcal/leyning** - Accurate Jewish calendar calculations
- **Sefaria.org** API voor authentieke Joodse teksten
- **Responsive Design** - Werkt op alle apparaten

## Gebruik

Bezoek [https://tanach.vercel.app/](https://tanach.vercel.app/) om de applicatie te gebruiken.

## Lokaal Ontwikkelen

```bash
# Installeer dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build voor productie
npm run build

# Preview production build
npm run preview
```

## Deployment

De site is volledig statisch en kan gehost worden op:
- **GitHub Pages**
- **Netlify** - Automatische deployments
- **Vercel** - Automatische deployments
- Elke static hosting service

Build command: `npm run build`
Output directory: `dist/`

## Licentie

Dit project gebruikt teksten van Sefaria.org

---

&copy; 2024 Tanach Reader
