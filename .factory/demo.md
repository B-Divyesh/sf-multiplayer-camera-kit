# Demo sandbox

Open `https://multiplayer-camera-kit.sociobot.in/demo` or choose **Try it with sample data** on the landing page.

The demo starts with a realistic two-player co-op formation. It shows the camera position, zoom, padded safety area, a four-player formation, a deliberate limit breach, and passing and failing trace checks.

The persistent banner says **Demo — sample data, nothing is saved to your game**. **Reset demo** restores the two-player formation. **Start for real** leaves the sandbox and discards the demo browser key.

The demo uses only `localStorage` key `demo:multiplayer-camera-kit:state`. No production game-data store exists or is read. The service worker caches the demo shell after the first online visit so the `/demo` route can reload offline.
