# KCL News Autopilot Report: bts-stanford-takeover

## Selection

> 자동 선택된 주제: BTS Stanford Stadium three-night sold-out Bay Area run on May 16, 17, and 19 (Artist / tone: Positive) - Immediate local and official coverage, sold-out status, and active fan logistics made it the strongest non-duplicate topic.
> 직전 5개 톤 분포: N=1, P=4, Neutral=0 -> 균형 규칙 해당없음

Higher-scoring duplicate candidates were excluded because KCL already published them: BTS World Cup halftime, K-pop album export record, Fanomenon Big Four festival, May girl-group market war, Lisa Vegas residency, and CORTIS GREENGREEN.

## Plan Summary

Title selected: BTS Is About to Take Over Stanford - The Bay Area Has 72 Hours to Prepare

Slug: bts-stanford-takeover

Target keywords: BTS Stanford Stadium, BTS Bay Area

## Factcheck Result

| # | Claim | Verdict | Sources | Action |
|:-:|---|:---:|---|---|
| 1 | BTS will perform at Stanford Stadium on May 16, 17, and 19, 2026. | PASS | Stanford Athletics, KQED, KoreaPortal | Kept |
| 2 | The Stanford dates are part of BTS WORLD TOUR 'ARIRANG', described by Stanford as 34 regions, 79 shows, and a 360-degree stage. | PASS | Stanford Athletics, TicketNews | Kept |
| 3 | Stanford Stadium capacity is listed as 50,424, making three standard-capacity nights potentially above 150,000 before production holds. | PASS | Stanford Stadium facility page, Stanford Athletics | Kept with cautious wording |
| 4 | All three Stanford shows are sold out. | PASS | NBC Bay Area, KoreaPortal | Kept |
| 5 | Stanford Transportation warned of traffic, parking, transit, ride-share, and Waymo restrictions. | PASS | Stanford Transportation | Kept |
| 6 | Bay Area BTSxARMY crowdfunded welcome billboards and has 4,700 Facebook members plus more than 12,000 Instagram followers. | PASS | NBC Bay Area, San Francisco Chronicle | Kept |

Verification rate: 6/6 (100%)

Fix: 0 | Remove: 0

## ChatGPT Generation Evidence

- prompt_thumbnail: Generate a cinematic, photorealistic editorial news thumbnail image in 16:9 aspect ratio, 1200x675px. Scene: a packed college football stadium at night on a Bay Area campus, anonymous K-pop fans arriving in waves with purple light sticks and smartphone glow, transit lines and crowd-control barriers around the venue, dramatic broadcast lighting, high-energy concert atmosphere. Style: premium editorial news photography, cinematic lighting, crisp realistic detail, global music event mood. No real people's faces, no identifiable people, no text, no logos, no watermarks, high quality, 8k resolution.
- prompt_body: Generate a dramatic editorial image in 16:9 aspect ratio, 1200x675px. Scene: Bay Area concert logistics converging on a major campus stadium before a huge K-pop tour stop, with anonymous fan silhouettes moving from trains, bike valet lanes, ride-share queues, campus walkways, and merchandise tents toward a glowing purple stadium. Mood: organized pressure, city-scale fandom, premium live-event infrastructure. Style: professional news photography, cinematic aerial perspective, realistic night lighting, crisp detail. No real people's faces, no identifiable people, no text, no logos, no watermarks, high quality, 8k resolution.
- raw_download_1: ChatGPT_Generated_Image_bts-stanford-takeover-thumbnail.png (2026-05-15 16:40:50 +0900)
- raw_download_2: ChatGPT_Generated_Image_bts-stanford-takeover-1.png (2026-05-15 16:40:50 +0900)
- final_thumbnail: /images/news/bts-stanford-takeover-thumbnail.png (2026-05-15 16:40:50 +0900)
- final_body: /images/news/bts-stanford-takeover-1.png (2026-05-15 16:40:50 +0900)
- reuse_check: PASS

## Gate Status

- Research: PASS
- Content: PASS
- Factcheck: PASS
- Image: PASS
- Local Render: PASS
- Deploy: PENDING
- GSC: PENDING

## Local Render Evidence

- page: http://127.0.0.1:4173/en/news/bts-stanford-takeover.html -> 200
- raw thumbnail: /images/news/bts-stanford-takeover-thumbnail.png -> 200
- raw body image: /images/news/bts-stanford-takeover-1.png -> 200
- optimized thumbnail: /images/news/nextImageExportOptimizer/bts-stanford-takeover-thumbnail-opt-800.WEBP -> 200
- optimized body: /images/news/nextImageExportOptimizer/bts-stanford-takeover-1-opt-800.WEBP -> 200
- Playwright render: title found, thumbnail rendered, body image rendered after scroll
- Build: pnpm build PASS; npx next-image-export-optimizer PASS

## Known Local Warnings

The local build and browser render showed existing Supabase environment warnings and Sass deprecation warnings. They did not block static build output, article rendering, or image loading.
