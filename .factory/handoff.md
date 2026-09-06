# Multiplayer Camera Kit — repair handoff

## Release identity

- **Implementation SHA:** `e30ec635bac1d871f622fa6b98b4cbe8df59eebe`
- **Documentation and verification SHA:** `f9ac51f02204fa1b51948fff521c0b9565b30288`
- **Live URL:** https://multiplayer-camera-kit.sociobot.in/
- **Artifact:** TypeScript npm library with a static documentation and demo site
- **Deployment:** production static host, one static replica; no product state or database

The implementation and evidence SHAs differ because the evidence was committed after the deployed product code. The live files for the implementation match the local build; later documentation commits do not change the deployed artifact.

## What changed

- Replaced the false registry install path with a public, versioned package download. The site and README now use a direct `npm install https://multiplayer-camera-kit.sociobot.in/downloads/multiplayer-camera-kit-0.1.0.tgz` command.
- Added `/demo` as an isolated one-click library playground. It loads a populated two-player sample, shows a persistent sample banner, writes only a `demo:` browser key, supports Reset demo, and discards the key on Start for real.
- Added `/privacy`, `/terms`, a designed static 404 page, route titles, focus and live announcements, a complete footer, sitemap routes, social metadata, favicon, touch icon, and social card.
- Reworked the landing first screen in plain language. It names the job, audience, first action, privacy, offline behaviour, and MIT price.
- Fixed the mobile code-region accessibility defect by making code blocks keyboard focusable. The Canvas error now links to usable browser support instead of promising a reset can restore missing Canvas support.
- Made the demo import the compiled package artifact rather than `src`, and added a served-tarball fresh-consumer check for ESM, CommonJS, declarations, no runtime dependencies, license, and renderer output.
- Added 16 declared claims and outcome-based tagged checks. Updated Vite and Vitest so both production and development dependency audits report zero vulnerabilities.
- Replaced the static-host catch-all fallback with explicit known-route rewrites so unknown URLs return the designed HTTP 404 response.

## Run and verify

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run test:e2e
npm run test:consumer
npm pack --json
```

All commands above passed. Every command in `.factory/claims.json` was also run individually from the documented setup.

Live HTTPS verification passed with fresh desktop and 390 px phone browser contexts. This covered the first screen, demo sample, reset, Start for real storage cleanup, keyboard controls, reduced motion, 0 serious/critical mobile axe findings, privacy request capture, offline `/demo` reload, route titles, and HTTP 404. The live package URL installed and ran in a fresh temporary consumer.

The local and live root HTML, JavaScript, CSS, hero image, social card, service worker, and 404 file matched byte-for-byte. `/not-a-real-page` returns HTTP 404. CSP, X-Frame-Options, Permissions-Policy, COOP, HSTS, nosniff, and referrer policy are live.

## Known gaps and next steps

- The unscoped npm registry name is still not published. The public direct package download is the working install path. Registry publication requires the factory-owned registry credential; do not run `npm publish` from this repository.
- Lighthouse 13.4.1 was attempted against live HTTPS, but its runner could not connect to Chrome in this worker. No Lighthouse score is claimed. Playwright performance-sized output, console, accessibility, offline, and browser checks pass.
- The standalone axe CLI could not locate Chrome in this worker. Equivalent Playwright axe scans completed with zero serious/critical findings.
- There is no backend, paid tier, billing offer, or AI integration. Those checks do not apply to this free static library.

See `.factory/verification-3.md` for the detailed evidence and `.factory/demo.md` for the sandbox contract.
