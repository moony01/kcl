# KCL News Autopilot Report: babymonster-choom-100m

## Auto Selection

> Auto-selected topic: BABYMONSTER's `CHOOM` became the fastest 2026 K-pop MV to reach 100 million YouTube views (Tech & Culture / tone: Positive) - May 18 milestone, 13-day speed, subscriber surge and tour conversion made it the strongest current non-duplicate trend.
> Recent 5 tone distribution: N=0, P=4, Neutral=1 -> balance rule not required.

## Title Plan

Selected title: `100 Million in 13 Days - BABYMONSTER Just Made YG's Problem Bigger`

Title candidates:

| # | English title | Score | Notes |
|:-:|---|:---:|---|
| 1 | 100 Million in 13 Days - BABYMONSTER Just Made YG's Problem Bigger | 23/25 | Number + dash + curiosity gap + business tension |
| 2 | BABYMONSTER Hit 100M in 13 Days - The YouTube Signal Rivals Can't Ignore | 21/25 | Strong but more explanatory |
| 3 | CHOOM Broke 100M Fast - Why YG Cannot Treat BABYMONSTER Like Rookies Anymore | 20/25 | Good angle, weaker opening number |

## Image Strategy

> Thumbnail: AI - source: ChatGPT generated via Playwright browser
> Body image: AI - source: ChatGPT generated via Playwright browser
> Resource paths: `/home/mhhan/workspace/.resource/babymonster-choom-100m-thumbnail.png`, `/home/mhhan/workspace/.resource/babymonster-choom-100m-1.png`
> Final paths: `/home/mhhan/workspace/kcl/public/images/news/babymonster-choom-100m-thumbnail.png`, `/home/mhhan/workspace/kcl/public/images/news/babymonster-choom-100m-1.png`

## Factcheck Results

| # | Claim | Verdict | Sources | Action |
|:-:|---|:---:|---|---|
| 1 | `CHOOM` passed 100 million views on May 18 around 2:50 p.m. KST. | PASS | Soompi, Kpopify, Music Mundial | Kept |
| 2 | The milestone came about 13 days and 21 hours after the May 4 6 p.m. KST release. | PASS | Soompi, Kpopify, Music Mundial | Kept |
| 3 | `CHOOM` is the second and fastest 2026 K-pop MV to hit 100 million views. | PASS | Soompi, Kpopify, Music Mundial | Kept |
| 4 | `CHOOM` is BABYMONSTER's 11th official MV to pass 100 million views. | PASS | Soompi, Kpopify, Music Mundial | Kept |
| 5 | BABYMONSTER passed 12 million YouTube subscribers around May 17 at 6:30 p.m. KST. | PASS | ChosunBiz, StarNews | Kept |
| 6 | The channel gained about 250,000 subscribers in the 13 days before May 17. | PASS | ChosunBiz, StarNews | Kept |
| 7 | `CHOOM` topped YouTube global daily/trending MV charts and exceeded 15 million views within half a day. | PASS | allkpop, FanNStar, StarNews | Kept |
| 8 | Seoul `CHOOM` shows sold out and additional seats opened. | PASS | Hanteo News, StarNews | Kept |
| 9 | Hanteo cited 387,871 first-day sales for the `CHOOM` mini album. | PASS | Hanteo News | Kept |
| 10 | Asia and Oceania tour routing includes 18 stops, with more regions expected. | PASS | allkpop, StarNews | Kept |

Verification rate: 10/10 (100%)
Fixes: 0 | Removals: 0

## ChatGPT Generation Evidence

- prompt_thumbnail: Generate a cinematic, photorealistic editorial news thumbnail image (16:9 aspect ratio, 1200x675px). Scene: a K-pop music video command center at night, giant abstract screens showing rising view-count bars and glowing play-button shapes, silhouettes of fans holding phones, a performance stage in the distance with red, black, silver, and electric blue lighting. Style: editorial news thumbnail, dramatic lighting. No real people's faces, no identifiable idols, no official logos, no readable text, no numbers, no watermarks, high quality, professional photography, cinematic lighting, 8k resolution.
- prompt_body: Generate a dramatic editorial image (16:9 aspect ratio, 1200x675px). Scene: an abstract global fandom network for a K-pop music video, smartphones and light sticks glowing across a dark arena, data streams converging into a bright central stage, empty performer silhouettes only, no faces. Colors: crimson, black, silver, and electric blue. Style: professional news photography, cinematic lighting. No real people's faces, no identifiable idols, no official logos, no readable text, no numbers, no watermarks, high quality, professional photography, cinematic lighting, 8k resolution.
- raw_download_1: `.playwright-mcp/e5f26fed-0cfb-4573-889f-4c9262fe8fd3.png` copied to `runtime/kcl-news-babymonster-choom-100m-chatgpt-raw-thumbnail.png` (2026-05-19 11:05:39 +0900)
- raw_download_2: `.playwright-mcp/70dbda8e-3775-4eb7-95e3-2bdb46e54216.png` copied to `runtime/kcl-news-babymonster-choom-100m-chatgpt-raw-body.png` (2026-05-19 11:07:01 +0900)
- final_thumbnail: `/images/news/babymonster-choom-100m-thumbnail.png` (2026-05-19 11:07 +0900)
- final_body: `/images/news/babymonster-choom-100m-1.png` (2026-05-19 11:07 +0900)
- reuse_check: PASS

## Gate Status

- Research Gate: PASS
- Content Gate: PASS
- Image Gate: PASS
- Factcheck Gate: PASS
- Local Render Gate: PASS
- Deploy Gate: PENDING
- GSC Gate: PENDING

## Local Render Evidence

- local_page: `http://127.0.0.1:3000/en/news/babymonster-choom-100m` -> HTTP 200
- source_thumbnail: `/images/news/babymonster-choom-100m-thumbnail.png` -> HTTP 200
- source_body: `/images/news/babymonster-choom-100m-1.png` -> HTTP 200
- optimized_thumbnail: `/images/news/nextImageExportOptimizer/babymonster-choom-100m-thumbnail-opt-800.WEBP` -> HTTP 200
- optimized_body: `/images/news/nextImageExportOptimizer/babymonster-choom-100m-1-opt-800.WEBP` -> HTTP 200
- screenshots: `runtime/kcl-news-babymonster-choom-100m-local.png`, `runtime/kcl-news-babymonster-choom-100m-local-body.png`
- note: local browser console showed existing dev-environment Supabase warnings/errors due missing local env vars; page content and both images rendered.

## Build Evidence

- `node scripts/generate-news-json.js`: PASS
- `npx next-image-export-optimizer`: PASS, generated `babymonster-choom-100m` optimized WEBP files
- `pnpm build`: PASS
- warnings: existing Sass deprecation warnings and local missing Supabase env warnings during static generation
