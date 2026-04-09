## KCL News Autopilot Report

- Run started: `2026-04-09T21:03:23+0900`
- Workflow: `kcl-news-autopilot`
- Slug: `bts-seoul-tour-kickoff`
- Current status: `IN_PROGRESS`

### Auto-selection

> 자동 선택된 주제: BTS ARIRANG 월드투어 서울권 개막전과 도시형 소비 파급 (Market Trend / 톤: Positive) - 2026년 4월 9일 실시간 개막, 다수 주요 매체 동시 보도, 팬 참여도와 SEO 파급이 가장 강함
> 직전 5개 톤 분포: N=2, P=1, Neutral=2 → 균형 규칙 해당없음

### Title candidates

| # | 한국어 제목 | 영어 제목 | 어그로 |
|:-:|---|---|:--:|
| 1 | 광화문은 예고편이었다…BTS가 서울에서 여는 건 투어가 아니라 시장이다 | Gwanghwamun Was the Teaser — What BTS Opened in Seoul Is Bigger Than a Tour | 🔥🔥🔥🔥🔥 |
| 2 | 비까지 쏟아졌는데 4만명이 들어찼다…BTS 서울 개막전이 무서운 이유 | 40,000 in the Rain — Why BTS's Seoul Kickoff Looks Bigger Than a Concert | 🔥🔥🔥🔥 |
| 3 | BTS가 오늘 서울에서 증명한 것…'복귀'보다 큰 판이 열렸다 | BTS Proved Something Bigger Than a Comeback in Seoul Today | 🔥🔥🔥 |

### Image evidence

- prompt_thumbnail: `Generate a cinematic, photorealistic thumbnail image (16:9 aspect ratio, 1200x675px). Scene: a rain-soaked K-pop stadium on opening night in Seoul, thousands of glowing purple light sticks, giant stage lights cutting through heavy rain, excited crowd seen from behind and in silhouette, dramatic atmosphere showing a world tour kickoff becoming a city-scale event. Colors: deep indigo, electric purple, silver rain reflections. Style: editorial news thumbnail, dramatic lighting, photorealistic. No real people's faces, no text, no watermarks, no logos, no identifiable people, high quality, 8k resolution.`
- prompt_body: `Generate a dramatic editorial image (16:9 aspect ratio, 1200x675px). Scene: Seoul transformed by a K-pop world tour weekend, merchandising queues, glowing light sticks, giant venue banners, subway exits crowded with fans, city skyline at dusk, energy spreading from a stadium into the surrounding economy. Style: professional news photography, cinematic lighting, photorealistic. No real people's faces, no text, no watermarks, no logos, no identifiable people, high quality, 8k resolution.`
- raw_download_1: `/home/mhhan/Downloads/ChatGPT_Generated_Image_bts_seoul_tour_kickoff_thumbnail.png` (`2026-04-09 21:08:38.103951470 +0900`)
- raw_download_2: `/home/mhhan/Downloads/ChatGPT_Generated_Image_bts_seoul_tour_kickoff_body.png` (`2026-04-09 21:08:38.106951472 +0900`)
- final_thumbnail: `/home/mhhan/workspace/kcl/public/images/news/bts-seoul-tour-kickoff-thumbnail.png` (`2026-04-09 21:12:36.239112586 +0900`)
- final_body: `/home/mhhan/workspace/kcl/public/images/news/bts-seoul-tour-kickoff-1.png` (`2026-04-09 21:12:36.242112588 +0900`)
- reuse_check: `PASS`

## 팩트체크 결과

| # | 주장 | 판정 | 출처 | 조치 |
|:-:|---|:--:|---|---|
| 1 | 2026-04-09 고양 개막, 4월 9일·11일·12일 공연 | PASS | AP, Weverse, Yonhap | 유지 |
| 2 | 폭우 속 4만+ 규모 스타디움 만석 | PASS | AP | 유지 |
| 3 | 현장 머치 픽업 4월 8일~12일 운영 | PASS | Weverse Shop | 유지 |
| 4 | `THE CITY SEOUL` 3월 20일 시작, 일부 이벤트 4월 19일까지 | PASS | Weverse | 유지 |
| 5 | `ARIRANG` 빌보드 200 1위 데뷔 | PASS | AP | 유지 |
| 6 | 투어 규모 85회·34개 도시, 한국 가수 최대급 | PASS | Yonhap, The Korea Times | 유지 |

**검증률**: `6/6 (100%)`
**수정**: `0건` | **삭제**: `0건`

## Local Render Gate

- `http://localhost:3001/ko/news/bts-seoul-tour-kickoff` -> `200`
- `http://localhost:3001/en/news/bts-seoul-tour-kickoff` -> `200`
- `http://localhost:3001/images/news/bts-seoul-tour-kickoff-thumbnail.png` -> `200`
- `http://localhost:3001/images/news/bts-seoul-tour-kickoff-1.png` -> `200`
- `http://localhost:4173/images/news/nextImageExportOptimizer/bts-seoul-tour-kickoff-thumbnail-opt-3840.WEBP` -> `200`
- note: `next build` is blocked by an unrelated pre-existing Supabase env requirement on `/[locale]/community/[id]`; local gate completed with `next dev` + optimizer output verification.
