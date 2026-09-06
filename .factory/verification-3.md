# Verification 3 — repair follow-up

**Date:** 2026-09-06  
**Implementation candidate:** `e30ec635bac1d871f622fa6b98b4cbe8df59eebe`  
**Live URL:** https://multiplayer-camera-kit.sociobot.in/  
**Verdict:** PASS

## First screen

- **Job:** Keep co-op players in one camera frame.
- **Audience:** Browser game developers who need safe framing without rebuilding camera math.
- **First action:** **Try it with sample data**. It opens a populated two-player camera playground.

The first screen also states the MIT price, privacy boundary, and offline behaviour in short lines.

## Review finding disposition

| Review 1 finding | Current evidence | Disposition |
| --- | --- | --- |
| R1 P1: advertised registry install returned 404 | The site and README now advertise a product-hosted `.tgz` URL. A fresh live `npm install <that URL>` installed the package and created a finite camera pose. The registry name is not advertised. | Resolved for the public user path; npm-registry publication remains a factory credential dependency. |
| R2 P1: no demo sandbox | `/demo` opens sample players. Its persistent banner, reset, Start for real action, `demo:` key, and direct URL all work. | Resolved |
| R3 P1: no claims registry | `.factory/claims.json` has 16 claims. Every id appears in exactly one tagged test. Each declared command was run individually. | Resolved |
| R4 P2: missing routes and 404 | `/demo`, `/privacy`, and `/terms` have route titles and one h1. `/not-a-real-page` returns HTTP 404 with the designed 404 page. | Resolved |
| R5 P2: incomplete metadata/skeleton | Open Graph and Twitter metadata, social card, favicon, touch icon, sitemap routes, legal footer, build id, and external-link labels are present. | Resolved |
| R6 P2: phone code scroller | The code blocks are keyboard focusable. Fresh 390 px Playwright axe found zero serious or critical violations. | Resolved |
| R7 P2: first-screen/plain copy | The landing copy was rewritten and audited in `.factory/copy-audit.md`. | Resolved |
| R8 P2: Canvas error reset could not recover | The error explains Canvas support and links to browser support instead of claiming reset will restore a missing capability. | Resolved |
| R9 P3: development advisories | Vite and Vitest were updated. `npm audit --json` and production-only audit report zero vulnerabilities. | Resolved |

The earlier 390 px initial framing, trace `maxZoomDelta`, and response-header repairs remain covered by unit and browser checks.

## Commands and results

From the documented setup:

| Command | Result |
| --- | --- |
| `npm ci` | Passed before verification |
| `npm test` | Passed: 20 unit tests, built-site desktop/mobile/offline/axe checks, and served-tarball consumer check |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; wrote `dist/package`, `dist/site`, and the public package download |
| `npm pack --json` | Passed: 26,764-byte tarball, 10 files, no bundled dependencies |
| `npm audit --json` | Passed: 0 vulnerabilities |
| Every `.factory/claims.json` command | Passed individually: 9 unit claims, 4 browser claims, 3 fresh-consumer claims |
| Factory `verify-url.sh` | Passed against live HTTPS root: title, language, main, alt text, unlabeled buttons, and console |

The standalone axe CLI was attempted but could not locate a Chrome binary in this worker. The equivalent Playwright axe scan ran on the live 390 px demo and found zero serious/critical findings.

## Live evidence

- Fresh desktop and phone contexts completed the sample flow. The default phone sample reports `Safe: YES`; reduced motion starts paused.
- The live demo reset restored the duo sample. Start for real removed its `demo:` localStorage key. Browser cookies stayed empty.
- All recorded application requests used `https://multiplayer-camera-kit.sociobot.in` only.
- A controlled online visit followed by an offline `/demo` reload rendered the populated demo and visible offline status.
- `GET /not-a-real-page` returned HTTP 404 and the designed page. `/demo` returned 200.
- A fresh temporary consumer ran `npm install https://multiplayer-camera-kit.sociobot.in/downloads/multiplayer-camera-kit-0.1.0.tgz` and imported `createCamera` successfully.
- Root HTML, hashed JavaScript, hashed CSS, hero image, social card, service worker, and 404 document matched the local production build byte-for-byte. The host does not serve `staticwebapp.config.json` directly; its route policy is proven by the live 404 result.
- Live HTTPS headers include CSP with `frame-ancestors 'none'`, X-Frame-Options, Permissions-Policy, COOP, HSTS, nosniff, and same-origin referrer policy.

## Budgets

| Asset | Raw | Gzip |
| --- | ---: | ---: |
| Site JavaScript | 24,801 B | 9,373 B |
| Site CSS | 18,868 B | 4,575 B |
| Hero WebP | 91,152 B | — |
| Social WebP | 53,748 B | — |

All stated static budgets pass. Lighthouse 13.4.1 was attempted against the live site with the preinstalled Playwright Chromium, but the runner could not connect to Chrome in this worker; no Lighthouse score is claimed.

## Scope notes

This is a static npm library site. Backend tenant isolation, restart persistence, health endpoints, billing, and rate limits do not apply. AI would not improve the camera-math job, so no AI feature was added. The product remains free; there is no paid offer or billing metadata.
