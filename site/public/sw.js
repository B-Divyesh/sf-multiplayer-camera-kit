const CACHE = 'mck-site-v2'

async function precacheShell() {
  const cache = await caches.open(CACHE)
  const response = await fetch('/')
  await cache.put('/', response.clone())
  const html = await response.text()
  const paths = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)]
    .map(match => match[1])
    .filter(path => path?.startsWith('/') && !path.startsWith('//'))
  await cache.addAll([...new Set(['/', '/demo', '/privacy', '/terms', ...paths])])
}

self.addEventListener('install', event => {
  event.waitUntil(precacheShell())
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))),
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone()
      caches.open(CACHE).then(cache => cache.put(event.request, copy))
      return response
    }).catch(() => event.request.mode === 'navigate' ? caches.match('/') : Response.error())),
  )
})
