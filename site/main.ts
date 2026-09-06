import { createCamera, drawDebugOverlay, runTrace } from '../dist/package/index.js'
import type { CameraController, CameraTrace, Rect } from '../dist/package/index.js'
import './style.css'

const colors = {
  glass: '#102825',
  glassMid: '#183b36',
  line: '#88b7a9',
  cream: '#fff8e8',
  signal: '#e24e2c',
  brass: '#d8a84e',
}

const origin = 'https://multiplayer-camera-kit.sociobot.in'
const main = document.querySelector<HTMLElement>('#main')!
const demoTemplate = main.innerHTML
const demoBanner = document.querySelector<HTMLElement>('#demo-banner')!
const demoStorageKey = 'demo:multiplayer-camera-kit:state'
let stopDemo: (() => void) | undefined

const homeTemplate = `
  <section class="hero home-hero" aria-labelledby="hero-title">
    <div class="hero-copy">
      <p class="eyebrow"><span class="status-lamp" aria-hidden="true"></span> Camera framing library</p>
      <h1 id="hero-title" tabindex="-1">Keep co-op players in one camera frame</h1>
      <p class="hero-lead">For browser game developers who need safe framing without rebuilding camera math.</p>
      <div class="hero-actions">
        <a class="button button-primary" data-route href="/demo">Try it with sample data</a>
        <p class="action-note">Opens a populated two-player camera playground.</p>
      </div>
      <ul class="hero-facts" aria-label="Product facts">
        <li>Free under the MIT license.</li>
        <li>No accounts, telemetry, or player data.</li>
        <li>Demo works offline after the first visit.</li>
      </ul>
    </div>
    <figure class="hero-figure">
      <img src="/instrument-hero.webp" width="1536" height="1024" fetchpriority="high" alt="An illustrated camera instrument holding four game pieces inside a red framing reticle." />
      <figcaption><span>Camera framing sample</span><span>4 players / 1 frame</span></figcaption>
    </figure>
  </section>

  <section class="home-preview" aria-labelledby="preview-title">
    <div>
      <p class="eyebrow">Sample result</p>
      <h2 id="preview-title">Inspect the camera pose before you add it to a game</h2>
      <p>Open the sample to move two players, view the padded safety area, and run a passing or failing trace.</p>
    </div>
    <dl class="preview-readout" aria-label="Example camera output">
      <div><dt>Players</dt><dd>2</dd></div>
      <div><dt>Safety</dt><dd>YES</dd></div>
      <div><dt>Output</dt><dd>x, y, zoom</dd></div>
    </dl>
  </section>

  <section class="how-it-works" aria-labelledby="how-title">
    <p class="eyebrow">How it works</p>
    <h2 id="how-title">Add one camera policy in three steps</h2>
    <ol>
      <li><span>1</span><div><h3>Pass player rectangles</h3><p>Give the package each player rectangle, the viewport, and the world bounds.</p></div></li>
      <li><span>2</span><div><h3>Apply the pose</h3><p>Use the returned x, y, and zoom in Canvas, Pixi, Phaser, or WebGL.</p></div></li>
      <li><span>3</span><div><h3>Run a trace</h3><p>Replay recorded positions at a fixed step before a player leaves the safe area.</p></div></li>
    </ol>
  </section>

  <section class="integration home-integration" id="integration" aria-labelledby="integration-title">
    <div class="section-intro">
      <p class="eyebrow">Install and use</p>
      <h2 id="integration-title">Download the tested package</h2>
      <p>Install the public package download with npm.</p>
      <p><a href="/downloads/multiplayer-camera-kit-0.1.0.tgz" download>Download multiplayer-camera-kit-0.1.0.tgz</a></p>
    </div>
    <div class="code-instrument">
      <div class="code-header"><span>terminal</span><span>npm</span></div>
      <pre tabindex="0" aria-label="Package install command. Use left and right arrow keys to scroll the command."><code>npm install https://multiplayer-camera-kit.sociobot.in/downloads/multiplayer-camera-kit-0.1.0.tgz</code></pre>
      <div class="code-footer"><span class="status-lamp" aria-hidden="true"></span><span>ESM, CommonJS, and TypeScript declarations</span></div>
    </div>
  </section>

  <section class="privacy-summary" aria-labelledby="privacy-title">
    <div>
      <p class="eyebrow">Privacy and limits</p>
      <h2 id="privacy-title">Camera math stays in the browser</h2>
      <p>The site sends no player data or analytics. The demo keeps its sample state in a separate <code>demo:</code> browser key and never reads game data.</p>
    </div>
    <div>
      <h3>What it does not do</h3>
      <p>It does not provide networking, rendering, split-screen selection, or physics.</p>
      <p><a data-route href="/privacy">Read the privacy details</a></p>
    </div>
  </section>
`

