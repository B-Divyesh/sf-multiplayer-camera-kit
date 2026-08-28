# Multiplayer Camera Kit

Safe, inspectable multi-target framing for small browser games. Pass player rectangles and world bounds; receive a stable camera pose, a debug overlay, and deterministic replay assertions. It is engine-agnostic, has no runtime dependencies, and sends no telemetry.

Live documentation and playground: https://multiplayer-camera-kit.sociobot.in

## Install

```sh
npm install multiplayer-camera-kit
```

## Usage

Coordinates are world-space pixels with +x right and +y down. The viewport is CSS or render pixels. `zoom` is viewport pixels per world pixel: `1` means 1:1, and values below `1` show more of the world.

```ts
import { createCamera } from 'multiplayer-camera-kit'

const camera = createCamera({
  viewport: { width: 1280, height: 720 },
  world: { x: 0, y: 0, width: 4096, height: 2048 },
  padding: 96,
  minZoom: 0.5,
  maxZoom: 1.5,
  damping: 8,
})

function tick(dtSeconds: number) {
  const pose = camera.update(players.map(player => ({
    id: player.id,
    x: player.x,
    y: player.y,
    width: player.width,
    height: player.height,
  })), dtSeconds)

  world.position.set(-pose.x * pose.zoom, -pose.y * pose.zoom)
  world.scale.set(pose.zoom)
}
```

That is the complete integration path. `pose.x` and `pose.y` are the visible world's top-left corner. An empty target list holds the last valid pose. Invalid input throws a descriptive `CameraInputError` before it can poison a render transform.

### Debug overlay

Draw the current visible world, target bounds, and padded safety envelope on any Canvas 2D context:

```ts
import { drawDebugOverlay } from 'multiplayer-camera-kit'

drawDebugOverlay(context, camera.inspect(), {
  worldToScreen: ({ x, y }) => ({
    x: (x - camera.pose.x) * camera.pose.zoom,
    y: (y - camera.pose.y) * camera.pose.zoom,
  }),
})
```

### Deterministic traces

Trace samples are timestamped in milliseconds. The runner linearly interpolates target rectangles and advances the policy at a fixed step, so changing display frame rate does not change the result.
`maxZoomDelta`, when supplied, must be a finite number greater than or equal to zero; invalid configured values throw `CameraInputError` rather than producing a false-green report.

```ts
import { runTrace } from 'multiplayer-camera-kit'

const report = runTrace({
  config: {
    viewport: { width: 1280, height: 720 },
    world: { x: 0, y: 0, width: 4096, height: 2048 },
    padding: 96,
  },
  samples: replay,
  assertions: { targetsVisible: true, maxZoomDelta: 0.08 },
})

if (!report.ok) throw new Error(report.failures[0].message)
```

## Public API

- `createCamera(config)` → stateful camera controller with `update`, `snap`, `resize`, `reset`, `pose`, and `inspect`.
- `frameTargets(targets, config)` → pure, instantaneous framing pose.
- `drawDebugOverlay(context, snapshot, options?)` → Canvas 2D safety overlay.
- `runTrace(trace, options?)` → deterministic fixed-step replay and assertion report.
- TypeScript types are included. ESM and CommonJS builds ship from the same package.

## Assumptions and limits

- Axis-aligned rectangles only; rotation belongs to the renderer.
- The camera preserves viewport aspect ratio and clamps its visible region to world bounds.
- If targets span more space than `minZoom` can show, the pose is clamped and `inspect().allTargetsVisible` becomes `false`. This is deliberate: accessibility-safe zoom limits win over impossible framing.
- A world smaller than the viewport is centered. A target outside world bounds is still considered for visibility, but the camera never leaves the configured world.
- Networking, rendering, split-screen choice, and physics are intentionally out of scope.

## Develop, test, and deploy

Requires Node 20 or newer.

```sh
npm ci
npm test
npm run build          # library + site -> dist/
npm run build:site     # static site only -> dist/site/
npm run test:e2e       # built-site browser and axe smoke tests
npm pack               # publish-ready tarball; do not publish from this repo
```

Serve `dist/site` as the static deployment root. The package is free under the MIT license. See [`.factory/design.md`](.factory/design.md) for the visual system and [`.factory/handoff.md`](.factory/handoff.md) for verification notes.
