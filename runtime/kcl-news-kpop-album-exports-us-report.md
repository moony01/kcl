# KCL News Autopilot Report: kpop-album-exports-us

## Selection

> Auto-selected topic: K-pop album exports crossed US$100 million for the first time in Q1 2026, with the United States overtaking Japan as the top export market (Market Trend / tone: Positive) - Record value, 159% growth, U.S.-Japan reversal, and multiple trusted Korean business/news sources made it the strongest non-duplicate market topic.
> Recent 5 tone distribution: N=1, P=4, Neutral=0 -> balance rule not applied.

Top candidates considered: BTS World Cup anthem/halftime follow-up, May girl-group comeback battle, NMIXX Heavy Serenade, SM Q1 growth, trainee audition/survival-show topics. The export topic won because it had stronger cross-source business data and cleaner KCL market-analysis value.

## Plan Summary

Title selected: K-pop Album Exports Just Crossed $100M - The U.S. Took Japan's Crown

Slug: kpop-album-exports-us

Target keywords: K-pop album exports, K-pop physical albums

## Factcheck Result

| # | Claim | Verdict | Sources | Action |
|:-:|---|:---:|---|---|
| 1 | K-pop album exports reached US$120 million in Q1 2026. | PASS | Yonhap, Korea JoongAng Daily, Seoul Economic Daily, Chosun English | Kept |
| 2 | Exports increased 159% year over year in January-March. | PASS | Yonhap, Korea JoongAng Daily, Seoul Economic Daily, Chosun English | Kept |
| 3 | Quarterly exports exceeded US$100 million for the first time. | PASS | Yonhap, Korea JoongAng Daily, Seoul Economic Daily | Kept |
| 4 | Quarterly exports have set records since Q3 2025. | PASS | Yonhap, Korea JoongAng Daily | Kept |
| 5 | The U.S. overtook Japan as the largest export destination. | PASS | Yonhap, Korea JoongAng Daily, Seoul Economic Daily | Kept with cautious wording |
| 6 | Seoul Economic Daily reported U.S. 28.8% and Japan 25.3%. | PASS | Seoul Economic Daily | Kept as attributed detail |
| 7 | EU, China, and Taiwan followed with 16.5%, 14.4%, and 6.9%. | PASS | Yonhap, Korea JoongAng Daily, Seoul Economic Daily | Kept |
| 8 | 131 countries imported K-pop albums and 94 hit all-time quarterly highs. | PASS | Yonhap, Korea JoongAng Daily, Seoul Economic Daily | Kept |

Verification rate: 8/8 (100%)

Fix: 0 | Remove: 0

## ChatGPT Generation Evidence

- prompt_thumbnail: Create an original editorial news thumbnail image, 16:9 aspect ratio, 1200x675px. Scene: a cinematic K-pop physical album export boom visual, stacks of glossy albums and collectible photo-card envelopes moving through a modern international logistics hub, subtle U.S. and Japan market route lines on transparent screens, a clean financial dashboard glow in the background. Style: premium business news photography, dramatic but realistic lighting, teal, red, white, and graphite accents. No real people's faces, no identifiable people, no text, no numbers, no logos, no watermarks, high quality, professional photography, cinematic lighting, 8k resolution.
- prompt_body: Create an original dramatic editorial image, 16:9 aspect ratio, 1200x675px. Scene: a close-up business news scene of K-pop albums as export products: sealed albums, shipping labels without readable text, collectible photo cards partly visible but no faces, barcode-like patterns blurred, and a glowing world map dashboard showing trade flow from Seoul toward North America and Europe. Mood: analytical, premium, market-shift story, modern newsroom style. Colors: deep graphite, clean white, signal red, teal highlights. No real people's faces, no identifiable people, no text, no readable labels, no logos, no watermarks, high quality, professional photography, cinematic lighting, 8k resolution.
- raw_download_1: ChatGPT_Generated_Image_kpop-album-exports-us-thumbnail.png (2026-05-17 11:14:20 +0900)
- raw_download_2: ChatGPT_Generated_Image_kpop-album-exports-us-1.png (2026-05-17 11:14:20 +0900)
- final_thumbnail: /images/news/kpop-album-exports-us-thumbnail.png (2026-05-17 11:07:39 +0900)
- final_body: /images/news/kpop-album-exports-us-1.png (2026-05-17 11:07:39 +0900)
- reuse_check: PASS

## Gate Status

- Research: PASS
- Content: PASS
- Factcheck: PASS
- Image: PASS
- Local Render: PASS
- Deploy: PASS
- GSC: PASS

## Local Render Evidence

- page: http://127.0.0.1:4174/en/news/kpop-album-exports-us -> 200
- raw thumbnail: /images/news/kpop-album-exports-us-thumbnail.png -> 200
- raw body image: /images/news/kpop-album-exports-us-1.png -> 200
- optimized thumbnail: /images/news/nextImageExportOptimizer/kpop-album-exports-us-thumbnail-opt-800.WEBP -> 200
- Playwright render: H1 found, thumbnail rendered, body image rendered, internal link found
- Build: pnpm build PASS; npx next-image-export-optimizer PASS

## Deployment Evidence

- commit: 8b018fc6c6566eb1443915ebd2ac6160a4de149b
- push: origin/main -> 8b018fc6c6566eb1443915ebd2ac6160a4de149b
- poll: https://www.kclhq.com/en/news/kpop-album-exports-us -> 200 on attempt 4
- public raw thumbnail: /images/news/kpop-album-exports-us-thumbnail.png -> 200
- public raw body image: /images/news/kpop-album-exports-us-1.png -> 200
- public optimized thumbnail: /images/news/nextImageExportOptimizer/kpop-album-exports-us-thumbnail-opt-800.WEBP -> 200
- public optimized body: /images/news/nextImageExportOptimizer/kpop-album-exports-us-1-opt-800.WEBP -> 200
- Playwright deployed render: H1 found, thumbnail rendered, body image rendered, internal link found
- Cloudflare production SHA: not exposed via public page or GitHub deployments; deployment was verified by remote main SHA plus live public render

## Search Console Evidence

- property: sc-domain:kclhq.com
- inspected URL: https://www.kclhq.com/en/news/kpop-album-exports-us
- action: 색인 생성 요청
- confirmation: 색인 생성 요청됨
- attempts: 1
