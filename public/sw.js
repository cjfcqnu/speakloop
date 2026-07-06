const CACHE_NAME = "speakloop-shell-v3";
const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const withBase = (path) => `${BASE_PATH}${path}`;
const APP_ROOT_URL = withBase("/");
const INDEX_URL = withBase("/index.html");
const APP_SHELL = [
  APP_ROOT_URL,
  INDEX_URL,
  withBase("/manifest.webmanifest"),
  withBase("/icons/icon.svg"),
  withBase("/icons/icon-192.png"),
  withBase("/icons/icon-512.png"),
  withBase("/data/seedMaterials.json"),
];

function collectBuiltAssets(html) {
  return Array.from(html.matchAll(/(?:src|href)="([^"]+)"/g))
    .map((match) => {
      try {
        return new URL(match[1], self.location.origin).toString();
      } catch {
        return "";
      }
    })
    .filter((url) => {
      const assetUrl = new URL(url);
      return assetUrl.origin === self.location.origin && assetUrl.pathname.startsWith(withBase("/assets/"));
    });
}

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(APP_SHELL.map((url) => cache.add(url)));

  // Vite emits hashed CSS/JS assets, so the service worker discovers them from index.html.
  const indexResponse = await fetch(INDEX_URL, { cache: "reload" });
  if (!indexResponse.ok) {
    return;
  }

  await cache.put(INDEX_URL, indexResponse.clone());
  const builtAssets = collectBuiltAssets(await indexResponse.text());
  await Promise.allSettled(builtAssets.map((url) => cache.add(url)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheAppShell());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(INDEX_URL, copy));
          }
          return response;
        })
        .catch(() => caches.match(INDEX_URL).then((cached) => cached || caches.match(APP_ROOT_URL))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
