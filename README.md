# Multiplayer Camera Kit

Multiplayer Camera Kit keeps co-op players in one camera frame. It is for developers of small browser 2D games who need camera position and zoom from player rectangles and world bounds.

The package returns a camera pose, draws a Canvas 2D safety envelope, and replays target traces at a fixed step. It does not provide networking, rendering, split-screen selection, or physics.

Try the isolated sample playground: https://multiplayer-camera-kit.sociobot.in/demo

## Install

Install the public package download with npm:

```sh
npm install https://multiplayer-camera-kit.sociobot.in/downloads/multiplayer-camera-kit-0.1.0.tgz
```

The download contains ESM, CommonJS, and TypeScript declarations. It has no runtime dependencies and is free under the MIT license.

## Use the camera pose

Coordinates are world pixels. Positive x goes right, positive y goes down. The viewport uses CSS or render pixels. `zoom` means viewport pixels per world pixel: `1` is one-to-one and a smaller value shows more world.

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

The controller produces the same damped pose for equivalent frame slicing. An empty target list holds the last pose. The visible rectangle never leaves the world bounds. Invalid rectangles and time values throw `CameraInputError` before they reach a render transform.

## Draw the safety envelope

```ts
import { drawDebugOverlay } from 'multiplayer-camera-kit'

drawDebugOverlay(context, camera.inspect(), {
  worldToScreen: ({ x, y }) => ({
    x: (x - camera.pose.x) * camera.pose.zoom,
    y: (y - camera.pose.y) * camera.pose.zoom,
  }),
})
```

The overlay draws the visible camera area, padded safe area, player rectangles, and player labels.

## Run a trace

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

The runner replays the same trace deterministically at a fixed step. It reports an off-screen player with a timestamp. `maxZoomDelta` must be finite and zero or greater; invalid values throw `CameraInputError`.

## Demo and privacy

`/demo` opens a populated two-player sample. Its banner reads “Demo — sample data, nothing is saved to your game.” Reset restores the sample. Start for real clears the demo state. The demo uses only a separate `demo:` browser key and does not send player data, telemetry, or analytics.

After the first online visit, the demo opens offline. This uses a service-worker cache for the site files; it does not store game data.

Read [Privacy](https://multiplayer-camera-kit.sociobot.in/privacy) and [Terms](https://multiplayer-camera-kit.sociobot.in/terms).

## Develop, test, and deploy

Requires Node 20 or newer.

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run test:e2e
npm run test:consumer
npm pack --json
```

`npm run build` writes the library to `dist/package`, prepares the public package download, and writes the static site to `dist/site`. Deploy `dist/site` to the product static host. The factory owns registry publishing credentials, so do not run `npm publish` from this repository.

Every visitor-facing claim is listed in [`.factory/claims.json`](.factory/claims.json). The demo mechanics are documented in [`.factory/demo.md`](.factory/demo.md). See [`.factory/design.md`](.factory/design.md) for the visual system and [`.factory/handoff.md`](.factory/handoff.md) for release evidence.
