# Review 1 — Keep multiple game players in frame

**Date:** 2026-09-05  
**Live URL:** https://multiplayer-camera-kit.sociobot.in/  
**Implementation candidate reviewed:** `8ab115398e1a3c2b08182fa44fd8e9b0ea4d4c25`  
**Documentation SHA reviewed:** `08b2ff4464d0ab528a635d414801db2a8b5fe68d`  
**Verdict: FAIL**  
**Findings:** 9  
**Untested public claims:** 20

The later commits between the implementation candidate and documentation SHA only change `.factory/handoff.md` and `.factory/verification-2.md`. A clean build at the documentation SHA produced the same HTML, JavaScript, CSS, hero image, service worker, robots file, and sitemap hashes as the live deployment. The live runtime is therefore the last implementation candidate; no later report-only commit requires another product image.

## First screen before scrolling

- **Job shown:** keep two to four browser-game players inside one camera frame and return an inspectable camera pose.
- **Audience shown:** the copy says “two-to-four-player browser games,” but does not directly name their developers.
- **First action shown:** “Calibrate the camera,” beside a copy button for `npm i multiplayer-camera-kit`.

The job is understandable on desktop and phone. The required first action, “Try it with sample data,” is absent. The first screen also lacks three short facts covering privacy, offline behavior, and price.

## Findings

### R1 — P1 — The public install command cannot install the package

`npm view multiplayer-camera-kit version --json` and a clean consumer’s `npm install multiplayer-camera-kit` both returned npm `E404 Not Found`. The live first screen and README present that command as the way to start. The in-page playground imports `../src`, not an installed published artifact.

Expected: the advertised command installs the reviewed package, and the playground exercises the published package. The locally packed tarball works, but that does not repair the public user path.

### R2 — P1 — The required one-click demo sandbox is absent

The live primary action is “Calibrate the camera.” It scrolls to a useful two-player sample, but there is no “Try it with sample data” action, persistent “Demo — sample data, nothing is saved” label, visible reset control, “Start for real” action, or separate demo state. `/demo` returns the ordinary home page with the home title. `.factory/demo.md` is missing.

The sample output itself is realistic and reports two players safely framed at `0.585×` on the tested phone. Demo actions remained in memory: cookies, local storage, session storage, and IndexedDB-facing application state were empty, and all observed requests were same-origin. There is no real-data store to alter. Those positive observations do not satisfy the required explicit sample/real separation or reset path.

### R3 — P1 — There is no claims registry; 20 public claim families are untested

`.factory/claims.json` does not exist, no test has an `@claim:<id>` tag, and therefore there are no declared claim commands to run. This is a release-blocking finding under the claims contract even though several outcomes pass untagged unit or browser tests.

The 20 distinct public claim families are:

1. Keeps all players in frame when configured limits permit it.
2. Supports two-to-four-player browser games.
3. Produces a stable camera pose.
4. Provides a visible debug safety envelope.
5. Replays traces deterministically at a fixed step.
6. Catches a deliberate off-screen regression.
7. Has zero runtime dependencies.
8. Is smaller than 4 KB minified and gzip-compressed.
9. Ships an ESM export.
10. Ships a CommonJS export.
11. Ships TypeScript declarations.
12. Integrates in fewer than 30 lines.
13. Is engine-agnostic and needs no engine adapter.
14. Holds the last pose for an empty target list.
15. Clamps the camera to world bounds.
16. Rejects invalid input with `CameraInputError`.
17. Rejects non-finite or negative `maxZoomDelta` values.
18. Works locally after the first visit when offline.
19. Uses no accounts, telemetry, analytics, or player-data collection.
20. Is free under the MIT license.

Manual evidence supports many of these: the package ESM payload is 3,133 bytes gzip, the tarball has no bundled/runtime dependency, both module formats and declarations are present, camera and trace checks pass, offline reload works, and request/storage inspection supports the privacy wording. They remain untested claims because none has the required registry entry and exactly tagged sandbox test.