const informationalTemplates: Record<string, { title: string; description: string; html: string }> = {
  '/privacy': {
    title: 'Privacy — Multiplayer Camera Kit',
    description: 'Privacy details for the Multiplayer Camera Kit browser demo and package.',
    html: `
      <article class="legal-page">
        <p class="eyebrow">Privacy</p>
        <h1 tabindex="-1">Privacy for the camera demo</h1>
        <p>Multiplayer Camera Kit does not collect accounts, player rectangles, usage analytics, or telemetry.</p>
        <h2>Browser storage</h2>
        <p>The sample demo uses the browser key <code>demo:multiplayer-camera-kit:state</code>. It marks the isolated sample session. Leaving or resetting the demo removes that key. The site does not read or write game data.</p>
        <h2>Network requests</h2>
        <p>The demo loads its own site files and package download. It does not call a third-party service.</p>
        <p><a data-route href="/demo">Try the sample demo</a> or <a data-route href="/">return to the product page</a>.</p>
      </article>`,
  },
  '/terms': {
    title: 'Terms — Multiplayer Camera Kit',
    description: 'Terms for the Multiplayer Camera Kit package and documentation site.',
    html: `
      <article class="legal-page">
        <p class="eyebrow">Terms</p>
        <h1 tabindex="-1">Terms for Multiplayer Camera Kit</h1>
        <p>The package is provided under the MIT license. You may use, copy, modify, and distribute it under that license.</p>
        <h2>Use of the demo</h2>
        <p>The demo is sample data only. Check your own game camera behaviour before shipping.</p>
        <h2>No service account</h2>
        <p>This site has no paid plan and does not provide a hosted game service.</p>
        <p><a href="https://github.com/B-Divyesh/sf-multiplayer-camera-kit/blob/main/LICENSE" target="_blank" rel="noreferrer">Read the MIT license on GitHub (opens new tab)</a>.</p>
      </article>`,
  },
}

function discardDemoState(): void {
  try {
    localStorage.removeItem(demoStorageKey)
  } catch {
    // Storage is optional. The sample still works entirely in memory.
  }
}

function setMetadata(title: string, description: string): void {
  document.title = title
  document.querySelector<HTMLMetaElement>('meta[name="description"]')!.content = description
  const path = location.pathname === '/' ? '/' : location.pathname
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href = `${origin}${path}`
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')!.content = title
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')!.content = description
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')!.content = `${origin}${path}`
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')!.content = title
  document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')!.content = description
}

function announceRoute(shouldFocus: boolean): void {
  const heading = main.querySelector<HTMLElement>('h1')
  if (!heading) return
  let announcer = document.querySelector<HTMLElement>('#route-announcement')
  if (!announcer) {
    announcer = document.createElement('p')
    announcer.id = 'route-announcement'
    announcer.className = 'sr-only'
    announcer.setAttribute('aria-live', 'polite')
    document.body.append(announcer)
  }
  announcer.textContent = heading.textContent ?? ''
  if (shouldFocus) heading.focus()
}

function renderRoute(shouldFocus = false): void {
  stopDemo?.()
  stopDemo = undefined
  delete document.body.dataset.cameraReady
  const path = location.pathname.replace(/\/$/, '') || '/'
  demoBanner.hidden = path !== '/demo'
  if (path === '/demo') {
    main.innerHTML = demoTemplate
    setMetadata('Demo — Multiplayer Camera Kit', 'Try a two-player sample camera playground without changing game data.')
    stopDemo = startDemo()
  } else if (path === '/') {
    discardDemoState()
    main.innerHTML = homeTemplate
    setMetadata('Multiplayer Camera Kit — Keep players in frame', 'Camera framing for browser co-op game developers: player rectangles in, safe camera pose out.')
  } else {
    discardDemoState()
    const page = informationalTemplates[path] ?? informationalTemplates['/terms']!
    main.innerHTML = page.html
    setMetadata(page.title, page.description)
  }
  requestAnimationFrame(() => {
    if (location.hash) document.querySelector(location.hash)?.scrollIntoView()
    announceRoute(shouldFocus)
  })
}

