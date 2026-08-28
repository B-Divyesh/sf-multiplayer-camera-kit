# Multiplayer Camera Kit v0.1.0 — independent verification handoff

## Verification outcome: PASS

**Tested candidate:** `52a69fe89b9d7e73970fea08c2956f9eddbc4d06`

**Verified URL:** https://multiplayer-camera-kit.sociobot.in/
**Detailed report:** [`.factory/verification-2.md`](verification-2.md)

Fresh QA confirms the public deployment is byte-for-byte the candidate’s production output and passes the library, browser, responsive, accessibility, privacy, service-worker, response-policy, and budget checks. The previous report’s 390 px default-framing and invalid-`maxZoomDelta` failures are resolved.

### Exact verification

```sh
npm ci
npm run typecheck
npm test
npm run build
npm pack --json
```

- Typecheck passed; `npm test` passed (4 files / 22 tests), including the repository’s production browser suite. No lint script exists.
- Fresh consumer installation passed for ESM and CommonJS public APIs, normal four-player and boundary framing, trace determinism/rejection paths, and debug overlay drawing.
- Live desktop and 390 × 844 reduced-motion checks passed: keyboard skip link/focus, Space/Arrow canvas controls, empty-state recovery, safe/broken replay, zero console/page errors, zero serious/critical axe findings, no horizontal overflow, and 44 px visible control targets.
- The live PWA’s service worker is controlling and an offline reload works. Browser-observed application requests stayed same-origin; cookies and local/session/IndexedDB storage are empty. The service-worker cache is the expected offline shell only.
- Headers include restrictive CSP, frame denial, permissions restriction, COOP, HSTS, nosniff, and referrer policy. Hashes for HTML, JS, CSS, hero, service worker, robots, and sitemap match the local build.
- Output budgets: JS 16.73 KB (6.50 KB gzip), CSS 15.50 KB (3.99 KB gzip), hero 91 KB; no webfont payload.

### Open defects / known gaps

- **P0/P1/P2:** none.
- **P3, development tooling only:** `npm ci` reports three audit advisories in dev tooling (moderate/high/critical); `npm audit --omit=dev` is clean and the published package has no runtime dependencies. Update tooling in a future maintenance change.
- Lighthouse 13.4.1 could not produce a score because its Chromium tab crashed while tracing in this environment. It is not claimed as a score; the passing browser, axe, request, header, and budget checks are recorded in the detailed report.

## Repair scope

This repair resolves every finding in the independent verification report for candidate `fca1fff12b7ecc5b87668becd3f72c13e522e981`:

**Repair implementation commit:** `8ab115398e1a3c2b08182fa44fd8e9b0ea4d4c25`.

1. **390 px default duo framing:** the normal `Duo drift` formation now uses a compact, bounded two-player drift whenever the viewfinder is below 600 CSS px wide. It retains the existing 68 px horizontal / 54 px vertical safety margin and 0.38 zoom floor, while keeping both normal players inside the padded envelope. `Limit breach` is unchanged as the explicit impossible-framing demonstration.
2. **`maxZoomDelta` runtime validation:** `runTrace` now rejects `NaN`, either infinity, and negative assertion values with `CameraInputError` before replay. Finite values at or above zero preserve the existing trace behavior.
3. **Static response policy:** the deployment configuration now applies site-wide CSP, `X-Frame-Options: DENY`, `Permissions-Policy`, and `Cross-Origin-Opener-Policy: same-origin`. The CSP allows only same-origin application resources, plus the existing inline data-URI favicon; it denies plugins, framing, and untrusted bases/forms.

The library API, normal desktop demo formation, deliberate limit-breach behavior, package/deployment class, visual thesis, and all previously passing behavior are preserved.

## Regression coverage

- Browser regression: a 390 × 844 reduced-motion first load asserts the default duo canvas reports `data-all-targets-visible="true"` and the visible readout is `YES`, in addition to existing keyboard, overflow, offline, touch-target, desktop, console, and axe checks.
- Trace regression: a fixed-step replay moves from `1.5` to `1000 / 2886` zoom and verifies that an ordinary finite limit catches the jump. The same replay verifies that `NaN`, `Infinity`, `-Infinity`, and a negative limit throw `CameraInputError`.
- Response-policy regression: unit coverage asserts the static-host config retains restrictive CSP, frame protection, permissions restrictions, and opener isolation.

## Exact verification performed

Run from a clean dependency install on 2026-08-28:

```sh
npm ci
npm run typecheck
npm test
npm pack --json
```

Results:

- `npm ci`: completed successfully. The npm audit reported three advisories in the development tooling tree (one moderate, one high, one critical); the publishable package has no runtime dependencies.
- `npm run typecheck`: passed.
- `npm test`: passed — 4 Vitest files / 22 tests, production package and site build, then Playwright Chromium checks.
- Browser suite: desktop passed; 390 × 844 reduced-motion passed with default duo safely framed; keyboard Space and ArrowRight passed; empty-state recovery, deliberate limit state, safe/broken replays, touch targets, offline reload, and zero horizontal overflow passed; no page/console errors; axe WCAG 2 A/AA serious/critical violations: 0.
- Production build: `dist/package` and `dist/site` produced. Site assets are 16.73 KB JavaScript (6.50 KB gzip), 15.50 KB CSS (3.99 KB gzip), and the existing 91 KB WebP hero — within budget.
- `npm pack --json`: produced the ready-to-publish `multiplayer-camera-kit-0.1.0.tgz` (26,776 bytes packed / 97,221 bytes unpacked, 10 declared files). A fresh temporary consumer install successfully exercised ESM `import` and CommonJS `require` public exports.
- The prior live site was checked before deployment and confirmed to be the verifier candidate by its 12,286-byte HTML response and absence of the newly configured response-policy headers.
- **Production deployment:** verified `dist/site` was deployed to Azure Static Web Apps production (`sf-multiplayer-camera-kit`) on 2026-08-28. The custom domain now returns ETag `"14765747"`, a 01:48:40 UTC last-modified time, CSP, `X-Frame-Options: DENY`, restrictive Permissions-Policy, and `Cross-Origin-Opener-Policy: same-origin`; immutable JavaScript assets receive the same CSP and immutable caching.
- **Live browser verification:** Playwright Chromium passed at desktop and 390 × 844 reduced-motion on `https://multiplayer-camera-kit.sociobot.in/`. The default mobile duo reports `data-all-targets-visible="true"` and `Safe: YES`; desktop keyboard Space/ArrowRight worked; axe WCAG 2 A/AA serious/critical violations were 0; page/console errors were 0; all observed requests stayed on the product origin. The registered service worker accepted `registration.update()`.

## Run, package, and deploy

```sh
npm ci
npm test
npm run typecheck
npm run build
npm pack
```

- Static deployment root: `dist/site`.
- Site-only build: `npm run build:site`.
- Full build: `npm run build`.
- Publish-ready tarball: `npm pack`. The factory owns registry credentials; this repair does not publish to npm.

## Privacy and known limits

No analytics, telemetry, cookies, accounts, local/session storage, payment, third-party runtime scripts, or third-party fonts are added. The service worker cache remains limited to the offline application shell/assets.

Rotation, networking, rendering, physics, and split-screen choice remain intentionally out of scope. Targets are axis-aligned world-space rectangles, and trace interpolation requires stable target IDs.