### R4 — P2 — Required routes, legal pages, and 404 behavior do not exist

Fresh requests to `/demo`, `/privacy`, `/terms`, `/404`, and `/not-a-real-page` all return HTTP 200 with the home page, home title, and home h1. There is no designed not-found page. The deliberate HTTP 404 allowed by the review rules is never produced. The site uses page anchors rather than route-aware navigation, so it has no per-route titles, focus movement, or route announcement.

Expected: real demo, privacy, terms, and designed 404 routes; unknown paths return the 404 document; route titles and accessible navigation state are correct.

### R5 — P2 — Required site metadata and shared page skeleton are incomplete

The base title, description, canonical, language, theme color, h1, and main landmark pass. However, there are no Open Graph tags, Twitter card tags, 1200×630 social image, SVG file favicon, or 180 px Apple touch icon. `sitemap.xml` lists only `/`. The footer has no Privacy or Terms links and no version/build id. The wordmark says “Range unit 01” and links to `#top`, which does not return fallback routes to `/`. External source links are not identified as external.

### R6 — P2 — The phone page has a serious keyboard-accessibility failure

An axe WCAG 2 A/AA scan at 390×844 reports `scrollable-region-focusable` with serious impact on the horizontally scrollable code `<pre>`. It cannot receive keyboard focus and has no focusable descendant. The repository browser suite scans axe only in its desktop context, so its zero-violation result does not cover this phone defect.

Other accessibility checks pass: desktop axe has zero violations; the skip link becomes visible with a 3 px focus outline; standard controls work by keyboard; reduced motion starts drift paused; controls meet 44 px sizing; 200% text resizing showed no horizontal page overflow or clipped controls; the single light treatment passes the tested axe contrast rules.

### R7 — P2 — First-screen and plain-language requirements are incomplete

The first-screen sentence names browser games but not their developers. The primary action says “Calibrate the camera,” not what sample data will open. Privacy, offline, and price facts are not present on the phone first screen. Product copy also uses brand-lore or metaphor labels that the plain-words contract forbids, including “Range unit 01,” “Live viewfinder,” “Respect the rails,” “Prove the path,” and “Free, local, and quiet.” `.factory/copy-audit.md` is missing.

Expected: a direct audience sentence, the sample action plus consequence, three concrete facts, and section names that describe their content without instrument lore.

### R8 — P2 — The render-error recovery action cannot recover the stated error

With Canvas 2D unavailable, the live page says: “Canvas 2D is not available in this browser. Reset the demo to continue.” Activating its “Reset the demo” button leaves the same error visible because reset cannot restore browser Canvas support.

Expected: explain that the browser lacks Canvas 2D and give an action that can work, such as using a supported browser. Do not promise that reset will fix an unsupported capability.

### R9 — P3 — The previously reported development-tool advisories remain open

`npm audit --json` reports three development-tool findings: one moderate (`esbuild`), one high (`vite`), and one critical (`vitest`). Fixed compatible versions are available according to npm. `npm audit --omit=dev --json` reports zero production vulnerabilities, and the publishable package has no runtime dependencies.

This was the one open P3 noted in the previous verification and is still unresolved.

## Earlier finding disposition

| Earlier finding | Current evidence | Disposition |
| --- | --- | --- |
| P1: default 390 px duo started at `LIMIT` | Fresh live phone context reports `Safe: YES`, `data-all-targets-visible="true"`, and `0.585×` | Resolved |
| P2: invalid `maxZoomDelta` could return false green | Unit suite and fresh packed consumer reject `NaN`, both infinities, and negative values with `CameraInputError` | Resolved |
| P3: missing response security policy | Live responses include CSP with `frame-ancestors 'none'`, X-Frame-Options, Permissions-Policy, COOP, HSTS, nosniff, and same-origin referrer policy | Resolved |
| P3: three development-tool advisories | Current clean `npm audit` still reports moderate/high/critical; production-only audit is clean | Open as R9 |

## Functional and browser evidence

