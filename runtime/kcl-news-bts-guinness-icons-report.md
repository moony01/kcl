# KCL News Autopilot Report: bts-guinness-icons

Status: SUCCESS

## Selected Topic

BTS in Guinness World Records ICONS plus `ARIRANG`'s eighth consecutive Billboard 200 top-10 week was selected as the top trend.

Previous 5 tone distribution: N=0, P=4, Neutral=1. Balance rule: no forced correction required. Category selected: `Tech & Culture`.

## Title

Selected English title: `Guinness Puts BTS Beside Taylor and Beyonce - The No. 8 Detail Fans Can't Ignore`

Slug: `bts-guinness-icons`

Category: `Tech & Culture`

## Factcheck Result

| # | Claim | Verdict | Sources | Action |
|:-:|---|:---:|---|---|
| 1 | GWR ICONS places BTS in Pop Culture near Taylor Swift, Beyonce, Drake, Elton John, and Paul McCartney | PASS | Guinness World Records ICONS index | Kept |
| 2 | BTS ICONS page lists South Korea, inducted 2024, and the Spotify/U.S. albums chart notable records | PASS | Guinness World Records BTS ICONS page | Kept |
| 3 | `Love Yourself: Tear` made BTS the first K-pop act to top the U.S. albums chart in 2018 | PASS | GWR, Time, The Guardian | Kept |
| 4 | `Dynamite` became the first K-pop track to reach 1B Spotify streams | PASS | Guinness World Records | Kept |
| 5 | `ARIRANG` spent its eighth consecutive Billboard 200 top-10 week at No. 8 with 44,000 equivalent units | PASS | Soompi citing Billboard/Luminate, Maeil Business Newspaper | Kept |
| 6 | `ARIRANG` debuted at No. 1 with 641,000 units and 532,000 pure sales, giving BTS its seventh No. 1 album | PASS | Korea JoongAng Daily, Seoul Economic Daily | Kept |
| 7 | Billboard 200 uses equivalent album units including sales, TEA, and SEA | PASS | Korea JoongAng Daily, Soompi | Kept |

Verification rate: 7/7 (100%). Fix: 0. Remove: 0.

## ChatGPT 생성 증빙

- prompt_thumbnail: Generate a cinematic, photorealistic editorial news thumbnail image, 16:9 aspect ratio, 1200x675px. Scene: an abstract K-pop fandom data arena at night, thousands of anonymous fan silhouettes holding purple light sticks, a gold record-book pedestal without any logo, floating chart lines rising toward a highlighted number-shaped milestone, global city lights, smartphone glow, broadcast-control energy. Style: premium editorial news thumbnail, dramatic cinematic lighting, professional photography, crisp depth, high quality, 8k resolution. No real people's faces, no identifiable people, no BTS likenesses, no logos, no readable text, no watermarks.
- prompt_body: Generate a dramatic editorial image, 16:9 aspect ratio, 1200x675px. Scene: a sleek newsroom-style digital command center tracking K-pop cultural records, anonymous analysts and fan silhouettes watching global chart arcs across a world map, a gold record pedestal with no logo and no readable text, purple and gold light trails connecting Seoul, New York, London, and Sao Paulo, atmosphere of live cultural momentum. Style: professional news photography, cinematic lighting, premium editorial, high quality, 8k resolution. No real people's faces, no identifiable people, no BTS likenesses, no logos, no readable text, no watermarks.
- raw_download_1: `/home/mhhan/Downloads/ChatGPT_Generated_Image_bts-guinness-icons-thumbnail.png` (2026-05-18 11:07:54 +0900)
- raw_download_2: `/home/mhhan/Downloads/ChatGPT_Generated_Image_bts-guinness-icons-body.png` (2026-05-18 11:10:21 +0900)
- final_thumbnail: `/images/news/bts-guinness-icons-thumbnail.png` (2026-05-18 11:15:09 +0900)
- final_body: `/images/news/bts-guinness-icons-1.png` (2026-05-18 11:15:09 +0900)
- reuse_check: PASS

## Local Render Gate

- `pnpm build`: PASS
- Local article: `http://localhost:3000/en/news/bts-guinness-icons` -> 200
- Thumbnail PNG -> 200
- Body PNG -> 200
- Optimized thumbnail WEBP -> 200
- Optimized body WEBP -> 200
- Playwright local render: H1 found, thumbnail rendered, body image rendered after scroll, internal link found

Known build warnings: pre-existing Sass `darken()` deprecation warnings and missing local Supabase env warnings. Build completed successfully.

## Deployment Evidence

- content commit: `d9e22eb9655f3a76491ca56bc0f2f434ef4401e6`
- push: `origin/main -> d9e22eb9655f3a76491ca56bc0f2f434ef4401e6`
- Cloudflare Pages check run: success
- Cloudflare dashboard detail URL required login in Playwright; commit linkage verified through the GitHub check run plus live public render
- poll: `https://www.kclhq.com/en/news/bts-guinness-icons` -> 200 on attempt 3
- public raw thumbnail: `/images/news/bts-guinness-icons-thumbnail.png` -> 200
- public raw body image: `/images/news/bts-guinness-icons-1.png` -> 200
- public optimized thumbnail: `/images/news/nextImageExportOptimizer/bts-guinness-icons-thumbnail-opt-800.WEBP` -> 200
- public optimized body: `/images/news/nextImageExportOptimizer/bts-guinness-icons-1-opt-800.WEBP` -> 200
- Playwright deployed render: H1 found, thumbnail rendered, body image rendered, internal link found

## Search Console Evidence

- property: `sc-domain:kclhq.com`
- inspected URL: `https://www.kclhq.com/en/news/bts-guinness-icons`
- initial state: URL not on Google / Google did not know this URL yet
- action: indexing request
- confirmation: `Indexing requested`
- attempts: 2

## Final Output

- URL: `https://www.kclhq.com/en/news/bts-guinness-icons`
- Markdown: `src/content/news/en/bts-guinness-icons.md`
- Evidence JSON: `runtime/kcl-news-bts-guinness-icons-evidence.json`
