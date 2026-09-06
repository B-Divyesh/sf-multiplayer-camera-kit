# Verification 3 — Keep co-op players in one camera frame

**Date:** 2026-09-06  
**Implementation candidate:** `e30ec635bac1d871f622fa6b98b4cbe8df59eebe`  
**Documentation baseline:** `0cc3df03991460824a03d78d395967a104d73779`

**Live URL:** https://multiplayer-camera-kit.sociobot.in/  
**Verdict: FAIL**

**Findings: 5** (`P0: 0`, `P1: 2`, `P2: 2`, `P3: 1`)

**Untested or incompletely tested public claims: 2**

The live product is the implementation candidate. Later commits through the documentation baseline change only reports. Fresh local build hashes match the live root HTML, JavaScript, CSS, hero, social card, service worker, 404 page, and public package archive.

## First screen before scrolling

- **Job:** Keep co-op players in one camera frame.
- **Audience:** Browser game developers who need safe framing without rebuilding camera math.
- **First action:** **Try it with sample data**. The adjacent text says it opens a populated two-player camera playground.

These items and the three MIT, privacy, and offline facts are visible without scrolling at both 1440 × 900 and 390 × 844. The root title is `Multiplayer Camera Kit — Keep players in frame`.

## Findings

### F1 — P1 — The normal four-player sample fails on a 390 px phone

Open live `/demo` in a fresh 390 × 844 context with reduced motion, then choose **Four corners**.

Observed: the readout changes to `Safe: LIMIT` at `0.380×` and says, “Safety limit reached. 4 players cannot fit above the configured minimum zoom.” The separate **Limit breach** preset also reports `LIMIT`. The desktop four-player preset reports `YES`.

Expected: the normal four-player formation should demonstrate successful framing on the required phone viewport. Only **Limit breach** should be the intentional failure. This is part of the brief’s two-to-four-player job, and `.factory/demo.md` distinguishes the four-player formation from the deliberate limit breach.

Evidence: `/work/.evidence/live-phone-quad-limit.png`.

### F2 — P1 — The world-bounds claim is false at the undersized-world boundary

The declared and README claim says: “The camera visible rectangle never leaves the configured world bounds.” Its tagged test checks only a large world with one target at an edge.

A clean consumer installed the public archive and called `frameTargets([], { viewport: { width: 800, height: 600 }, world: { x: 20, y: 40, width: 200, height: 100 }, maxZoom: 1 })`.

Observed pose: `x: -280`, `y: -210`, `visibleWidth: 800`, `visibleHeight: 600`. The visible rectangle extends beyond every world edge. Centering is reasonable when the viewport cannot fit inside the world, but the absolute public claim is false and its declared test is incomplete.

Expected: qualify the claim and README for worlds smaller than the visible rectangle, or define and implement different behavior. Add this boundary to `@claim:world-bounds`.

### F3 — P2 — The privacy page gives false reset behavior

Live `/privacy` says, “Leaving or resetting the demo removes that key.”

In a fresh context, `demo:multiplayer-camera-kit:state` had value `sample` before **Reset demo** and still had value `sample` afterward. This is consistent with reset restoring the sandbox and inconsistent with the privacy text. **Start for real** correctly removes the key.

Expected: say that reset replaces or restores sample state and leaving removes the key. This public statement is not listed in `.factory/claims.json`; the private-demo claim does not test reset storage behavior.

### F4 — P2 — The 404 page omits the required shared structure

The unknown URL correctly returns HTTP 404 and a designed page, but that document has no skip link, `header`, `nav`, or `footer`. It also lacks the shared Privacy, Terms, factory, and version links. The accessibility and site-structure contracts require the standard landmarks and consistent header/footer on every route.

Expected: retain the real HTTP 404 while using the required shared skeleton and a skip link.

### F5 — P3 — The demo retains metaphor and inconsistent terminology

The demo contains the heading **Fit the party** plus labels such as **Optical policy** and **MCK / replay receipt**. The plain-words contract forbids metaphor/brand-lore labels and requires one term for one concept. `.factory/copy-audit.md` defines the moving game entity as **player**, but audits only the landing template and misses this demo copy.

