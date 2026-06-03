# Tanach Reader

![Jewish Bible](public/jewish-bible.png)

**Live website:** [https://tanach.vercel.app/](https://tanach.vercel.app/)

## About this project

Tanach Reader is an online application for reading the Jewish Bible (Tanach) in both Hebrew and English. It offers a user-friendly interface for studying the sacred texts.

## Features

- 📖 **Tanach Reader**: Read all books of the Tanach in Hebrew and English
- 📅 **Jewish Calendar**: View the Jewish calendar with important dates and holidays
- 📚 **Reading Schedule**: Follow the weekly Torah and Haftarah readings
- 🔍 **Search**: Search through the texts in Hebrew or English
- 📊 **Statistics**: Overview of all books, chapters, and verses
- 📱 **Responsive design**: Works on desktop, tablet, and mobile

## Technology

- **Fully static site** — no server required
- **Vite** — modern build tool and dev server
- **@hebcal/core & @hebcal/leyning** — accurate Jewish calendar calculations
- **Sefaria.org** API for authentic Jewish texts
- **Responsive design** — works on all devices

## Usage

Visit [https://tanach.vercel.app/](https://tanach.vercel.app/) to use the application.

## Local development

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

The site is fully static and can be hosted on:

- **GitHub Pages**
- **Netlify** — automatic deployments
- **Vercel** — automatic deployments
- Any static hosting service

Build command: `npm run build`  
Output directory: `dist/`

## License

This project uses texts from Sefaria.org.

---

&copy; 2024 Tanach Reader