document.addEventListener('click', event => {
  const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-route]')
  if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const destination = new URL(link.href, location.href)
  if (destination.origin !== location.origin) return
  event.preventDefault()
  history.pushState({}, '', `${destination.pathname}${destination.search}${destination.hash}`)
  renderRoute(true)
})

window.addEventListener('popstate', () => renderRoute(true))
renderRoute(false)

function startDemo(): () => void {
const canvas = document.querySelector<HTMLCanvasElement>('#camera-canvas')!
const context = canvas.getContext('2d')
const motionButton = document.querySelector<HTMLButtonElement>('#motion-toggle')!
const clearButton = document.querySelector<HTMLButtonElement>('#clear-targets')!
const restoreButton = document.querySelector<HTMLButtonElement>('#restore-targets')!
const resetBannerButton = document.querySelector<HTMLButtonElement>('#reset-demo-banner')!
const emptyState = document.querySelector<HTMLElement>('#empty-state')!
const errorState = document.querySelector<HTMLElement>('#error-state')!
const errorMessage = document.querySelector<HTMLElement>('#error-message')!
const selectedPlayer = document.querySelector<HTMLSelectElement>('#selected-player')!
const demoStatus = document.querySelector<HTMLElement>('#demo-status')!
const readoutX = document.querySelector<HTMLOutputElement>('#readout-x')!
const readoutY = document.querySelector<HTMLOutputElement>('#readout-y')!
const readoutZoom = document.querySelector<HTMLOutputElement>('#readout-zoom')!
const readoutSafe = document.querySelector<HTMLOutputElement>('#readout-safe')!
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

type PresetName = 'duo' | 'quad' | 'breach'

const world = { x: 0, y: 0, width: 1600, height: 900 }
let preset: PresetName = 'duo'
let paused = reducedMotion.matches
let cleared = false
let camera: CameraController
let previousTime = performance.now()
let elapsed = 0
let animationFrame = 0
const offsets = new Map<string, { x: number; y: number }>()

function markDemoState(): void {
  try {
    localStorage.setItem(demoStorageKey, 'sample')
  } catch {
    // Storage is optional. The sample is still isolated in memory.
  }
}

function createDemoCamera(): CameraController {
  const rect = canvas.getBoundingClientRect()
  return createCamera({
    viewport: { width: Math.max(320, rect.width), height: Math.max(180, rect.height) },
    world,
    padding: { top: 54, right: 68, bottom: 54, left: 68 },
    minZoom: preset === 'breach' ? 0.75 : 0.38,
    maxZoom: 1.25,
    damping: 6,
  })
}

function formations(name: PresetName, time: number): Rect[] {
  const movement = paused ? 0 : time
  const applyOffset = (target: Required<Rect>): Required<Rect> => {
    const offset = offsets.get(target.id) ?? { x: 0, y: 0 }
    return { ...target, x: target.x + offset.x, y: target.y + offset.y }
  }
  if (name === 'quad') {
    return [
      { id: 'p1', x: 410 + Math.sin(movement * 0.0007) * 85, y: 255, width: 42, height: 58 },
      { id: 'p2', x: 1080, y: 245 + Math.cos(movement * 0.00062) * 78, width: 42, height: 58 },
      { id: 'p3', x: 520, y: 610 + Math.sin(movement * 0.00055) * 64, width: 42, height: 58 },
      { id: 'p4', x: 990 + Math.cos(movement * 0.0008) * 72, y: 590, width: 42, height: 58 },
    ].map(applyOffset)
  }
  if (name === 'breach') {
    return [
      { id: 'p1', x: 52, y: 390, width: 42, height: 58 },
      { id: 'p2', x: 1506, y: 390, width: 42, height: 58 },
    ].map(applyOffset)
  }
  // The phone viewfinder retains the same 68px horizontal safety margin and
  // 0.38 zoom floor as desktop. Keep its ordinary demonstration formation
  // inside that envelope; "Limit breach" remains the explicit limit example.
  const compactDuo = canvas.getBoundingClientRect().width < 600
  const duo = compactDuo
    ? [
        { id: 'p1', x: 640 + Math.sin(movement * 0.00072) * 75, y: 400 + Math.cos(movement * 0.00051) * 50, width: 42, height: 58 },
        { id: 'p2', x: 875 + Math.cos(movement * 0.00066) * 75, y: 420 + Math.sin(movement * 0.00048) * 60, width: 42, height: 58 },
      ]
    : [
        { id: 'p1', x: 520 + Math.sin(movement * 0.00072) * 170, y: 400 + Math.cos(movement * 0.00051) * 80, width: 42, height: 58 },
        { id: 'p2', x: 960 + Math.cos(movement * 0.00066) * 170, y: 420 + Math.sin(movement * 0.00048) * 95, width: 42, height: 58 },
      ]
  return duo.map(applyOffset)
}

function syncPlayerSelect(targets: readonly Rect[]): void {
  const oldValue = selectedPlayer.value
  const signature = targets.map(target => target.id).join(',')
  if (selectedPlayer.dataset.signature === signature) return
  selectedPlayer.replaceChildren(
    ...targets.map((target, index) => {
      const option = document.createElement('option')
      option.value = target.id ?? `p${index + 1}`
      option.textContent = `Player ${index + 1}`
      return option
    }),
  )
  selectedPlayer.dataset.signature = signature
  if ([...selectedPlayer.options].some(option => option.value === oldValue)) selectedPlayer.value = oldValue
}

function resizeCanvas(): void {
  if (!context) return
  const bounds = canvas.getBoundingClientRect()
  const scale = Math.min(window.devicePixelRatio || 1, 2)
  const width = Math.max(1, Math.round(bounds.width * scale))
  const height = Math.max(1, Math.round(bounds.height * scale))
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
    context.setTransform(scale, 0, 0, scale, 0, 0)
    camera?.resize({ width: bounds.width, height: bounds.height })
  }
}

