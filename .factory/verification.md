# Independent verification — FAIL

**Verifier:** factory QA
**Date:** 2026-08-28
**Candidate commit:** `fca1fff12b7ecc5b87668becd3f72c13e522e981`
**Live URL:** https://multiplayer-camera-kit.sociobot.in/
**Verdict:** **FAIL**

The deployment is conclusively the candidate (all fetched release files matched the local production build byte-for-byte), but two product defects remain. The first is release-blocking: the normal default two-player mobile playground is already in a safety-limit failure state at the requested 390 px viewport.

## Defects

### P1 — default mobile two-player path starts in an impossible framing state

**Reproduction:** Open the live URL at 390 × 844 with `prefers-reduced-motion: reduce`. Do not change any setting.

**Observed:** The default `Duo drift` preset has a 342 × 192.375 CSS-pixel canvas and immediately renders `0.380×`, `Safe: LIMIT`, and: `Safety limit reached. 2 players cannot fit above the configured minimum zoom.` The page’s own policy uses 68 px horizontal / 54 px vertical screen-space padding and `minZoom: 0.38`; the normal duo spans 652 world units, while the padded visible width is only 542.105 world units. `inspect().allTargetsVisible` is `false` and the limiting axis is `minZoom`.

**Expected:** The ordinary two-player formation advertised as the default should demonstrate safely framed players on a 390 px phone. The deliberate `Limit breach` preset, not the normal starting state, should be the way to demonstrate this failure.

**Impact:** The smallest useful product promises stable two-to-four-player framing and requires mobile support. A first-load normal mobile journey instead demonstrates failure, making the primary live proof misleading.

### P2 — invalid `maxZoomDelta` silently disables trace regression checking

**Reproduction:** Call `runTrace(trace, { fixedStepMs: 100 })` with `trace.assertions.maxZoomDelta = Number.NaN` and a trace whose zoom moves from `1.5` to `0.3465346534653465` in a step.

**Observed:** It returns `{ ok: true, failures: [] }`. `NaN` is neither rejected as invalid input nor treated as an assertion failure because `actual > NaN` is always false.

**Expected:** Runtime validation should throw `CameraInputError` for a non-finite or negative `maxZoomDelta`, consistent with the package’s validation of rectangles, config, deltas, and fixed-step values.

**Impact:** A caller that gets this value from untyped/configured input can receive a false-green deterministic replay report, weakening the stated off-screen-regression safety net.

### P3 — production response policy lacks a Content-Security-Policy

Live HTML and asset responses have HSTS, `Referrer-Policy: same-origin`, `X-Content-Type-Options: nosniff`, and long immutable caching for hashed assets, but no `Content-Security-Policy`, frame-ancestors/X-Frame-Options, Permissions-Policy, or COOP header. This was not the cause of the fail, but should be added at the static host for defense in depth.

## Verification evidence

### Reproducibility and library package

- Clean candidate checkout was confirmed before testing: `fca1fff12b7ecc5b87668becd3f72c13e522e981`; `origin/main` pointed to the same commit.
- `npm ci` completed. It reported three audit advisories in the development tool tree (`vite`/`esbuild`; 1 high, 1 moderate, 1 critical in the default audit; `npm audit --omit=dev` reported 1 high and 1 moderate because the lockfile marks the build tooling as installed). The publishable tarball itself has no runtime or bundled dependencies.
- `npm test` passed: 3 Vitest files, 16 tests; it also ran the production build and browser suite.
- `npm run typecheck` passed.
- Exact production `npm run build` passed and created `dist/package` and `dist/site`.
- `npm pack` produced `multiplayer-camera-kit-0.1.0.tgz`: 25,724 bytes packed / 95,924 bytes unpacked, 10 declared files only. A fresh temporary consumer installed that tarball and exercised all public exports via both ESM `import` and CommonJS `require` successfully.
- Boundary/error checks confirmed descriptive rejection for invalid padding, negative update delta, non-finite target coordinate, and zero fixed step. The non-finite `maxZoomDelta` case above is the exception.

### Functional and accessibility browser checks

Live Playwright 1.58 Chromium checks at desktop 1440 × 900 passed:

- HTTP 200; title, `lang="en"`, exactly one `h1`, and one `main` present.
- Keyboard Tab reaches the skip link; it has a solid visible focus outline. Canvas keyboard Space pauses motion and ArrowRight nudges the selected player.
- Clear players → visible empty state → Restore players recovery works.
- Deliberate limit breach produces `LIMIT`; safe replay produces `PASS — every player visible`; broken replay produces `FAIL — player left frame`.
- `@axe-core/playwright` WCAG 2 A/AA scan had **0 violations** (thus 0 serious/critical); browser console and page errors were empty.
- At the requested 390 × 844 viewport with reduced motion: horizontal overflow was 0, animation was paused (`aria-pressed="true"`), keyboard nudge worked, and no render error appeared. The P1 default framing failure above was observed in that same test.
- The deployed PWA registers `/sw.js`, has active scope `/`, `registration.update()` completes without a waiting worker, and cache `mck-site-v1` is present. After an online controlled reload, an offline reload still rendered the title, h1, main, ready demo, and offline banner with no errors.

### Deployment, privacy, headers, and budgets

- Live `index.html` SHA-256: `956773deccbe8384c5f6da9454acc50247a037a8a23a6a3d91b7f157025c26ef`, identical to `dist/site/index.html`.
- Live JS, CSS, hero WebP, service worker, robots.txt, and sitemap.xml each matched the candidate build byte-for-byte. Live assets are therefore the tested candidate, not a stale deployment.
- Browser-observed request origins contained only `https://multiplayer-camera-kit.sociobot.in`; source review found no analytics, telemetry, cookies, local/session storage, indexed DB, third-party fonts, or third-party scripts. Browser storage check found empty cookies and zero local/session storage entries. The service worker’s local cache contains only the offline app shell/assets.
- Live cache headers: HTML `public, must-revalidate, max-age=30`; hashed JS/CSS and WebP `public, max-age=31536000, immutable`; `/sw.js` `no-cache`. HTTPS, HSTS, nosniff, and same-origin referrer policy are present.
- Build budgets pass: JS 16.34 KB / 6.42 KB gzip (under 200 KB), CSS 15.50 KB / 3.99 KB gzip (under 50 KB), hero 91,152 bytes (under 300 KB), and no webfont payload.
- Lighthouse 12.8.2 was attempted against the local production preview using the preinstalled Chromium. The Chromium tab crashed during Lighthouse tracing, so no score is claimed; this is an environment/tool crash, not a page console error. The browser and axe checks above completed successfully in the same Chromium binary.

## Required resolution before approval

1. Make the normal mobile initial formation fit its padded safe envelope (for example, derive mobile padding/min zoom from canvas dimensions, use a mobile-safe demo formation, or explicitly set a lower safe min zoom) and add a 390 px assertion that the default duo has `allTargetsVisible === true`.
2. Validate `TraceAssertions.maxZoomDelta` as a finite number greater than or equal to zero and add an invalid-value test for `NaN`, Infinity, and negatives.
3. Configure a restrictive static-host CSP and appropriate frame/permissions/origin-isolation headers, then rerun production checks.

No product source code was modified by this verification. This report and the handoff status are the only repository changes.
