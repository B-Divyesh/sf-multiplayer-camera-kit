import { execFileSync, spawn } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const origin = 'http://127.0.0.1:4174'
const tag = '@claim:package-delivery @claim:package-formats @claim:mit-license'
const grepIndex = process.argv.indexOf('--grep')
const grep = grepIndex === -1 ? undefined : process.argv[grepIndex + 1]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function waitForServer() {
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    try {
      if ((await fetch(origin)).ok) return
    } catch {
      // Preview is still starting.
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('Package preview did not start within 15 seconds')
}

if (!grep || tag.includes(grep)) {
  const server = spawn(process.execPath, [
    './node_modules/vite/bin/vite.js', 'preview', '--config', 'vite.config.ts',
    '--host', '127.0.0.1', '--port', '4174', '--strictPort',
  ], { stdio: ['ignore', 'pipe', 'pipe'] })
  const consumer = await mkdtemp(join(tmpdir(), 'mck-consumer-'))
  try {
    await waitForServer()
    const response = await fetch(`${origin}/downloads/multiplayer-camera-kit-0.1.0.tgz`)
    assert(response.ok, `Public package download returned ${response.status}`)
    const archive = join(consumer, 'multiplayer-camera-kit-0.1.0.tgz')
    await writeFile(archive, Buffer.from(await response.arrayBuffer()))
    await writeFile(join(consumer, 'package.json'), JSON.stringify({ name: 'mck-consumer-check', private: true, type: 'module' }))
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    execFileSync(npm, ['install', '--ignore-scripts', archive], { cwd: consumer, stdio: 'pipe' })

    const installedManifest = JSON.parse(await readFile(join(consumer, 'node_modules/multiplayer-camera-kit/package.json'), 'utf8'))
    assert(installedManifest.license === 'MIT', 'Downloaded package does not declare the MIT license')
    assert(!installedManifest.dependencies || Object.keys(installedManifest.dependencies).length === 0, 'Downloaded package has runtime dependencies')
    assert(await readFile(join(consumer, 'node_modules/multiplayer-camera-kit/LICENSE'), 'utf8').then(text => text.includes('Permission is hereby granted, free of charge')), 'Downloaded package lacks MIT license terms')

    const esm = await import(join(consumer, 'node_modules/multiplayer-camera-kit/dist/package/index.js'))
    const cjs = await import('node:module').then(({ createRequire }) => createRequire(import.meta.url)(join(consumer, 'node_modules/multiplayer-camera-kit')))
    assert(typeof esm.createCamera === 'function' && typeof cjs.createCamera === 'function', 'Downloaded package does not expose both module formats')
    const camera = esm.createCamera({ viewport: { width: 800, height: 450 }, world: { x: 0, y: 0, width: 1600, height: 900 }, padding: 48 })
    const pose = camera.snap([{ id: 'scout', x: 420, y: 220, width: 40, height: 56 }, { id: 'builder', x: 920, y: 420, width: 40, height: 56 }])
    const renderer = { position: { set: (x, y) => [x, y] }, scale: { set: zoom => zoom } }
    assert(renderer.position.set(-pose.x * pose.zoom, -pose.y * pose.zoom).every(Number.isFinite), 'Camera pose cannot drive a generic renderer')
    assert(Number.isFinite(renderer.scale.set(pose.zoom)), 'Camera zoom cannot drive a generic renderer')

    await writeFile(join(consumer, 'check.ts'), "import { createCamera, type CameraPose } from 'multiplayer-camera-kit'\nconst pose: CameraPose = createCamera({ viewport: { width: 1, height: 1 }, world: { x: 0, y: 0, width: 1, height: 1 } }).pose\nvoid pose\n")
    execFileSync(process.execPath, [resolve(process.cwd(), 'node_modules/typescript/bin/tsc'), '--noEmit', '--target', 'ES2022', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', 'check.ts'], { cwd: consumer, stdio: 'pipe' })
    console.log(`${tag} passed: installed the served tarball and exercised ESM, CommonJS, declarations, license, and renderer output.`)
  } finally {
    server.kill('SIGTERM')
    await rm(consumer, { recursive: true, force: true })
  }
}