Expected: use direct terms such as **Frame the players**, **Four-player sample**, and **Trace result**, then extend the copy audit to the demo.

## Declared claim results

All 16 commands in `.factory/claims.json` were run individually from a fresh checkout. Every command exited successfully. Independent checks found one false declared claim and one unlisted public claim.

| Claim | Declared command | Result |
| --- | --- | --- |
| `frame-targets` | `npm run test:unit -- --testNamePattern @claim:frame-targets` | PASS |
| `stable-camera` | `npm run test:unit -- --testNamePattern @claim:stable-camera` | PASS |
| `debug-envelope` | `npm run test:unit -- --testNamePattern @claim:debug-envelope` | PASS |
| `deterministic-trace` | `npm run test:unit -- --testNamePattern @claim:deterministic-trace` | PASS |
| `offscreen-regression` | `npm run test:unit -- --testNamePattern @claim:offscreen-regression` | PASS |
| `empty-targets` | `npm run test:unit -- --testNamePattern @claim:empty-targets` | PASS |
| `world-bounds` | `npm run test:unit -- --testNamePattern @claim:world-bounds` | **FAIL — command passes, but F2 proves the claim false at an untested boundary** |
| `input-validation` | `npm run test:unit -- --testNamePattern @claim:input-validation` | PASS |
| `zoom-validation` | `npm run test:unit -- --testNamePattern @claim:zoom-validation` | PASS |
| `package-delivery` | `npm run test:consumer -- --grep @claim:package-delivery` | PASS |
| `package-formats` | `npm run test:consumer -- --grep @claim:package-formats` | PASS |
| `mit-license` | `npm run test:consumer -- --grep @claim:mit-license` | PASS |
| `demo-sandbox` | `npm run test:e2e -- --grep @claim:demo-sandbox` | PASS |
| `offline-demo` | `npm run test:e2e -- --grep @claim:offline-demo` | PASS |
| `private-demo` | `npm run test:e2e -- --grep @claim:private-demo` | PASS as written; it omits F3’s reset claim |
| `trace-playground` | `npm run test:e2e -- --grep @claim:trace-playground` | PASS |

The untested-claim count is two: the incomplete undersized-world case in `world-bounds`, and the unlisted privacy statement about reset removing storage.

## Clean-checkout and installed-package evidence

The checkout began clean at `0cc3df03991460824a03d78d395967a104d73779` with Node 22.23.2 and npm 10.9.8.

| Command | Result |
| --- | --- |
| `npm ci` | PASS; 0 vulnerabilities |
| `npm test` | PASS; 20 unit tests, all browser groups, and served-package consumer |
| `npm run typecheck` | PASS |
| `npm run build` | PASS; created `dist/package` and `dist/site` |
| `npm pack --json` | PASS; 26,764 bytes, 10 files, no bundled dependencies |
| `npm audit --json` | PASS; 0 vulnerabilities |
| `npm audit --omit=dev --json` | PASS; 0 vulnerabilities |
| Factory `verify-url.sh` | PASS; HTTP 200, title/lang/main/alt/button/console checks |

A separate empty consumer installed the documented live URL with `npm install --ignore-scripts https://multiplayer-camera-kit.sociobot.in/downloads/multiplayer-camera-kit-0.1.0.tgz`. ESM, CommonJS, TypeScript compilation, four-player framing, empty-target hold, invalid-input rejection, deterministic replay, and debug drawing ran successfully. `npm ls --omit=dev --all` showed no transitive runtime dependency.

## Live browser, accessibility, privacy, and recovery evidence

