import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const origin = 'http://127.0.0.1:4173'
const grepIndex = process.argv.indexOf('--grep')
const grep = grepIndex === -1 ? undefined : process.argv[grepIndex + 1]
const server = spawn(process.execPath, [
  './node_modules/vite/bin/vite.js', 'preview', '--config', 'vite.config.ts',
  '--host', '127.0.0.1', '--port', '4173', '--strictPort',
], { stdio: ['ignore', 'pipe', 'pipe'] })

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function waitForServer() {
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    try {
      if ((await fetch(origin)).ok) return
    } catch {
      // The preview server is still starting.
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('Preview server did not start within 15 seconds')
}

function selected(tag) {
  return !grep || tag.includes(grep)
}

async function openDemo(page) {
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.getByRole('link', { name: 'Try it with sample data' }).click()
  await page.waitForURL(`${origin}/demo`)
  await page.locator('#camera-canvas').waitFor({ state: 'visible' })
  await page.waitForFunction(() => document.body.dataset.cameraReady === 'true')
}

const completed = []

try {
  await waitForServer()
  const browser = await chromium.launch({ headless: true })

  async function run(tag, test) {
    if (!selected(tag)) return
    await test()
    completed.push(tag)
  }

  await run('@claim:demo-sandbox', async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    const errors = []
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('pageerror', error => errors.push(error.message))

    await page.goto(origin, { waitUntil: 'networkidle' })
    assert(await page.title() === 'Multiplayer Camera Kit — Keep players in frame', 'Landing title is not route-specific')
    assert(await page.locator('h1').count() === 1, 'Landing must have one h1')
    assert(await page.locator('#demo-banner').isHidden(), 'Demo banner must not appear outside the sandbox')
    assert((await page.locator('h1').textContent()) === 'Keep co-op players in one camera frame', 'Landing headline does not name the job')
    const firstAction = page.getByRole('link', { name: 'Try it with sample data' })
    assert(await firstAction.isVisible(), 'Sample action is not visible')
    assert((await firstAction.boundingBox()).y < 900, 'Sample action is below the first desktop screen')

    await firstAction.click()
    await page.waitForURL(`${origin}/demo`)
    assert(await page.title() === 'Demo — Multiplayer Camera Kit', 'Demo title is not route-specific')
    await page.waitForFunction(() => document.body.dataset.cameraReady === 'true')
    assert(await page.locator('#demo-banner').isVisible(), 'Demo label is missing')
    assert((await page.locator('#demo-banner').textContent()).includes('Demo — sample data'), 'Demo label does not explain sample mode')
    assert(await page.locator('#camera-canvas').getAttribute('data-all-targets-visible') === 'true', 'Sample players are not safely framed')
    assert(await page.locator('#readout-safe').textContent() === 'YES', 'Sample starts in a limit state')
    const demoKeys = await page.evaluate(() => Object.keys(localStorage))
    assert(demoKeys.length === 1 && demoKeys[0].startsWith('demo:'), 'Demo state is not isolated under a demo: key')

    await page.locator('input[value="breach"]').check()
    await page.waitForFunction(() => document.querySelector('#readout-safe')?.textContent === 'LIMIT')
    await page.getByRole('button', { name: 'Reset demo' }).click()
    await page.waitForFunction(() => document.querySelector('#readout-safe')?.textContent === 'YES')
    assert(await page.locator('input[value="duo"]').isChecked(), 'Reset did not restore the populated duo sample')

    await page.getByRole('link', { name: 'Start for real' }).click()
    await page.waitForURL(origin)
    const realKeys = await page.evaluate(() => Object.keys(localStorage))
    assert(realKeys.length === 0, 'Leaving demo retained sample state')
    assert(errors.length === 0, `Console errors during demo flow: ${errors.join(' | ')}`)
    await context.close()
  })

  await run('@claim:offline-demo', async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    await openDemo(page)
    await page.evaluate(() => navigator.serviceWorker?.ready)
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForFunction(() => document.body.dataset.cameraReady === 'true')
    await context.setOffline(true)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.locator('#camera-canvas').waitFor({ state: 'visible' })
    await page.waitForFunction(() => document.body.dataset.cameraReady === 'true')
    assert(await page.title() === 'Demo — Multiplayer Camera Kit', 'Offline demo did not keep its route title')
    assert(await page.locator('#offline-status').isVisible(), 'Offline status is not visible')
    assert(await page.locator('#readout-safe').textContent() === 'YES', 'Offline sample lost its populated result')
    await context.setOffline(false)
    await context.close()
  })

  await run('@claim:private-demo', async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    const origins = new Set()
    page.on('request', request => origins.add(new URL(request.url()).origin))
    await openDemo(page)
    await page.locator('[data-nudge="right"]').click()
    await page.locator('#run-safe-trace').click()
    assert((await page.locator('#trace-result strong').textContent()).startsWith('PASS'), 'The sample trace did not produce a result')
    assert([...origins].every(requestOrigin => requestOrigin === origin), `Unexpected request origin: ${[...origins].join(', ')}`)
    assert((await context.cookies()).length === 0, 'Demo created cookies')
    const storage = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }))
    assert(storage.local.every(key => key.startsWith('demo:')) && storage.session.length === 0, 'Demo touched a non-demo storage namespace')
    await context.close()
  })

  await run('@claim:trace-playground', async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    await openDemo(page)
    await page.locator('#run-safe-trace').click()
    assert((await page.locator('#trace-result strong').textContent()).startsWith('PASS'), 'Safe trace did not pass in the demo')
    await page.locator('#run-broken-trace').click()
    assert((await page.locator('#trace-result strong').textContent()).startsWith('FAIL'), 'Broken trace did not fail in the demo')
    await context.close()
  })

  await run('site-routes-and-recovery', async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    await page.goto(`${origin}/privacy`, { waitUntil: 'networkidle' })
    assert(await page.title() === 'Privacy — Multiplayer Camera Kit', 'Privacy title is incorrect')
    assert(await page.locator('h1').count() === 1, 'Privacy page must have one h1')
    await page.goto(`${origin}/terms`, { waitUntil: 'networkidle' })
    assert(await page.title() === 'Terms — Multiplayer Camera Kit', 'Terms title is incorrect')
    assert(await page.locator('h1').count() === 1, 'Terms page must have one h1')
    await page.goto(`${origin}/404.html`, { waitUntil: 'networkidle' })
    assert(await page.title() === 'Page not found — Multiplayer Camera Kit', '404 title is incorrect')
    assert(await page.locator('main h1').count() === 1, '404 page must have one h1')

    await page.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null })
    await page.goto(`${origin}/demo`, { waitUntil: 'networkidle' })
    await page.locator('#error-state').waitFor({ state: 'visible' })
    assert((await page.locator('#error-message').textContent()).includes('Canvas 2D support'), 'Canvas error does not state the usable recovery')
    assert(await page.getByRole('link', { name: /Check Canvas browser support/ }).isVisible(), 'Canvas error has no usable recovery link')
    await context.close()
  })

  await run('accessibility-and-mobile', async () => {
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const desktopPage = await desktop.newPage()
    await desktopPage.goto(origin, { waitUntil: 'networkidle' })
    await desktopPage.keyboard.press('Tab')
    assert(await desktopPage.locator('.skip-link').evaluate(element => document.activeElement === element), 'Skip link is not the first keyboard stop')
    const homeAxe = await new AxeBuilder({ page: desktopPage }).withTags(['wcag2a', 'wcag2aa']).analyze()
    assert(homeAxe.violations.filter(item => item.impact === 'serious' || item.impact === 'critical').length === 0, 'Landing has serious axe violations')
    await desktop.close()

    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    const page = await mobile.newPage()
    await page.goto(`${origin}/demo`, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => document.body.dataset.cameraReady === 'true')
    assert(await page.locator('#camera-canvas').getAttribute('data-all-targets-visible') === 'true', 'Default mobile sample is not safely framed')
    assert(await page.locator('#motion-toggle').getAttribute('aria-pressed') === 'true', 'Reduced motion did not pause the sample')
    await page.locator('#camera-canvas').focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Space')
    assert(await page.locator('#motion-toggle').getAttribute('aria-pressed') === 'false', 'Canvas keyboard control did not resume motion')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    assert(overflow <= 1, `Mobile page overflows horizontally by ${overflow}px`)
    const undersized = await page.locator('button, a, select').evaluateAll(elements => elements
      .filter(element => {
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return style.display !== 'none' && rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)
      })
      .map(element => element.textContent?.trim()))
    assert(undersized.length === 0, `Mobile touch targets below 44px: ${undersized.join(', ')}`)
    const demoAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    const serious = demoAxe.violations.filter(item => item.impact === 'serious' || item.impact === 'critical')
    assert(serious.length === 0, `Demo has serious axe violations: ${serious.map(item => item.id).join(', ')}`)
    await mobile.close()
  })

  console.log(JSON.stringify({ completed, grep: grep ?? null }, null, 2))
  await browser.close()
} finally {
  server.kill('SIGTERM')
}
