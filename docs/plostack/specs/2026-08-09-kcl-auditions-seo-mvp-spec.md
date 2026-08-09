# KCL Auditions SEO MVP

## Goal

Add an audition-information surface that is exported as crawlable HTML, follows the existing news content pipeline, and puts the official promotional poster above a complete text transcription.

## Included

- `/{locale}/auditions` index pages for every supported UI locale.
- `/{locale}/auditions/{slug}` detail pages only where that translation exists.
- Markdown + frontmatter source files converted to JSON before development, tests, and builds.
- Poster-first detail layout, visible audition facts, official application link, source, and verification date.
- Canonical, Open Graph, Twitter, actual-translation-only `hreflang`, ItemList JSON-LD, and eligible Event JSON-LD.
- Sitemap, desktop navigation, and mobile navigation integration.
- Initial Korean and English content based on official YG audition notices.

## Excluded

- Saved auditions, deadline alerts, database ingestion, admin UI, community, and comments.
- Deployment or merging the AI report backup branches.
- JobPosting structured data. Audition notices are not represented as employment vacancies.

## Content contract

Required frontmatter: `title`, `excerpt`, `agency`, `publishedAt`, `updatedAt`, `mode`, `categories`, `eligibility`, `status`, `officialUrl`, `sourceUrl`, `verifiedAt`, `poster`, `posterAlt`, `posterWidth`, and `posterHeight`.

Optional frontmatter: application dates, audition date, timezone, country/city/venue, virtual location, and `active`.

The poster is never the sole source of information. Every material requirement shown in it must also appear in visible HTML text.

## Verification

- Content generator rejects invalid or duplicate records.
- Unit tests cover actual translation paths and English list fallback behavior.
- ESLint, TypeScript, Vitest, production export, and `git diff --check` pass.
- Exported detail HTML contains the title, facts, Markdown body, source, canonical, and JSON-LD without JavaScript execution.
- Desktop and mobile routes are exercised in the Orca embedded browser with console/page errors checked.
