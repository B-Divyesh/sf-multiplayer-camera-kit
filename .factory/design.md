# Visual thesis — the co-op rangefinder

Multiplayer Camera Kit looks like a compact **mid-century instrument panel**, not a game-engine dashboard. The camera policy is invisible during play, so the site makes it legible through the visual language of a 1950s optical rangefinder: warm enamel, engraved labels, a dark viewfinder, brass calibration marks, and a single vermilion safety signal. The metaphor fits the product precisely—bring several moving subjects inside a measured frame, then let the mechanism recede.

The treatment is intentionally single-mode. The warm workshop surface and dark optical glass are part of the instrument metaphor, and explicit colors are painted for every region rather than inheriting system light/dark colors.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| `--paper` | `#F3E9D2` | warm enamel page background |
| `--paper-deep` | `#E3D3B2` | alternate bands and engraved wells |
| `--ink` | `#182521` | primary type; 13.1:1 on paper |
| `--muted` | `#52625C` | secondary type; 5.5:1 on paper |
| `--glass` | `#102825` | viewfinder surface |
| `--glass-line` | `#88B7A9` | reticle and grid marks |
| `--cream` | `#FFF8E8` | type on glass; 13.4:1 |
| `--signal` | `#B83620` | vermilion actions and safety envelope |
| `--signal-dark` | `#792516` | pressed action state |
| `--brass` | `#B78938` | ticks and measured accents |
| `--success` | `#256B4D` | verified / safely framed state |
| `--warning` | `#8A5A12` | approaching limit |
| `--danger` | `#A02C23` | trace regression |

Color never carries state alone: status lamps always have text or an icon, and camera/target outlines use different dash patterns as well as hue.

## Type

- Display: `Arial Narrow`, `Aptos Narrow`, system sans-serif fallback. Condensed uppercase labels evoke engraved instrument faces without shipping a font file.
- Working copy and code: `Courier New`, `Liberation Mono`, monospace fallback. Tabular figures keep coordinates and zoom readings steady.
- Scale: 14 px micro-label, 16 px body, 20 px lead, 28 px section heading, clamp(44–72 px) hero heading. Body line height is 1.6 and prose measures 68 characters.

No third-party font is downloaded. This keeps first paint immediate, the package docs usable offline, and the entire runtime self-contained.

## Spacing and form

An 8 px base grid drives spacing: 8, 16, 24, 32, 48, 64, and 96 px. Controls have 44 px minimum targets. Corners stay tight (2–8 px) like machined hardware; large pill shapes are avoided. Fine borders and inset shadows are reserved for actual instrument groups, never used to turn every paragraph into a card.

Layouts use a 12-column bench at desktop and a single vertical signal path at 390 px. On phones, secondary integration notes stack below the live viewfinder; the core controls and state readout remain above the fold. Safe-area insets protect the top and footer.

## Interaction grammar

- Primary actions look like vermilion mechanical toggles and travel down 1 px when pressed.
- Viewfinder controls resemble labeled switches, with persistent focus rings in brass and cream.
- Live numbers use tabular figures. Every visual camera change is mirrored in a textual status line for screen readers.
- The demo supports pointer, touch, and keyboard: target buttons use standard button semantics, presets are a labeled radio group, and Space toggles motion when focus is outside an input.
- Empty and fault states appear inside the viewfinder with a direct recovery action. Offline status explains that the installed demo and package logic continue to work locally.

## Motion policy

Motion explains camera mechanics only. Targets drift on long, reversible paths; the safety envelope and camera ease with physical continuity; UI feedback is 160–220 ms. The demo has a prominent pause control and pauses when the page is hidden. Under `prefers-reduced-motion: reduce`, target drift is disabled by default, all UI transitions become effectively instant, and status changes use outline/opacity rather than movement. Nothing flashes.

## Asset plan and provenance

1. `site/public/instrument-hero.webp` — an original, text-free editorial still of an imagined four-subject optical framing instrument. It provides material context behind the live programmable viewfinder; it is not decoration detached from the product. Generated once with the factory image deployment, then cropped/optimized locally to WebP at or below 300 KB.
2. All reticles, camera bounds, player markers, ticks, arrows, and icons are hand-drawn at runtime with Canvas/CSS. They are functional diagrams, so deterministic code-native primitives are more appropriate than stock imagery.
3. `site/public/social-card.webp` and `site/public/apple-touch-icon.png` — derived crops of the project-owned `instrument-hero.webp`, composed locally with ImageMagick on 2026-09-06. The social card is 1200×630 and the touch icon is 180×180. They introduce no external artwork or text.

Generation prompt (verbatim):

> Use case: stylized-concept. Asset type: wide editorial hero image for a developer tool landing page. Scene/backdrop: a top-down 1950s optical rangefinder and camera-calibration instrument resting on warm cream enamel, with a dark teal glass viewfinder. Subject: four small colored player tokens held safely inside one brass-and-vermilion rectangular framing reticle, with subtle coordinate ticks and mechanical dials. Style/medium: tactile mid-century industrial product illustration, screen-printed gouache texture, crisp geometric forms, restrained and sophisticated. Composition/framing: landscape 3:2, instrument concentrated centrally with calm negative space around the edges, no text. Lighting/mood: soft workshop light, precise and trustworthy. Color palette: warm cream #F3E9D2, deep green-black #102825, oxidized teal #88B7A9, brass #B78938, vermilion #B83620. Constraints: original artwork, no logos, no words, no letters, no numbers, no watermark, no gradients, no generic laptop or dashboard UI.

Generator: `/opt/fleet/lib/gen-image.sh`, factory image deployment, 1536×1024, high quality. The generated artwork is project-owned output and is used only in this product.
