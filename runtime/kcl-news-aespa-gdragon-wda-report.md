# KCL News Autopilot Report: aespa-gdragon-wda

Status: SUCCESS

## Selected Topic

aespa's `WDA (Whole Different Animal)` featuring G-Dragon ahead of `LEMONADE` was selected as the top trend.

Previous 5 tone distribution: N=0, P=4, Neutral=1. Balance rule: no forced correction required. Category selected: `Artist`.

## Title

Selected English title: `aespa Pulled G-Dragon Into WDA - And the Real Target Wasn't Korea`

Slug: `aespa-gdragon-wda`

Category: `Artist`

## Factcheck Result

| # | Claim | Verdict | Sources | Action |
|:-:|---|:---:|---|---|
| 1 | aespa released `WDA` on May 11, 2026 at 6 p.m. KST as a pre-release for `LEMONADE` | PASS | SM Entertainment, allkpop, ChosunBiz | Kept |
| 2 | `LEMONADE` is aespa's second full-length album, scheduled for May 29, 2026 at 1 p.m. KST, with 10 tracks | PASS | SM Entertainment, ChosunBiz, KPOP OFFICIAL | Kept |
| 3 | `LEMONADE` follows aespa's 2024 full-length album `Armageddon` | PASS | JamBase, FEMMUSIC | Kept |
| 4 | G-Dragon featured on `WDA` and participated in rap-making for his verse | PASS | allkpop, ChosunBiz, StarNews | Kept |
| 5 | `WDA` reached top 10 on iTunes Top Songs charts in 17 regions and received QQ Music Gold Album certification for sales exceeding 250,000 yuan | PASS | StarNews, ChosunBiz, Chosun/OSEN | Kept |
| 6 | `WDA` topped Tencent Music's integrated K-pop chart and other China-linked digital/video charts | PASS | StarNews, ChosunBiz | Kept |
| 7 | Reddit discussion showed mixed fan reactions, including praise and criticism | PASS | r/Aespa, r/kpop | Kept as fan-reaction context only |

Verification rate: 7/7 (100%). Fix: 0. Remove: 0.

## ChatGPT 생성 증빙

- prompt_thumbnail: Generate a cinematic, photorealistic editorial news thumbnail image in 16:9 aspect ratio, 1200x675px. Scene: a futuristic K-pop stage control room where a chrome digital animal-shaped light form breaks through mirrored screens, with neon lemon yellow, electric cyan, deep black, and silver lighting. The atmosphere should suggest a shocking cross-generation collaboration and viral social media reaction, but without depicting aespa, G-Dragon, or any real person. Use abstract silhouettes only from behind, no faces, no logos, no text, no watermarks. High quality, professional news thumbnail, dramatic lighting, 8k resolution.
- prompt_body: Generate a dramatic editorial news image in 16:9 aspect ratio, 1200x675px. Scene: a global K-pop fandom analytics wall after a high-profile collaboration release, with floating music-chart panels, smartphone glow, abstract comment streams, and mirrored digital avatars dissolving into light. The mood should feel tense, futuristic, and business-focused, showing how one pre-release single can test fandom, charts, and brand strategy. No real people's faces, no recognizable artists, no logos, no readable text, no watermarks. Abstract silhouettes only, professional news photography, cinematic lighting, high quality, 8k resolution.
- raw_download_1: `/home/mhhan/Downloads/27632878-e118-46ec-94cf-f88bce790f9d.png` (2026-05-18 13:06:47 +0900)
- raw_download_2: `/home/mhhan/Downloads/aa8ebef0-a769-4ef2-94c2-b532f727079b.png` (2026-05-18 13:08:43 +0900)
- final_thumbnail: `/images/news/aespa-gdragon-wda-thumbnail.png` (2026-05-18 13:11:23 +0900)
- final_body: `/images/news/aespa-gdragon-wda-1.png` (2026-05-18 13:11:23 +0900)
- reuse_check: PASS

## Local Render Gate

- `npx next-image-export-optimizer`: PASS
- `pnpm build`: PASS
- Local article: `http://127.0.0.1:4173/en/news/aespa-gdragon-wda` -> 200
- Thumbnail PNG -> 200
- Body PNG -> 200
- Optimized thumbnail WEBP -> 200
- Optimized body WEBP -> 200
- Playwright local render: H1 found, thumbnail rendered, body image rendered after scroll, internal link found

Known local warnings: pre-existing Sass `darken()` deprecation warnings and missing local Supabase env warnings. The page rendered successfully.

## Deployment Evidence

- content commit: `110de9797e5a5373ff459c59da28aa16377247b6`
- push: `origin/main -> 110de9797e5a5373ff459c59da28aa16377247b6`
- Cloudflare Pages check run: success
- Cloudflare check run URL: `https://github.com/moony01/kcl/runs/76458414252`
- public article: `https://www.kclhq.com/en/news/aespa-gdragon-wda` -> 200
- public raw thumbnail: `/images/news/aespa-gdragon-wda-thumbnail.png` -> 200
- public raw body image: `/images/news/aespa-gdragon-wda-1.png` -> 200
- public optimized thumbnail: `/images/news/nextImageExportOptimizer/aespa-gdragon-wda-thumbnail-opt-800.WEBP` -> 200
- public optimized body: `/images/news/nextImageExportOptimizer/aespa-gdragon-wda-1-opt-800.WEBP` -> 200
- Playwright deployed render: H1 found, thumbnail rendered, body image rendered after scroll, internal link found

## Search Console Evidence

- property: `sc-domain:kclhq.com`
- inspected URL: `https://www.kclhq.com/en/news/aespa-gdragon-wda`
- initial state: URL not on Google / Google did not know this URL yet
- action: indexing request
- confirmation: `Indexing requested`
- attempts: 3

## Final Output

- URL: `https://www.kclhq.com/en/news/aespa-gdragon-wda`
- Markdown: `src/content/news/en/aespa-gdragon-wda.md`
- Evidence JSON: `runtime/kcl-news-aespa-gdragon-wda-evidence.json`
