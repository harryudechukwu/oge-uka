import { saveToCache, getFromCache } from "./storage";

async function fetchDate(dateString, lang) {
  const url = `/api/${lang}-readings?date=${dateString}`;
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(id);
    if (!res.ok) return null;
    const data = await res.json();
    await saveToCache(url, data);
    return data;
  } catch {
    return getFromCache(url);
  }
}

async function loadReadings(date, language) {
  return fetchDate(date, language === "en" ? "english" : "igbo");
}

export { loadReadings };