- Fresh desktop and phone contexts had no console or page errors.
- One click opened `/demo` with two populated players, finite x/y/zoom, `Safe: YES`, and the persistent sample label.
- Reset restored the two-player sample. Start for real removed the only `demo:` localStorage key. Cookies, session storage, and IndexedDB stayed empty.
- All observed application requests stayed on `https://multiplayer-camera-kit.sociobot.in`.
- Clear players showed the empty state; Add a player restored it and returned focus to the canvas.
- ArrowRight nudged the selected player. Space toggled motion. Reduced motion started paused.
- The safe trace reported `PASS`; the deliberate regression reported `FAIL`, player id, and timestamp.
- Route links, back navigation, route titles, h1 focus, and polite route announcements worked.
- `/privacy`, `/terms`, and all crawled internal and external links returned successful responses.
- `/not-a-real-page-v3` returned HTTP 404 with the designed page and a working home link.
- The Canvas-unavailable path explains the unsupported capability and links to browser support.
- Service-worker `registration.update()` completed. Offline `/demo` retained the sample, title, label, and offline status.
- WCAG 2 A/AA Playwright axe scans on desktop home/demo/legal pages, phone home/demo, and 404 reported 0 violations.
- At 390 × 844 there was no page overflow, visible controls met 44 px, and 200% text caused no horizontal overflow.

Lighthouse 13.4.1 completed on live HTTPS: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.4 s, CLS 0, and total blocking time 0 ms. Evidence is `/work/.evidence/lighthouse.json`.

## Deployment identity and budgets

| Asset | Local/live SHA-256 | Size |
| --- | --- | ---: |
| `/` | `f20c1ae81083aecf834d61607b447a1c198dca7d77bcd3fe495b11745f8f39b3` | 13,778 B |
| JavaScript | `5d48044a89fc11e5f96470a65469f1862d54b9635b541078c76426dc49515325` | 24,801 B / 9,342 B gzip |
| CSS | `f71b291086b40e9b4ca50b0cf424d5c7643cb3687c6a537db12924b010dd330d` | 18,868 B / 4,585 B gzip |
| Hero | `524ac41046a966517bf027022571204e84b1feda5219c6b93fc532549d1c2b78` | 91,152 B |
| Social card | `7ba9d96e1443549cae9c9ec08e575751f52cbaff935e531d087649bfbd565984` | 53,748 B |
| Service worker | `0b9601e75b2473df5d9256fb33d8743904a40d333bbcdc95c74c8343a4da1b56` | 1,209 B |
| 404 | `c4d9037fd45596f66b599d914999abc30e51c1d968cf379c663366015186ab6f` | 796 B |
| Package archive | `19b5df9381ff43f6be94a87df9449e092b4c29018e55bff2df856a9fa89929c9` | 26,764 B |

The social card is 1200 × 630, touch icon 180 × 180, and hero 91 KB. Static budgets pass. Live headers include CSP with `frame-ancestors 'none'`, COOP, Permissions-Policy, X-Frame-Options, HSTS, nosniff, and same-origin referrer policy.

This is a static npm library site. Backend tenant isolation, persistence, health, billing, and 429/Retry-After do not apply. AI would not improve the deterministic camera-math job.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Original P1: default 390 px duo started at `LIMIT` | Duo resolved; the same defect remains for the normal four-player preset as F1. |
| Original P2: invalid `maxZoomDelta` returned false green | Resolved; NaN, infinities, and negative values throw. |
| Original P3: response security policy missing | Resolved; required headers are live. |
| R1: advertised registry install failed | Resolved; the advertised hosted archive installs. Registry publication is not advertised. |
| R2: demo sandbox absent | Resolved; direct/one-click demo, label, reset, exit, and isolated key work. |
| R3: claims registry absent | Partly resolved; 16 entries exist, but F2 is incomplete and F3 unlisted. |
| R4: routes/legal/404 absent | Routing, legal content, titles, and HTTP status resolved; F4 remains. |
| R5: metadata/skeleton incomplete | Resolved on app routes; F4 remains on 404. |
| R6: phone code scroller inaccessible | Resolved; phone axe has 0 violations and code regions are focusable. |
| R7: first-screen/plain copy incomplete | First screen resolved; demo terminology remains as F5. |
| R8: Canvas reset could not recover | Resolved with supported-browser guidance. |
| R9: development advisories | Resolved; both audits report 0 vulnerabilities. |

No product code was modified during this verification.
