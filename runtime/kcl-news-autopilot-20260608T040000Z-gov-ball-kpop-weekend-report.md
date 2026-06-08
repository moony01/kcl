# KCL News Autopilot Report

- Workflow: kcl-news-autopilot
- Run ID: kcl-news-autopilot-20260608T040000Z
- Slug: gov-ball-kpop-weekend
- Run started: 2026-06-08T13:00:00+09:00
- Run ended: 2026-06-08T13:46:46+09:00
- Status: SUCCESS

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

PASS.

- Commit: `2f9b521ef5d9e4cfff2be91144117e26d9943587`
- PR: https://github.com/moony01/kcl/pull/10
- Merge commit: `2499683b4fa0701d79870be0aa38d8a0dda20625`
- Cloudflare Pages production check: PASS on merge commit.
- Cloudflare details: https://dash.cloudflare.com/?to=/e39b8478141c206ed1752bb486fdd8eb/pages/view/kcl/45ee8e4b-6d3d-4af0-8d0f-847f9770b6c0
- Live URL: `https://www.kclhq.com/en/news/gov-ball-kpop-weekend` -> HTTP 200 with title/content hits.
- Remote original images: thumbnail/body -> HTTP 200.
- Remote optimizer images: thumbnail/body -> HTTP 200.
- Remote API: `https://www.kclhq.com/api/news.json` contains `gov-ball-kpop-weekend`.
- Playwright deployed image check: thumbnail and body image both loaded at 800x450.
- Screenshot: `runtime/kcl-news-autopilot-20260608T040000Z-gov-ball-kpop-weekend-deployed-body.png`.

## GSC Gate

PASS.

- Property: `sc-domain:kclhq.com`
- Requested URL: `https://www.kclhq.com/en/news/gov-ball-kpop-weekend`
- Result: `색인 생성 요청됨`
- Attempts: 1
- Screenshot: `runtime/kcl-news-autopilot-20260608T040000Z-gov-ball-kpop-weekend-gsc.png`.

## Final Status

SUCCESS.

Pass stages: Research, Content, Image, Factcheck, Local Render, Deploy, GSC, Report.

Retry counts: Research 1, Content 1, Image 1, Local Render 1, Deploy 25 Cloudflare check polls + 1 live HTTP poll, GSC 1.

Last nonblocking errors: local Supabase env warnings, localhost Google Ads 403, pre-existing unrelated lint errors, and local cleanup failure after remote PR merge due another worktree holding `main`.
