async function fetchDate(dateString, lang) {
  try {
    const res = await fetch(`/api/${lang}-readings?date=${dateString}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function loadReadings(date, language) {
  return fetchDate(date, language === "en" ? "english" : "igbo");
}

async function prefetchTomorrow(language) {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  fetchDate(`${y}-${m}-${day}`, language === "en" ? "english" : "igbo");
}

export { loadReadings, prefetchTomorrow };
