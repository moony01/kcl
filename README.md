# MEARROW — K-pop Talent Network

> Content becomes opportunity. A K-pop talent network with community voting, news, and multilingual support.

[![Live](https://img.shields.io/badge/Live-mearrow.com-blue)](https://mearrow.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Cloudflare Pages](https://img.shields.io/badge/Hosted%20on-Cloudflare%20Pages-F38020.svg?logo=cloudflare)](https://mearrow.com/)

🌐 **Live**: https://mearrow.com

---

## About

MEARROW is a K-pop talent network where content, community, and opportunity connect. Its initial community layer includes fan-driven company rankings: users vote each month to determine which companies lead the 1st and 2nd divisions of the league. At the end of each season, promotion and relegation are applied automatically, and a Hall of Fame records each month's champion.

## Features

- **Company Rankings** — Real-time league standings across 1st and 2nd divisions
- **Season League** — Monthly season cycle with promotion/relegation between divisions
- **Firepower Voting** — Community votes drive company rankings each season
- **Hall of Fame** — Monthly champions recorded permanently
- **Multilingual** — 7 languages: Korean, English, Japanese, Chinese, Spanish, French, German
- **PWA** — Installable as a Progressive Web App
- **SEO Optimized** — Static export with full sitemap, Open Graph, and structured data

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, static export) |
| **Database** | Supabase (PostgreSQL) |
| **Hosting** | Cloudflare Pages |
| **i18n** | next-intl (7 languages) |
| **Styling** | SCSS Modules |
| **Animation** | Framer Motion |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod |
| **PWA** | Web Manifest |

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 10+

### Setup

```bash
git clone https://github.com/moony01/kcl.git
cd kcl

pnpm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
pnpm build
```

Output is generated in the `out/` directory (static export for Cloudflare Pages).

## Project Structure

```
kcl/
├── src/
│   ├── app/
│   │   ├── [locale]/        # Localized routes (7 languages)
│   │   │   ├── company/     # Company detail pages
│   │   │   ├── hall-of-fame/# Season champions
│   │   │   ├── news/        # K-Pop news
│   │   │   ├── community/   # Community board
│   │   │   └── ...
│   ├── components/          # Shared UI components
│   ├── config/              # Feature flags
│   ├── i18n/                # next-intl configuration
│   ├── messages/            # Translation files (ko, en, ja, zh, es, fr, de)
│   ├── lib/                 # Supabase client, utilities
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
├── supabase/                # DB migrations and functions
└── .github/workflows/       # Automated monthly season settlement
```

## Deployment

Deployed on Cloudflare Pages as a fully static site (`output: 'export'`).

Production deployment is browser-gated. Never run a direct Pages upload from a
shell that does not have the public Supabase variables loaded; the static client
would render the site shell but cannot load live league data.

```bash
pnpm check:deploy-env
DEPLOY_BROWSER_PATH=/path/to/chrome pnpm test:browser:deploy
pnpm build
pnpm exec wrangler pages deploy out --project-name kcl --branch main
```

`test:browser:deploy` starts the development server, checks that live Supabase
data renders company cards, verifies a news image is WebP-backed, and checks an
English news detail through the locale fallback. A failed browser gate blocks
the production deployment. The GitHub Actions workflow
`.github/workflows/deploy-pages.yml` runs the same gate before a manual Pages
production deployment.

The `.github/workflows/kcl-league-promotion.yml` workflow runs on the 1st of every month (UTC 00:00) to:
1. Snapshot season rankings
2. Record the monthly champion
3. Execute league promotion + reset firepower

## License

[MIT](LICENSE) — Copyright (c) 2026 moony01
