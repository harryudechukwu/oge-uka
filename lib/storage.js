const CACHE = "oge-uka-cache";

export async function saveToCache(url, data) {
  try {
    const cache = await caches.open(CACHE);
    const res = new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
    await cache.put(url, res);
  } catch {}
}

export async function getFromCache(url) {
  try {
    const cache = await caches.open(CACHE);
    const res = await cache.match(url);
    if (!res) return null;
    return await res.json();
  } catch {
    return null;
  }
}
