import * as cheerio from "cheerio";

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
  }

  const [year, monthNum, day] = date.split("-");
  const month = MONTHS[parseInt(monthNum, 10) - 1];
  const dayNum = parseInt(day, 10);

  const dateStr = `${month.charAt(0).toUpperCase() + month.slice(1)} ${dayNum} ${year}`;

  try {
    // STEP 1 — Resolve daily URL from monthly index
    const monthlyUrl = `https://www.catholiclectionary.com/igbo-mass-readings-for-${month}/`;
    const monthlyRes = await fetch(monthlyUrl);

    if (!monthlyRes.ok) {
      return Response.json({ error: "Could not load monthly index" }, { status: 503 });
    }

    const monthlyHtml = await monthlyRes.text();
    const $m = cheerio.load(monthlyHtml);

    let dailyUrl = null;
    $m("tr").each((i, tr) => {
      const firstTd = $m(tr).find("td").first();
      if (firstTd.length && firstTd.text().trim().toLowerCase() === dateStr.toLowerCase()) {
        const link = $m(tr).find("a").first();
        if (link.length) dailyUrl = link.attr("href");
        return false;
      }
    });

    if (!dailyUrl) {
      return Response.json({ error: "Date not found in monthly index", date }, { status: 404 });
    }

    // STEP 2 — Scrape and parse the daily reading page
    const dailyRes = await fetch(dailyUrl);

    if (!dailyRes.ok) {
      return Response.json({ error: "Could not load daily Igbo page", dailyUrl }, { status: 503 });
    }

    const dailyHtml = await dailyRes.text();
    const $ = cheerio.load(dailyHtml);

    // Extract liturgical day from h2 text after the first comma
    const h2Text = $("h2").first().text().trim();
    const commaIdx = h2Text.indexOf(",");
    const liturgicalDay = commaIdx !== -1 ? h2Text.slice(commaIdx + 1).trim() : "";

    // Parse readings from each h3 section
    const readings = [];
    $("h3").each((i, h3) => {
      const h3Text = $(h3).text().trim();
      const sepIdx = h3Text.indexOf(" – ");
      const label = sepIdx !== -1 ? h3Text.slice(0, sepIdx).trim().replace(/ Reading for .+$/, "") : h3Text;
      const reference = sepIdx !== -1 ? h3Text.slice(sepIdx + 3).trim() : "";

      const paras = [];
      $(h3).nextUntil("h3").each((j, el) => {
        if (el.tagName?.toLowerCase() === "p") {
          let text = $(el).text().trim();
          if (!text) return;
          if (/^Igbo Mass Readings/i.test(text)) return false;
          text = text.replace(/^\d+\s+/, "");
          paras.push(text);
        }
      });

      let text = paras.join("\n\n");
      text = text.replace(/([.,:;"'!?])\s+\d+\s+/g, "$1 ");
      text = text.replace(/  +/g, " ");
      readings.push({ label, reference, text: text.trim() });
    });

    // Enrich bare-number references from English readings
    const needsEnrichment = readings.some(r => /^\d/.test(r.reference));
    if (needsEnrichment) {
      try {
        const { origin } = new URL(request.url);
        const engRes = await fetch(`${origin}/api/english-readings?date=${date}`);
        if (engRes.ok) {
          const engData = await engRes.json();
          if (engData.readings) {
            const count = Math.min(readings.length, engData.readings.length);
            for (let i = 0; i < count; i++) {
              if (!/[a-zA-Z]/.test(readings[i].reference) && /[a-zA-Z]/.test(engData.readings[i].reference)) {
                readings[i].reference = engData.readings[i].reference;
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to enrich Igbo references from English:", err);
      }
    }

    return Response.json({
      date,
      dailyUrl,
      liturgicalDay,
      language: "ig",
      readings,
    }, { status: 200 });

  } catch (err) {
    console.error("Igbo fetch error:", err);
    return Response.json({ error: "Igbo readings unavailable", date }, { status: 503 });
  }
}