function drawGrid(pose: ReturnType<CameraController['update']>): void {
  if (!context) return
  const width = canvas.getBoundingClientRect().width
  const height = canvas.getBoundingClientRect().height
  context.fillStyle = colors.glass
  context.fillRect(0, 0, width, height)
  context.lineWidth = 1
  context.strokeStyle = 'rgba(136,183,169,.13)'
  context.beginPath()
  const step = 100
  for (let x = Math.ceil(pose.x / step) * step; x <= pose.x + pose.visibleWidth; x += step) {
    const screenX = (x - pose.x) * pose.zoom
    context.moveTo(screenX, 0)
    context.lineTo(screenX, height)
  }
  for (let y = Math.ceil(pose.y / step) * step; y <= pose.y + pose.visibleHeight; y += step) {
    const screenY = (y - pose.y) * pose.zoom
    context.moveTo(0, screenY)
    context.lineTo(width, screenY)
  }
  context.stroke()
  context.strokeStyle = 'rgba(216,168,78,.5)'
  context.strokeRect((world.x - pose.x) * pose.zoom, (world.y - pose.y) * pose.zoom, world.width * pose.zoom, world.height * pose.zoom)
}

function drawPlayers(targets: readonly Rect[], pose: ReturnType<CameraController['update']>): void {
  if (!context) return
  targets.forEach((target, index) => {
    const x = (target.x - pose.x) * pose.zoom
    const y = (target.y - pose.y) * pose.zoom
    const width = Math.max(14, target.width * pose.zoom)
    const height = Math.max(20, target.height * pose.zoom)
    const selected = target.id === selectedPlayer.value
    context.save()
    context.translate(x + width / 2, y + height / 2)
    context.fillStyle = index % 2 === 0 ? colors.brass : colors.line
    context.strokeStyle = selected ? colors.cream : colors.glass
    context.lineWidth = selected ? 3 : 2
    context.beginPath()
    context.arc(0, -height * 0.28, width * 0.25, 0, Math.PI * 2)
    context.fill()
    context.stroke()
    context.beginPath()
    context.moveTo(-width * 0.34, height * 0.42)
    context.lineTo(-width * 0.22, -height * 0.08)
    context.quadraticCurveTo(0, -height * 0.25, width * 0.22, -height * 0.08)
    context.lineTo(width * 0.34, height * 0.42)
    context.closePath()
    context.fill()
    context.stroke()
    context.restore()
  })
}

