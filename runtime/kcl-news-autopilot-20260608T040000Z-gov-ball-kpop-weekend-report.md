# KCL News Autopilot Report

- Workflow: kcl-news-autopilot
- Run ID: kcl-news-autopilot-20260608T040000Z
- Slug: gov-ball-kpop-weekend
- Run started: 2026-06-08T13:00:00+09:00
- Status: IN_PROGRESS (local gates passed; deploy/GSC pending)

## Research Gate

PASS. Selected topic: Governors Ball 2026 K-pop weekend — Stray Kids, Jennie, and KATSEYE as a three-act NYC festival test.

Excluded stale/current slugs: `stray-kids-gov-ball-seven`, `june-kpop-comeback-pileup`.

Primary evidence URLs are recorded in `runtime/kcl-news-autopilot-20260608T040000Z-gov-ball-kpop-weekend-evidence.json`.

## Content Gate

PASS.

- Article: `src/content/news/en/gov-ball-kpop-weekend.md`
- Title: Gov Ball Just Became K-pop’s Weekend — 3 Acts, One NYC Test Nobody Can Ignore
- Word count: 1595 words
- Structure: 6 H2 sections and 11 H3 subsections
- Excerpt length: 131 characters
- Internal link: `/en/news/stray-kids-gov-ball-seven`
- Encoding check: 0 broken replacement characters
- Active: true after fact-check and image placement

## Image Gate

PASS.

- ChatGPT thumbnail download: `/home/mhhan/Downloads/ChatGPT_Generated_Image_gov-ball-kpop-weekend_thumbnail_2026-06-08T04-09-48-489Z.png`
- ChatGPT body download: `/home/mhhan/Downloads/ChatGPT_Generated_Image_gov-ball-kpop-weekend_body_2026-06-08T04-11-14-061Z.png`
- Resource thumbnail: `/home/mhhan/workspace/.resource/gov-ball-kpop-weekend-thumbnail.png`
- Resource body: `/home/mhhan/workspace/.resource/gov-ball-kpop-weekend-1.png`
- Final thumbnail: `public/images/news/gov-ball-kpop-weekend-thumbnail.png`
- Final body: `public/images/news/gov-ball-kpop-weekend-1.png`
- Reuse check: PASS. Both final image hashes match this run's ChatGPT downloads and were placed after run start.
- Visual QA: PASS. No readable text, logos, watermarks, or identifiable faces.

## ChatGPT 생성 증빙

- prompt_thumbnail: Generate exactly one cinematic, photorealistic editorial news thumbnail image in 16:9 aspect ratio, 1200x675px. Scene: a massive outdoor New York City music festival at dusk, purple and electric-blue stage lights, diverse crowd silhouettes holding phones, the feeling of global pop and K-pop taking over one weekend. No recognizable artists, no identifiable faces, no logos, no readable text, no watermark. High quality, dramatic lighting, professional news photography, 8k detail.
- prompt_body: Generate exactly one dramatic professional editorial image in 16:9 aspect ratio, 1200x675px. Scene: an overhead festival strategy table blending a concert stage map, glowing smartphones, fan-engagement dashboards, wristbands and streaming signals, symbolizing K-pop festival economics at a major New York music festival. No real people, no identifiable faces, no logos, no readable text, no watermark. Cinematic lighting, high quality, professional news photography, 8k detail.
- raw_download_1: /home/mhhan/Downloads/ChatGPT_Generated_Image_gov-ball-kpop-weekend_thumbnail_2026-06-08T04-09-48-489Z.png (2026-06-08T04:09:48.557Z)
- raw_download_2: /home/mhhan/Downloads/ChatGPT_Generated_Image_gov-ball-kpop-weekend_body_2026-06-08T04-11-14-061Z.png (2026-06-08T04:11:14.111Z)
- final_thumbnail: /images/news/gov-ball-kpop-weekend-thumbnail.png (2026-06-08T13:09:48.531312+09:00)
- final_body: /images/news/gov-ball-kpop-weekend-1.png (2026-06-08T13:11:14.082965+09:00)
- reuse_check: PASS

## Factcheck Gate

PASS. Verification rate: 6/6 core claims (100%). Fix: 0. Remove: 0.

See `runtime/kcl-news-autopilot-20260608T040000Z-gov-ball-kpop-weekend-factcheck.md`.

## Local Render Gate

PASS.

- Build: `pnpm build` completed successfully.
- Metadata/API: `src/generated/news-meta.json` and `public/api/news.json` contain `gov-ball-kpop-weekend`.
- Page: `http://127.0.0.1:4180/en/news/gov-ball-kpop-weekend.html` -> HTTP 200.
- Original images: thumbnail/body -> HTTP 200.
- Optimizer images: `gov-ball-kpop-weekend-thumbnail-opt-800.WEBP` and `gov-ball-kpop-weekend-1-opt-800.WEBP` -> HTTP 200.
- Playwright image check: thumbnail and body image both loaded at 800x450.
- Screenshot: `runtime/kcl-news-autopilot-20260608T040000Z-gov-ball-kpop-weekend-local-body.png`.
- Local console notes: Google Ads 403 and existing Supabase env errors appeared on localhost; they did not block article or image rendering.
- Lint note: `pnpm lint` currently fails on pre-existing unrelated repo lint errors; article-specific content/build gates passed.

## Deploy Gate

PENDING.

## GSC Gate

PENDING.

## Final Status

IN_PROGRESS.

Pass stages so far: Research, Content, Image, Factcheck, Local Render.
