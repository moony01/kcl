# KCL News Autopilot Report: blackpink-government-stamps

Status: SUCCESS

## 자동 선택된 주제

Initial top trend was `BTS World Cup halftime`, but KCL already has an active article at `/en/news/bts-world-cup-halftime`. Duplicate filtering selected the strongest non-duplicate topic: `BLACKPINK 10th anniversary commemorative stamps with Korea Post`.

Previous 5 tone distribution: N=0, P=5, Neutral=0. Balance rule: no forced correction required.

## Title

Selected English title: `BLACKPINK Just Got Government Stamps - The 10-Design Signal YG Needed`

Slug: `blackpink-government-stamps`

Category: `Business`

## Factcheck 결과

| # | Claim | Verdict | Sources | Action |
|:-:|---|:---:|---|---|
| 1 | YG Entertainment and Korea Post will issue BLACKPINK 10th anniversary stamps on June 16, 2026 | PASS | Korea JoongAng Daily, StarNews, MK, Sports Kyunghyang | Kept |
| 2 | BLACKPINK debuted in 2016 | PASS | Korea JoongAng Daily, public biography references | Kept |
| 3 | BLACKPINK is the first female K-pop artist to receive Korea Post commemorative stamps | PASS | Korea JoongAng Daily, StarNews, ChosunBiz, MK | Kept |
| 4 | The set contains 10 designs tied to the group's discography or decade | PASS | Korea JoongAng Daily, StarNews, Sports Kyunghyang, MK | Kept |
| 5 | The packet includes member portraits and key stage images | PASS | Korea JoongAng Daily, StarNews, ChosunBiz, Sports Kyunghyang | Kept |
| 6 | General sales begin June 16 through post offices and online Korea Post channels | PASS | Korea JoongAng Daily, StarNews, MK, Sports Kyunghyang | Kept |
| 7 | Presales ran May 12-15 with overseas routes through YG SELECT and English-language postal channels | PASS | StarNews, ChosunBiz, MK, Sports Kyunghyang, YG SELECT listing | Kept |
| 8 | MK reported 8,800 won for 10 stamps and 25,000 won for the packet | PASS | MK IT | Kept |

Verification rate: 8/8 (100%). Fix: 0. Remove: 0.

## ChatGPT 생성 증빙

- prompt_thumbnail: Generate a cinematic, photorealistic editorial news thumbnail image in 16:9 aspect ratio, 1200x675px. Scene: a premium Korean postal counter displaying an elegant commemorative K-pop stamp sheet inside glass, black and pink lighting, collector envelopes, subtle anniversary celebration mood, hands of anonymous fans holding stamp albums, no readable writing. Style: luxury culture-business news thumbnail, polished studio lighting, dramatic but realistic. No real people's faces, no identifiable celebrity likeness, no official logos, no readable text, no watermarks, high quality, professional photography, 8k resolution.
- prompt_body: Generate a dramatic editorial image in 16:9 aspect ratio, 1200x675px. Scene: a sophisticated K-pop collectibles strategy table with anonymous hands arranging commemorative stamp sheets, album photobook silhouettes, postal envelopes, and fan-order receipts under black-pink accent lighting; a blurred postal sorting room in the background, no readable text. Style: professional culture-business photography, cinematic lighting, premium magazine feature mood. No real people's faces, no identifiable celebrity likeness, no official logos, no readable text, no watermarks, high quality, professional photography, 8k resolution.
- raw_download_1: `/home/mhhan/Downloads/ChatGPT_Generated_Image_blackpink_stamps_thumbnail.png` (2026-05-18 12:13 +0900)
- raw_download_2: `/home/mhhan/Downloads/ChatGPT_Generated_Image_blackpink_stamps_body.png` (2026-05-18 12:15 +0900)
- final_thumbnail: `/images/news/blackpink-government-stamps-thumbnail.png` (2026-05-18 12:19 +0900)
- final_body: `/images/news/blackpink-government-stamps-1.png` (2026-05-18 12:19 +0900)
- reuse_check: PASS

## Local Render Gate

- `pnpm build`: PASS
- Local article: `http://127.0.0.1:4177/en/news/blackpink-government-stamps` -> 200
- Thumbnail PNG -> 200
- Body PNG -> 200
- Optimized thumbnail WEBP -> 200
- Optimized body WEBP -> 200
- Playwright local render: H1 found, thumbnail rendered, body image rendered after scroll, internal link found

Known build/browser warnings: pre-existing Sass `darken()` deprecation warnings, missing local Supabase env warnings and localhost ad 403. Build and article rendering completed successfully.

## Deployment Evidence

- commit: `880250039d875c33a8e0984b7c520820f33a0f59`
- push: `origin/main -> 880250039d875c33a8e0984b7c520820f33a0f59`
- poll: `https://www.kclhq.com/en/news/blackpink-government-stamps` -> 200 on attempt 4
- public raw thumbnail: `/images/news/blackpink-government-stamps-thumbnail.png` -> 200
- public raw body image: `/images/news/blackpink-government-stamps-1.png` -> 200
- public optimized thumbnail: `/images/news/nextImageExportOptimizer/blackpink-government-stamps-thumbnail-opt-800.WEBP` -> 200
- public optimized body: `/images/news/nextImageExportOptimizer/blackpink-government-stamps-1-opt-800.WEBP` -> 200
- Playwright deployed render: H1 found, thumbnail rendered, body image rendered after scroll, internal link found
- Cloudflare production SHA: not exposed via public page; deployment was verified by remote main SHA plus live public render

## Search Console Evidence

- property: `sc-domain:kclhq.com`
- inspected URL: `https://www.kclhq.com/en/news/blackpink-government-stamps`
- action: `색인 생성 요청`
- confirmation: `색인 생성 요청됨`
- attempts: 1
