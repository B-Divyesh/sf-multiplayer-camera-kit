import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const origin = 'http://127.0.0.1:4173'
const server = spawn(process.execPath, [
  './node_modules/vite/bin/vite.js',
  'preview',
  '--config',
  'vite.config.ts',
  '--host',
  '127.0.0.1',
  '--port',
  '4173',
  '--strictPort',
], { stdio: ['ignore', 'pipe', 'pipe'] })

async function waitForServer() {
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(origin)
      if (response.ok) return
    } catch {
      // The preview server is still starting.
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('Preview server did not start within 15 seconds')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

try {
  await waitForServer()
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const consoleErrors = []
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', error => consoleErrors.push(error.message))

  await page.goto(origin, { waitUntil: 'networkidle' })
  assert((await page.title()).includes('Multiplayer Camera Kit'), 'Document title is missing')
  assert(await page.locator('h1').count() === 1, 'Expected exactly one h1')
  assert(await page.locator('main').count() === 1, 'Expected a main landmark')
  assert(await page.locator('img:not([alt])').count() === 0, 'Every image must have alt text')
  await page.locator('#camera-canvas').waitFor({ state: 'visible' })
  await page.waitForFunction(
    () => document.body.dataset.cameraReady === 'true',
    undefined,
    { timeout: 10_000 },
  ).catch(async error => {
    throw new Error(`Live demo did not initialize: ${await page.locator('#demo-status').textContent()}; console: ${consoleErrors.join(' | ')}`, { cause: error })
  })

  await page.locator('#clear-targets').click()
  await page.locator('#empty-state').waitFor({ state: 'visible' })
  assert((await page.locator('#demo-status').textContent())?.includes('No players'), 'Empty state status is missing')
  await page.locator('#restore-targets').click()

  await page.locator('input[value="breach"]').check()
  await page.waitForFunction(() => document.querySelector('#readout-safe')?.textContent === 'LIMIT')
  assert((await page.locator('#demo-status').textContent())?.includes('minimum zoom'), 'Limit state is not explained')

  await page.locator('#camera-canvas').focus()
  await page.keyboard.press('Space')
  assert(await page.locator('#motion-toggle').getAttribute('aria-pressed') === 'true', 'Space did not pause the demo')
  await page.keyboard.press('ArrowRight')

  await page.locator('#run-safe-trace').click()
  assert((await page.locator('#trace-result strong').textContent())?.startsWith('PASS'), 'Safe replay did not pass')
  await page.locator('#run-broken-trace').click()
  assert((await page.locator('#trace-result strong').textContent())?.startsWith('FAIL'), 'Broken replay was not caught')

  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const severe = accessibility.violations.filter(item => item.impact === 'serious' || item.impact === 'critical')
  assert(severe.length === 0, `Serious accessibility violations: ${severe.map(item => item.id).join(', ')}`)
  const onlineConsoleErrors = [...consoleErrors]
  assert(onlineConsoleErrors.length === 0, `Console errors on load: ${onlineConsoleErrors.join(' | ')}`)

  await page.evaluate(() => navigator.serviceWorker?.ready)
  await context.setOffline(true)
  await page.waitForFunction(() => !document.querySelector('#offline-status')?.hasAttribute('hidden'))
  await page.reload({ waitUntil: 'domcontentloaded' })
  assert(await page.locator('h1').count() === 1, 'Offline shell did not load')
  await context.setOffline(false)

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const mobilePage = await mobile.newPage()
  await mobilePage.goto(origin, { waitUntil: 'networkidle' })
  await mobilePage.waitForFunction(() => document.body.dataset.cameraReady === 'true')
  assert(await mobilePage.locator('#error-state').isHidden(), 'Mobile camera entered the error state')
  const horizontalOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  assert(horizontalOverflow <= 1, `Mobile page overflows horizontally by ${horizontalOverflow}px`)
  assert(await mobilePage.locator('#motion-toggle').getAttribute('aria-pressed') === 'true', 'Reduced motion should pause target drift')
  const undersizedTargets = await mobilePage.locator('button, a, select').evaluateAll(elements =>
    elements
      .filter(element => {
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return style.display !== 'none' && rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)
      })
      .map(element => ({ text: element.textContent?.trim(), rect: element.getBoundingClientRect().toJSON() })),
  )
  assert(undersizedTargets.length === 0, `Touch targets below 44px: ${JSON.stringify(undersizedTargets)}`)

  console.log(JSON.stringify({
    desktop: 'passed',
    mobile390: 'passed',
    offlineReload: 'passed',
    seriousAxeViolations: severe.length,
    consoleErrorsOnLoad: onlineConsoleErrors,
  }, null, 2))
  await mobile.close()
  await context.close()
  await browser.close()
} finally {
  server.kill('SIGTERM')
}