- Fresh desktop 1440×900 and phone 390×844 contexts loaded with no console or page errors and no horizontal page overflow.
- Clicking the first action reached the populated two-player playground. Duo and boundary-limit output were coherent.
- Clear players showed the empty state; Add a player restored the sample and returned focus to the canvas.
- Keyboard Space toggled motion and ArrowRight nudged a player. Reduced motion loaded paused.
- The safe trace returned `PASS — every player visible`; the broken trace returned `FAIL — player left frame`.
- Unit tests cover normal framing, undersized worlds, world-edge clamping, viewport resize, impossible zoom limits, empty input, invalid config/targets/time deltas, trace identities/timestamps, deterministic replay, zoom jumps, and debug drawing.
- A fresh tarball consumer passed ESM and CommonJS imports, normal framing, trace replay, overlay drawing, and invalid `maxZoomDelta` rejection.
- The service worker controlled a fresh live context, `registration.update()` completed, cache `mck-site-v1` existed, and an offline reload rendered the shell and explicit offline status.
- All browser-observed application requests stayed on `https://multiplayer-camera-kit.sociobot.in`; cookies, local storage, and session storage were empty. No third-party scripts or fonts loaded.
- The product is a static library site, so backend tenant isolation, restart persistence, health, and 429/Retry-After checks do not apply. AI is not useful to the core camera-math job, so there is no missed AI step.

## Clean-checkout commands

Run at documentation SHA `08b2ff4464d0ab528a635d414801db2a8b5fe68d` with Node 22.23.2 and npm 10.9.8:

| Command | Result |
| --- | --- |
| `npm ci` | Passed; reported 3 development advisories |
| `npm test` | Passed: 4 files, 22 tests, build, desktop/mobile browser checks, offline check |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; created `dist/package` and `dist/site` |
| `npm run build:site` | Passed |
| `npm run test:e2e` | Passed as written; it does not axe-scan the phone context |
| `npm pack --json` after a completed build | Passed; 26,776-byte tarball, 10 files |
| `npm install multiplayer-camera-kit` in a clean consumer | Failed with npm E404 |
| Every `.factory/claims.json` command | No commands exist because the required file is missing |
| Factory `verify-url.sh` | Passed base title/lang/main/alt/console checks |
| Playwright axe, desktop | 0 violations |
| Playwright axe, 390 px phone | 1 serious violation (`scrollable-region-focusable`) |

The standalone axe CLI could not start because this worker has no ChromeDriver. The equivalent Playwright axe integration completed on both viewports. Lighthouse 13.0.1 was attempted with the preinstalled Chromium and failed with `NO_NAVSTART`; no Lighthouse score is claimed.

## Performance and deployment identity

- Local production output: package ESM 7,486 bytes / 3,133 bytes gzip; site JS 16,735 / 6,526 bytes gzip; CSS 15,496 / 4,003 bytes gzip; hero WebP 91,152 bytes. All static budgets pass.
- A throttled 390 px Chromium run at 4× CPU slowdown and simulated mobile network recorded FCP 632 ms, LCP 632 ms, CLS 0, and a 32 ms tested click event. This is diagnostic evidence, not a Lighthouse score.
- Live and clean-build SHA-256 values match for `index.html`, hashed JS, hashed CSS, hero WebP, `sw.js`, `robots.txt`, and `sitemap.xml`.

## Evidence files

The required report copy and machine result are at `/work/.evidence/qa-report.md` and `/work/.evidence/qa-result.json`. Supporting evidence includes `live-browser-audit.json`, desktop/phone screenshots, the post-action phone screenshot, 200% text screenshot, and factory verifier output files in `/work/.evidence/`.

## Required next work

Publish the package through the factory release path; add a real library demo route and sandbox controls; create claim-tagged tests and `.factory/claims.json`; implement required routes, metadata, footer, 404 behavior, and plain copy; fix and test the phone code scroller and the nonrecoverable Canvas message; update vulnerable development dependencies; then rerun the full review from a fresh checkout.
