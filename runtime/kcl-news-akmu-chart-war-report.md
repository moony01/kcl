# KCL News Autopilot Report: akmu-chart-war

## Auto Selection

> Auto-selected topic: AKMU's `Paradise of Rumors` Perfect All-Kill and Circle Chart triple crown (Market Trend / tone: Positive) - It had the strongest blend of chart proof, post-YG business angle, and broad public-listening SEO potential.
> Recent 5 tone distribution: N=1, P=3, Neutral=1 -> balance rule not required.

## Title Plan

Selected title: `AKMU Broke K-pop's Fan War - The Charts Exposed What Idols Still Can't Buy`

Title candidates:

| # | English title | Score | Notes |
|:-:|---|:---:|---|
| 1 | AKMU Broke K-pop's Fan War - The Charts Exposed What Idols Still Can't Buy | 23/25 | Strong conflict frame, curiosity gap, market meaning |
| 2 | AKMU Just Beat The Fandom Machine - And The Numbers Are Brutal | 22/25 | Sharper clickbait but less specific to the song |
| 3 | Paradise of Rumors Hit No. 1 Everywhere - Why Agencies Should Be Nervous | 21/25 | Strong chart hook, weaker entity-first SEO |

## Image Strategy

> Thumbnail: AI - source: ChatGPT generated via Playwright browser
> Body image: AI - source: ChatGPT generated via Playwright browser
> Resource paths: `/home/mhhan/workspace/.resource/akmu-chart-war-thumbnail.png`, `/home/mhhan/workspace/.resource/akmu-chart-war-1.png`
> Final paths: `/home/mhhan/workspace/kcl/public/images/news/akmu-chart-war-thumbnail.png`, `/home/mhhan/workspace/kcl/public/images/news/akmu-chart-war-1.png`

## Factcheck Results

| # | Claim | Verdict | Sources | Action |
|:-:|---|:---:|---|---|
| 1 | AKMU earned a Circle Chart triple crown for the May 3-9 weekly chart with `Paradise of Rumors`. | PASS | Soompi, Zapzee | Kept |
| 2 | The song led overall digital, download, and streaming chart lanes. | PASS | Soompi, Zapzee | Kept |
| 3 | `Paradise of Rumors` achieved a Perfect All-Kill on May 1 KST. | PASS | Soompi/allkpop search evidence, iChart-reported coverage | Kept with careful wording |
| 4 | AKMU exited YG Entertainment after a 12-year run and moved into an independent agency identity. | PASS | Korea JoongAng Daily | Kept |
| 5 | IFPI reported global recorded music revenue of $31.7 billion in 2025. | PASS | IFPI | Kept |

Verification rate: 5/5 (100%)
Fixes: 0 | Removals: 0

## ChatGPT Generation Evidence

- prompt_thumbnail: Generate one cinematic, photorealistic editorial news thumbnail image in 16:9 aspect ratio, 1200x675px. Scene: a dramatic K-pop chart control room at night where glowing Korean music chart lines, streaming dashboards, album icons, and fan-community signal waves converge into one bright No. 1 peak. Make it feel like AKMU's organic Korean chart victory is breaking through a crowded idol-fandom scoreboard, but show no real artists and no identifiable people. Colors: electric cyan, magenta, white chart light, deep charcoal background. Style: premium editorial news thumbnail, cinematic lighting, realistic reflections, high contrast. No text, no letters, no logos, no watermarks, no real people's faces, no identifiable people, high quality, professional photography, 8k resolution.
- prompt_body: Generate one dramatic editorial image in 16:9 aspect ratio, 1200x675px. Scene: a modern K-pop analytics studio with a long glass table, holographic domestic chart panels, streaming graphs, fan-vote counters, and soft concert-light reflections. The mood should show the tension between organic public listening and organized fandom power after a Korean singer-songwriter duo dominates the charts. Use abstract silhouettes only, no real artists, no identifiable people. Colors: cool white, cyan data light, warm gold highlights, restrained black background. Style: professional news photography, cinematic lighting, realistic materials, high detail. No text, no letters, no logos, no watermarks, no real people's faces, no identifiable people, high quality, professional photography, 8k resolution.
- raw_download_1: `.playwright-mcp/ChatGPT-Image-2026년-5월-21일-오후-01-04-44.png` copied to `runtime/raw-chatgpt/akmu-chart-war-raw-thumbnail.png` (2026-05-21 13:09:59 +0900)
- raw_download_2: `.playwright-mcp/ChatGPT-Image-2026년-5월-21일-오후-01-06-28.png` copied to `runtime/raw-chatgpt/akmu-chart-war-raw-body.png` (2026-05-21 13:09:59 +0900)
- final_thumbnail: `/images/news/akmu-chart-war-thumbnail.png` (2026-05-21 13:08:48 +0900)
- final_body: `/images/news/akmu-chart-war-1.png` (2026-05-21 13:08:48 +0900)
- reuse_check: PASS

## Gate Status

- Research Gate: PASS
- Content Gate: PASS
- Image Gate: PASS
- Factcheck Gate: PASS
- Local Render Gate: PASS
- Commit/Push Gate: PASS
- Deploy Gate: PASS
- GSC Gate: PASS

## Local Render Evidence

- local_page: `http://127.0.0.1:4173/en/news/akmu-chart-war` -> HTTP 200
- source_thumbnail: `/images/news/akmu-chart-war-thumbnail.png` -> HTTP 200
- source_body: `/images/news/akmu-chart-war-1.png` -> HTTP 200
- optimized_thumbnail: `/images/news/nextImageExportOptimizer/akmu-chart-war-thumbnail-opt-800.WEBP` -> HTTP 200
- optimized_body: `/images/news/nextImageExportOptimizer/akmu-chart-war-1-opt-800.WEBP` -> HTTP 200
- screenshots: `runtime/kcl-news-akmu-chart-war-local.png`
- note: local browser console showed existing local-environment Supabase warnings during static generation; page content and both images rendered.

## Build Evidence

- `npx next-image-export-optimizer`: PASS
- `pnpm build`: PASS
- warnings: existing Sass deprecation warnings and local missing Supabase env warnings during static generation

## Deploy / GSC

- content commit: `3e07401a047a499f7535e7d2b4768101f8520efb`
- public_url: `https://www.kclhq.com/en/news/akmu-chart-war`
- Cloudflare Pages check: completed:success
- Cloudflare check run: `77103504059`
- Cloudflare details: `https://dash.cloudflare.com/?to=/e39b8478141c206ed1752bb486fdd8eb/pages/view/kcl/85ae6d08-ebab-46e2-a3dc-2ad9fda6b4ef`
- deploy_poll: 4 attempts, final HTTP 200
- deployed image checks: source thumbnail/body 200, optimized thumbnail/body 200
- Playwright deployed render: H1 found, thumbnail rendered, body image rendered after scroll, internal link found
- deployed screenshot: `runtime/kcl-news-akmu-chart-war-deployed-body.png`
- GSC property: `sc-domain:kclhq.com`
- GSC status: `색인 생성 요청됨`
- GSC screenshot: `runtime/kcl-news-akmu-chart-war-gsc.png`

## Final Status

- final_status: SUCCESS
- retry_counts: ChatGPTImage=1, LocalRender=1, Deploy=4, GSC=1
- last_error: none
