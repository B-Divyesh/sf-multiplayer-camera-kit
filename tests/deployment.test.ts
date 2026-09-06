import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('static-host response policy', () => {
  it('ships restrictive browser isolation and embedding headers', () => {
    const config = JSON.parse(readFileSync(resolve(process.cwd(), 'site/public/staticwebapp.config.json'), 'utf8')) as {
      globalHeaders?: Record<string, string>
    }
    const headers = config.globalHeaders ?? {}

    expect(headers['content-security-policy']).toContain("default-src 'self'")
    expect(headers['content-security-policy']).toContain("object-src 'none'")
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(headers['content-security-policy']).toContain("img-src 'self' data:")
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['permissions-policy']).toContain('camera=()')
    expect(headers['cross-origin-opener-policy']).toBe('same-origin')
  })

  it('rewrites unknown paths to the designed 404 document instead of the app shell', () => {
    const config = JSON.parse(readFileSync(resolve(process.cwd(), 'site/public/staticwebapp.config.json'), 'utf8')) as {
      responseOverrides?: Record<string, { rewrite?: string }>
    }
    const notFound = readFileSync(resolve(process.cwd(), 'site/public/404.html'), 'utf8')
    expect(config.responseOverrides?.['404']?.rewrite).toBe('/404.html')
    expect(notFound).toContain('<title>Page not found — Multiplayer Camera Kit</title>')
    expect(notFound).toContain('<main>')
  })
})
