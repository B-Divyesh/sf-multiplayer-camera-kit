import { mkdir, rm } from 'node:fs/promises'
import { spawn } from 'node:child_process'

const destination = new URL('../site/public/downloads/', import.meta.url)
await rm(destination, { recursive: true, force: true })
await mkdir(destination, { recursive: true })

await new Promise((resolve, reject) => {
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const child = spawn(command, ['pack', '--pack-destination', destination.pathname], {
    cwd: new URL('..', import.meta.url),
    stdio: 'inherit',
  })
  child.on('error', reject)
  child.on('exit', code => code === 0 ? resolve() : reject(new Error(`npm pack exited with ${code}`)))
})
