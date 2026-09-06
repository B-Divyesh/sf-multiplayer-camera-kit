import { rm } from 'node:fs/promises'

await rm(new URL('../dist', import.meta.url), { recursive: true, force: true })
await rm(new URL('../site/public/downloads', import.meta.url), { recursive: true, force: true })