function render(time: number): void {
  animationFrame = requestAnimationFrame(render)
  try {
    if (!context) throw new Error('Canvas 2D is not available in this browser.')
    resizeCanvas()
    const delta = Math.max(0, Math.min((time - previousTime) / 1000, 0.05))
    previousTime = time
    if (!paused) elapsed += delta * 1000
    const targets = cleared ? [] : formations(preset, elapsed)
    syncPlayerSelect(targets)
    const pose = camera.update(targets, delta)
    const snapshot = camera.inspect()
    drawGrid(pose)
    drawPlayers(targets, pose)
    drawDebugOverlay(context, snapshot, {
      worldToScreen: point => ({ x: (point.x - pose.x) * pose.zoom, y: (point.y - pose.y) * pose.zoom }),
      cameraColor: colors.line,
      safetyColor: colors.signal,
      targetColor: colors.brass,
      labelColor: colors.cream,
    })
    emptyState.hidden = targets.length > 0
    errorState.hidden = true
    readoutX.value = pose.centerX.toFixed(1).padStart(6, '0')
    readoutY.value = pose.centerY.toFixed(1).padStart(6, '0')
    readoutZoom.value = `${pose.zoom.toFixed(3)}×`
    readoutSafe.value = snapshot.allTargetsVisible ? 'YES' : 'LIMIT'
    readoutSafe.dataset.safe = String(snapshot.allTargetsVisible)
    canvas.dataset.allTargetsVisible = String(snapshot.allTargetsVisible)
    const count = targets.length
    const summary = count === 0
      ? 'No players detected. Holding the last camera pose.'
      : snapshot.allTargetsVisible
        ? `${count} player${count === 1 ? '' : 's'} safely framed at ${pose.zoom.toFixed(2)} times zoom.`
        : `Safety limit reached. ${count} players cannot fit above the configured minimum zoom.`
    if (demoStatus.textContent !== summary) demoStatus.textContent = summary
    canvas.setAttribute('aria-label', summary)
    document.body.dataset.cameraReady = 'true'
  } catch (error) {
    cancelAnimationFrame(animationFrame)
    const message = error instanceof Error ? error.message : 'Unknown camera error.'
    errorMessage.textContent = `${message} Use a browser with Canvas 2D support, then reload this page.`
    errorState.hidden = false
    demoStatus.textContent = `Camera error: ${message}`
  }
}

function setPaused(nextPaused: boolean): void {
  paused = nextPaused
  motionButton.setAttribute('aria-pressed', String(paused))
  motionButton.querySelector('.button-icon')!.textContent = paused ? '▶' : 'Ⅱ'
  motionButton.querySelector('span:last-child')!.textContent = paused ? 'Resume motion' : 'Pause motion'
  demoStatus.textContent = paused ? 'Motion paused. Camera controls remain active.' : 'Motion resumed.'
}

function resetDemo(nextPreset: PresetName = 'duo'): void {
  preset = nextPreset
  cleared = false
  offsets.clear()
  elapsed = 0
  camera = createDemoCamera()
  document.querySelector<HTMLInputElement>(`input[name="preset"][value="${preset}"]`)!.checked = true
  errorState.hidden = true
  markDemoState()
}

function nudge(direction: string): void {
  const id = selectedPlayer.value
  if (!id) return
  const offset = offsets.get(id) ?? { x: 0, y: 0 }
  const amount = 36
  if (direction === 'left') offset.x -= amount
  if (direction === 'right') offset.x += amount
  if (direction === 'up') offset.y -= amount
  if (direction === 'down') offset.y += amount
  offsets.set(id, offset)
  markDemoState()
  demoStatus.textContent = `${selectedPlayer.selectedOptions[0]?.textContent ?? 'Player'} nudged ${direction}.`
}

document.querySelectorAll<HTMLInputElement>('input[name="preset"]').forEach(input => {
  input.addEventListener('change', () => resetDemo(input.value as PresetName))
})

document.querySelectorAll<HTMLButtonElement>('[data-nudge]').forEach(button => {
  button.addEventListener('click', () => nudge(button.dataset.nudge!))
})

canvas.addEventListener('keydown', event => {
  const directions: Record<string, string> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }
  if (directions[event.key]) {
    event.preventDefault()
    nudge(directions[event.key]!)
  } else if (event.code === 'Space') {
    event.preventDefault()
    setPaused(!paused)
  }
})

