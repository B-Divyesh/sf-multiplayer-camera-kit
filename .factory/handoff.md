# Multiplayer Camera Kit — verification handoff

## Release identity and verdict

- **Implementation candidate:** `e30ec635bac1d871f622fa6b98b4cbe8df59eebe`
- **Documentation baseline:** `0cc3df03991460824a03d78d395967a104d73779`
- **Live URL:** https://multiplayer-camera-kit.sociobot.in/
- **Independent verdict:** **FAIL — 5 findings, 2 untested or incompletely tested public claims**

Later commits are report-only. Fresh local and live hashes match for the root, JS/CSS, hero, social card, service worker, 404, and public archive.

## Verification completed

From a fresh checkout, `npm ci`, `npm test`, `npm run typecheck`, `npm run build`, `npm pack --json`, both audits, and all 16 claim commands passed. A clean consumer installed the live archive and exercised ESM, CommonJS, declarations, camera output, traces, debug drawing, and invalid input.

Fresh desktop and 390 px phone browsers covered sample entry, reset/exit isolation, empty recovery, keyboard, reduced motion, presets, traces, storage and requests, service-worker update, offline reload, route focus/titles, legal pages, links, 200% text, Canvas failure, and HTTP 404. Axe found 0 violations. Lighthouse scored 100 in all four categories with 1.4 s LCP and 0 CLS.

## Required next work

1. Make **Four corners** safely framed at 390 px; keep **Limit breach** as the intentional failure.
2. Qualify or repair the world-bounds claim for undersized worlds and extend its tagged test.
3. Correct the privacy statement that reset removes the demo key; register and test that claim.
4. Add the required skip link, header/nav, footer, legal links, factory attribution, and version to 404.
5. Replace demo metaphor/lore labels with the documented `player` and `trace result` terms; audit demo copy.

The npm registry name remains unpublished, but this is not a finding because it is not advertised and the hosted install works. There is no backend, tenant state, billing, or AI integration.

See `.factory/verification-3.md` for all claim results, reproductions, hashes, evidence, and earlier-finding disposition. QA changed no product code.
