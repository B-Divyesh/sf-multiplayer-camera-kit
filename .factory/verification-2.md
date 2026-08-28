# Independent verification 2 — PASS

**Date:** 2026-08-28

**Verifier:** factory QA

**Candidate commit:** `52a69fe89b9d7e73970fea08c2956f9eddbc4d06`

**Live URL:** https://multiplayer-camera-kit.sociobot.in/
**Verdict:** **PASS**

This is a fresh verification from a clean, unchanged checkout at the candidate SHA. It supersedes the prior failing report for `fca1fff12b7ecc5b87668becd3f72c13e522e981`. No product source was changed during verification.

## Build, tests, and package

- `npm ci` completed with Node 22.23.2.
- `npm run typecheck` passed. No lint script is defined by the repository.
- `npm test` passed: 4 Vitest files, 22 tests, then a clean production build and Playwright browser suite.
- The exact production `npm run build` passed and emitted `dist/package` and `dist/site`.
- `npm pack --json` produced `multiplayer-camera-kit-0.1.0.tgz`: 26,776 bytes packed, 97,221 bytes unpacked, 10 declared files, and no bundled dependencies.
- A clean temporary consumer installed that tarball. Both ESM import and CommonJS require exposed the documented API. Independent normal/boundary/error checks passed: four-player framing, empty-target pose hold, undersized-world centering, fixed-step deterministic traces, invalid target/delta/`maxZoomDelta` rejection (`NaN`, infinities, negative), and debug overlay drawing.

## Product and browser evidence

The brief’s essential job is covered end-to-end: rectangles and bounds produce a camera pose; a visible debug safety envelope is rendered; ordinary and deliberately impossible formations distinguish `YES` from `LIMIT`; and deterministic traces distinguish a passing path from an intentional off-screen regression.

- Desktop Chromium at 1440 × 900: title, `lang="en"`, one `h1`, one `main`, and image alt text passed. No console or page errors occurred.
- Keyboard-only checks passed: the first Tab reaches the skip link, its focus treatment is a visible 3 px solid outline, Space pauses the canvas demo, and ArrowRight visibly nudges the selected player.
- Clear players → visible empty state → restore recovery passed. The deliberate limit breach reaches `LIMIT`; safe replay reports `PASS`; deliberately broken replay reports `FAIL`.
- `@axe-core/playwright` WCAG 2 A/AA found 0 serious and 0 critical findings (0 findings total in the tested scan).
- At 390 × 844 with reduced motion: the normal initial duo reports `data-all-targets-visible="true"` and `Safe: YES`, drift begins paused, horizontal overflow is 0 px, and all visible buttons/links/selects meet the 44 px target minimum.
- The live service worker controls scope `/`; `registration.update()` completed. After a controlled online reload, an offline reload rendered the application shell and visible offline status successfully.

## Candidate/deployment identity, privacy, and response policy

Fetched live content was byte-for-byte equal to this candidate’s fresh `dist/site` build:

| Path | SHA-256 |
| --- | --- |
| `/` | `c40bf724bfaf00a5eb506955626716992abcf32d6ba7b71ccc6e1209e437a7f0` |
| `/assets/index-BfEUVpIE.js` | `6b38d509c5e35e168c30b98708afabf17733bdf5850c54c540f3636ab80c87fd` |
| `/assets/index-D3E3qBbz.css` | `fd837819bef4c199d25732bea2a68fdef2f6b89be7864e0964d6cb7d4bf370a1` |
| `/instrument-hero.webp` | `524ac41046a966517bf027022571204e84b1feda5219c6b93fc532549d1c2b78` |
| `/sw.js` | `b6e31111e2e62dab438445cb8445f6bba7f2e3057094fe7f6c89fc901012c34a` |

`robots.txt` and `sitemap.xml` also matched. Live HTML is short-cached (`max-age=30`); hashed JS/CSS and the hero are immutable for one year; `/sw.js` is `no-cache`. HTTPS responses include HSTS, `nosniff`, same-origin referrer policy, restrictive same-origin CSP, `X-Frame-Options: DENY`, `Permissions-Policy`, and `Cross-Origin-Opener-Policy: same-origin`.

All browser-observed application requests stayed on `https://multiplayer-camera-kit.sociobot.in`. Source and storage inspection found no analytics, telemetry, cookies, local/session storage, IndexedDB, third-party font/script, or runtime package dependency. The only browser storage is the expected `mck-site-v1` service-worker cache for offline reload. `npm audit --omit=dev --json` reported 0 production vulnerabilities.

## Budgets and limitations

- Fresh production output: JS 16.73 KB (6.50 KB gzip), CSS 15.50 KB (3.99 KB gzip), hero WebP 91,152 bytes, and no downloaded fonts. All are within the stated static-site budgets.
- Lighthouse 13.4.1 was attempted on the live deployment with the preinstalled Playwright Chromium. Lighthouse’s tab crashed during its trace in this environment, so no Lighthouse score is claimed. Independent Playwright, axe, console, request, offline, header, and byte-budget checks above completed in the same environment.

## Defects by severity

- **P0/P1/P2:** none.
- **P3 (tooling advisory, non-release):** `npm ci` reports 3 audit advisories in development tooling (1 moderate, 1 high, 1 critical). The publishable package has no runtime dependencies and the production-only audit is clean. This does not affect the verified shipped artifact, but the maintainer should update the development tool chain when compatible.
