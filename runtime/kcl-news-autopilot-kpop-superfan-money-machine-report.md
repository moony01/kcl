# KCL News Autopilot Report

- Workflow: kcl-news-autopilot
- Slug: kpop-superfan-money-machine
- Run started: 2026-05-20T12:02:10+09:00
- Status: IN_PROGRESS

## Research Gate

PASS. Selected topic: K-pop superfan platform economy: Weverse, Bubble, and the $4.3B superfan race.

Recent tone distribution: N=0, P=4, Neutral=1. Balance rule not applied.

Primary evidence URLs are recorded in `runtime/kcl-news-autopilot-kpop-superfan-money-machine-evidence.json`.

## Content Gate

PASS.

- Article: `src/content/news/en/kpop-superfan-money-machine.md`
- Word count: 1,446 words including frontmatter
- Structure: 5 H2 sections and 9 H3 subsections
- Excerpt length: 130 characters
- Internal link: `/en/news/sm-q1-money-machine`
- Encoding check: 0 broken replacement characters

## Image Gate

PASS.

- ChatGPT thumbnail download: `.playwright-mcp/ChatGPT-Image-2026년-5월-20일-오후-12-06-13.png`
- ChatGPT body download: `.playwright-mcp/ChatGPT-Image-2026년-5월-20일-오후-12-07-40.png`
- Resource thumbnail: `/home/mhhan/workspace/.resource/kpop-superfan-money-machine-thumbnail.png`
- Resource body: `/home/mhhan/workspace/.resource/kpop-superfan-money-machine-1.png`
- Final thumbnail: `public/images/news/kpop-superfan-money-machine-thumbnail.png`
- Final body: `public/images/news/kpop-superfan-money-machine-1.png`
- Reuse check: PASS. Both hashes were created after run start and differ from pre-existing repo files.

## Factcheck Gate

PASS. Verification rate: 10/10 claims (100%). Fix: 0. Remove: 0.

| # | Claim | Verdict | Sources | Action |
|---|---|---|---|---|
| 1 | Weverse reached 12 million MAU in 2025. | PASS | Music Business Worldwide, Seoul Economic Daily | Keep |
| 2 | Weverse users averaged 263 minutes per month, up from 237. | PASS | Seoul Economic Daily, Music Business Worldwide | Keep |
| 3 | The 2025 Weverse report covered 30 million users over two years. | PASS | Weverse Magazine, KPOPPOST | Keep |
| 4 | Weverse had 178 artists, 90M posts, 213M comments and 6,558 LIVE sessions with 1B+ views. | PASS | Music Business Worldwide, Seoul Economic Daily | Keep |
| 5 | BTS drove a 300%+ follower surge and became the first Weverse community over 30M followers. | PASS | Music Business Worldwide, Seoul Economic Daily | Keep |
| 6 | BLACKPINK passed 10M Weverse community followers as the first girl group to do so. | PASS | Seoul Economic Daily, Music Business Worldwide | Keep |
| 7 | Goldman Sachs estimated a $4.3B annual superfan opportunity based on 2026 projections. | PASS | Music Business Worldwide, MusicResearch | Keep |
| 8 | Weverse Shop sold 25.2M products in 2025, up from 20.6M; digital product purchases more than doubled. | PASS | Seoul Economic Daily, Music Business Worldwide, KPOPWORLD | Keep |
| 9 | SM Q1 2026 revenue was KRW 279.1B, operating profit KRW 38.6B, with DearU contributing KRW 23.4B. | PASS | Music Business Worldwide, Record of the Day, IQ Magazine | Keep |
| 10 | Tencent Music Q1 2026 music-related services revenue rose 12.2% to RMB 6.51B, supported by new membership programs including Bubble, WeverseDM and fan-club membership. | PASS | Tencent Music IR, StreetInsider, Music Business Worldwide | Keep |

## Local Render Gate

PASS.

- Build: `pnpm build` completed successfully.
- Build warnings: existing Sass deprecation warnings and Supabase env warnings.
- Page: `http://127.0.0.1:3213/en/news/kpop-superfan-money-machine` -> HTTP 200.
- Original images: thumbnail/body -> HTTP 200.
- Optimizer images: `kpop-superfan-money-machine-thumbnail-opt-800.WEBP` and `kpop-superfan-money-machine-1-opt-800.WEBP` -> HTTP 200.
- Playwright image check: thumbnail and body image both loaded at 800x450.
- Screenshot: `runtime/kcl-news-autopilot-kpop-superfan-money-machine-local-body.png`.
- Local console notes: Google Ads 403 and existing Supabase env errors appeared on localhost; they did not block article or image rendering.
