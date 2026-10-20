import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const output = new URL('../dist/', import.meta.url)

const offlinePage = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#c82432" />
  <title>Offline | Parkly</title>
  <style>
    * { box-sizing: border-box; }
    body {
      display: grid;
      place-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      background: #f7f7f8;
      color: #222328;
      font-family: 'Segoe UI', Arial, sans-serif;
      text-align: center;
    }
    main {
      width: 100%;
      max-width: 440px;
      padding: 38px 28px;
      border: 1px solid #e4e7ee;
      border-radius: 20px;
      background: #fff;
      box-shadow: 0 12px 40px rgb(24 25 29 / 6%);
    }
    .logo {
      display: grid;
      place-items: center;
      width: 52px;
      height: 56px;
      margin: 0 auto 25px;
      border-radius: 14px;
      background: #c82432;
      color: #fff;
      font-size: 36px;
      font-weight: 800;
    }
    h1 { margin: 0 0 14px; font-size: 27px; }
    p { color: #686a73; font-size: 14px; line-height: 1.7; }
    a {
      display: inline-block;
      margin-top: 15px;
      padding: 13px 24px;
      border-radius: 9px;
      background: #c82432;
      color: #fff;
      font-weight: 600;
      text-decoration: none;
    }
    a:hover { background: #a91a28; }
    a:focus-visible {
      outline: 3px solid #c82432;
      outline-offset: 4px;
    }
    small {
      display: block;
      margin-top: 25px;
      color: #969ca7;
      font-size: 10px;
      letter-spacing: 1.5px;
    }
  </style>
</head>
<body>
  <main>
    <div class="logo" aria-hidden="true">P</div>
    <h1>You're offline.</h1>
    <p>Reconnect to your network to continue using Parkly.</p>
    <p>Vehicle entries, exits and payments need a live connection.</p>
    <a href="">Try again</a>
    <small>PARKLY · PARKING MANAGEMENT</small>
  </main>
</body>
</html>
`

const index = await readFile(new URL('index.html', output))
const version = createHash('sha256')
  .update(index)
  .update(offlinePage)
  .digest('hex')
  .slice(0, 12)

const serviceWorker = `
const CACHE_NAME = 'parkly-offline-${version}'
const OFFLINE_URL = '/offline.html'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.add(new Request(OFFLINE_URL, { cache: 'reload' })),
    ),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) =>
            name.startsWith('parkly-offline-') &&
            name !== CACHE_NAME,
          )
          .map((name) => caches.delete(name)),
      ),
    ),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  // Only handle page navigation. API calls stay on the network.
  if (
    request.method !== 'GET' ||
    request.mode !== 'navigate' ||
    url.origin !== self.location.origin ||
    /^\\/api(?:\\/|$)/i.test(url.pathname)
  ) {
    return
  }

  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME)
      return (await cache.match(OFFLINE_URL)) || Response.error()
    }),
  )
})
`

await writeFile(new URL('offline.html', output), offlinePage)
await writeFile(new URL('sw.js', output), serviceWorker.trimStart())

console.log('Parkly service worker and offline page generated.')