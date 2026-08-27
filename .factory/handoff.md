# Multiplayer Camera Kit v0.1.0 — handoff

## What shipped

- A dependency-free TypeScript camera library with ESM, CommonJS, source maps, and declarations under `dist/package`.
- `createCamera`: stateful multi-target framing with screen-space padding, world clamps, explicit zoom rails, first-acquisition snap, frame-rate-independent damping, viewport resize, reset, and immutable inspection snapshots.
- `frameTargets`: the pure instantaneous framing primitive.
- `drawDebugOverlay`: Canvas 2D camera, safety-envelope, target bounds, and labels with a structural context type that is friendly to browser and test doubles.
- `runTrace`: timestamped target interpolation, fixed-step simulation, visibility checks, zoom-delta checks, and failures that include timestamp and target identity.
- A static documentation site under `dist/site` with a working two/four-player playground, limit-breach preset, keyboard nudging, pause control, empty/error/loading/offline states, integration example, and safe/broken replay runner.
- A product-specific mid-century rangefinder visual system. The original 1536×1024 factory-generated hero was optimized from a 2.3 MB PNG to a 91,152-byte WebP. Prompt and generator provenance are in `.factory/design.md` and `.factory/instrument-hero.provenance.json`.
- Offline shell caching, immutable asset cache metadata, robots/sitemap/canonical metadata, MIT license, changelog, and API-first README.

No analytics, telemetry, accounts, storage, payment, third-party runtime scripts, or third-party fonts are present. Privacy and terms routes are therefore not applicable under the product contract.

## Run and verify

```sh
npm ci
npm test
npm run typecheck
npm run build
npm pack
```

`npm test` completed successfully on 2026-08-27 and includes:

- 16 Vitest unit/integration tests across camera math, damping invariance, zoom limits, debug drawing, deterministic replay, and the deliberate off-screen regression.
- A production build of both package and site.
- Playwright checks for desktop interaction, 390×844 mobile layout, keyboard paths, reduced motion, empty-state recovery, safety-limit state, safe/broken traces, offline reload, console errors, touch target size, and axe WCAG 2 A/AA serious/critical findings.

Browser result: desktop passed; mobile 390 passed; offline reload passed; 0 console errors on online load; 0 serious/critical axe violations.

The factory `verify-url.sh` against the local production server returned HTTP 200, a 524 ms load, one `<h1>`, `lang="en"`, a `<main>`, zero missing image alts, zero unlabeled buttons, and zero console errors.

Mobile Lighthouse 12.8.2 against the local production build:

| Category / metric | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| LCP | 1.51 s |
| FCP | 0.91 s |
| TBT | 18 ms |
| CLS | 0 |

Production site payloads: 16.34 KB JavaScript (6.42 KB gzip), 15.50 KB CSS (3.99 KB gzip), and 91.15 KB hero WebP. No font payload is shipped.

`npm pack` produced `multiplayer-camera-kit-0.1.0.tgz` at approximately 26 KB (96 KB unpacked). Both `import` and `require` were smoke-tested from a fresh temporary install. The factory owns registry credentials; this worker did not publish.

## Deploy and publish

- Static deployment root: `dist/site` (its `index.html` is at that exact root).
- Exact site-only build: `npm run build:site`.
- Full reproducible build: `npm run build`.
- Registry release command for the factory: `npm publish` after its normal provenance/authentication checks.

## Known gaps / intentional limits

- Rotation, networking, rendering, physics, and split-screen decisions remain out of scope. Targets are axis-aligned world-space rectangles.
- Trace interpolation requires stable target IDs. Players added or removed between samples change membership at a keyframe rather than fading between states.
- The Phaser/Pixi integration is intentionally the shared transform primitive, not engine adapter packages; the complete example remains under 30 lines.
- Lighthouse figures are repeatable localhost lab measurements; production network and hosting headers can change field performance.
- Deployment and npm publication were not performed, per factory rules.
