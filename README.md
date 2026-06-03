#  Tanach Reader

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

**Live site:** [tanach.vercel.app](https://tanach.vercel.app/)

Build command: `npm run build`  
Output directory: `dist/`  
Node.js: **20.19+** (see `.nvmrc`)

### Vercel (recommended)

If pushes to `main` on GitHub do not update the live site, the Vercel ↔ GitHub link is usually disconnected.

1. Open [vercel.com](https://vercel.com) → your **tanach** project → **Settings** → **Git**
2. Connect repository `raimonvibe/tanach`, production branch **`main`**
3. Click **Deployments** → **Redeploy** on the latest commit (or push again)

Ensure the project uses **Node.js 20** (Project Settings → General → Node.js Version).

### GitHub Actions (optional backup)

Workflow: `.github/workflows/vercel-deploy.yml`

- **Always runs:** `npm run build` on every push to `main` (CI passes without Vercel credentials).
- **Deploy job:** skipped on push unless you enable it (see below). You can also run deploy manually via **Actions** → **Deploy to Vercel** → **Run workflow**.

**1. Repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Where to find it |
|--------|------------------|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Vercel → Account/Team Settings → General (Team ID) |
| `VERCEL_PROJECT_ID` | Project → Settings → General → Project ID |

**2. Repository variable** (Settings → Secrets and variables → Actions → **Variables**):

| Variable | Value |
|----------|--------|
| `VERCEL_DEPLOY_ENABLED` | `true` |

Set the variable only after all three secrets exist. That turns on automatic deploy on every push to `main`. Without it, only the build job runs on push (no failed deploy).

Until this is configured, rely on **Vercel Git integration** (recommended above) for production deploys.

## License

This project uses texts from Sefaria.org.

---

&copy; 2024 Tanach Reader