motionButton.addEventListener('click', () => setPaused(!paused))
clearButton.addEventListener('click', () => {
  cleared = true
  selectedPlayer.replaceChildren()
  emptyState.hidden = false
  demoStatus.textContent = 'No players detected. Holding the last camera pose.'
})
restoreButton.addEventListener('click', () => {
  cleared = false
  resetDemo('duo')
  canvas.focus()
})
resetBannerButton.addEventListener('click', () => {
  resetDemo('duo')
  canvas.focus()
})

document.querySelector<HTMLButtonElement>('[data-copy]')!.addEventListener('click', async event => {
  const button = event.currentTarget as HTMLButtonElement
  const status = document.querySelector<HTMLElement>('#copy-status')!
  try {
    await navigator.clipboard.writeText(button.dataset.copy!)
    button.querySelector('.copy-label')!.textContent = 'Copied'
    status.textContent = 'Install command copied to clipboard.'
  } catch {
    status.textContent = 'Clipboard access is unavailable. Select the visible install command to copy it.'
  }
  window.setTimeout(() => { button.querySelector('.copy-label')!.textContent = 'Copy' }, 1800)
})

const baseTrace: CameraTrace = {
  config: {
    viewport: { width: 1280, height: 720 },
    world: { x: 0, y: 0, width: 4096, height: 2048 },
    padding: 96,
    minZoom: 0.4,
    maxZoom: 1.5,
    damping: 10,
  },
  samples: [
    { at: 0, targets: [{ id: 'p1', x: 1100, y: 800, width: 48, height: 64 }, { id: 'p2', x: 1600, y: 800, width: 48, height: 64 }] },
    { at: 1000, targets: [{ id: 'p1', x: 1200, y: 820, width: 48, height: 64 }, { id: 'p2', x: 1700, y: 820, width: 48, height: 64 }] },
  ],
  assertions: { targetsVisible: true, maxZoomDelta: 0.08 },
}

function displayTrace(broken: boolean): void {
  const trace: CameraTrace = broken
    ? {
        ...baseTrace,
        config: { ...baseTrace.config, minZoom: 1, maxZoom: 1 },
        samples: [
          { at: 0, targets: [{ id: 'p1', x: 0, y: 800, width: 48, height: 64 }, { id: 'p2', x: 3200, y: 800, width: 48, height: 64 }] },
          { at: 1000, targets: [{ id: 'p1', x: 0, y: 800, width: 48, height: 64 }, { id: 'p2', x: 3200, y: 800, width: 48, height: 64 }] },
        ],
        assertions: { targetsVisible: true },
      }
    : baseTrace
  const result = runTrace(trace)
  const receipt = document.querySelector<HTMLElement>('#trace-result')!
  receipt.dataset.result = result.ok ? 'pass' : 'fail'
  const firstFailure = result.failures[0]
  receipt.replaceChildren()
  const kicker = document.createElement('p')
  kicker.className = 'trace-kicker'
  kicker.textContent = `MCK / ${result.frames.length} fixed frames / ${result.durationMs}ms`
  const heading = document.createElement('strong')
  heading.textContent = result.ok ? 'PASS — every player visible' : 'FAIL — player left frame'
  const detail = document.createElement('p')
  detail.textContent = firstFailure
    ? `${firstFailure.targetId ?? 'Camera'} at ${firstFailure.at.toFixed(2)}ms. ${result.failures.length} assertion${result.failures.length === 1 ? '' : 's'} failed.`
    : `0 failures. Fixed step ${result.fixedStepMs.toFixed(2)}ms.`
  receipt.append(kicker, heading, detail)
}

document.querySelector('#run-safe-trace')!.addEventListener('click', () => displayTrace(false))
document.querySelector('#run-broken-trace')!.addEventListener('click', () => displayTrace(true))

function updateOnlineStatus(): void {
  document.querySelector<HTMLElement>('#offline-status')!.hidden = navigator.onLine
}
window.addEventListener('online', updateOnlineStatus)
window.addEventListener('offline', updateOnlineStatus)
updateOnlineStatus()

if ('serviceWorker' in navigator) {
  const registerServiceWorker = () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline support is an enhancement; camera logic is unaffected.
    })
  }
  if (document.readyState === 'complete') registerServiceWorker()
  else window.addEventListener('load', registerServiceWorker, { once: true })
}

camera = createDemoCamera()
markDemoState()
setPaused(paused)
requestAnimationFrame(render)
return () => {
  cancelAnimationFrame(animationFrame)
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
}
}
