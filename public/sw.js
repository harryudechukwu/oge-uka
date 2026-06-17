const STATIC_CACHE = "oge-uka-static-v9";
const READINGS_CACHE = "oge-uka-readings-v9";

const STATIC_URLS = [
  "/",
  "/manifest.json",
  "/icons/Logo No BG.svg",
  "/icons/Logo Background.svg",
  "/fonts/OpenSansCondensed-Light.ttf",
  "/fonts/OpenSansCondensed-Bold.ttf",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_URLS))
  );
  self.skipWaiting();
});

function daysAhead(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function prefetchWeek() {
  const cache = await caches.open(READINGS_CACHE);
  for (let i = 1; i <= 7; i++) {
    const date = daysAhead(i);
    for (const lang of ["english", "igbo"]) {
      try {
        const url = `/api/${lang}-readings?date=${date}`;
        const res = await fetch(url);
        if (res.ok) await cache.put(new Request(url), res);
      } catch {}
    }
  }
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== READINGS_CACHE)
          .map((k) => caches.delete(k))
      );
      await prefetchWeek();
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(READINGS_CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: "offline" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}
