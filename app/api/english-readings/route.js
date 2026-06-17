import * as cheerio from "cheerio";

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const ORDINALS = { first: "1", second: "2", third: "3" };

function extractBookName(intro) {
  const t = intro.replace(/^A reading from\s+/i, "").replace(/^the\s+/i, "").replace(/\.$/, "").trim();
  let m;

  m = t.match(/holy Gospel according to (\w+)/i);
  if (m) return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();

  m = t.match(/(\w+)\s+Letter\s+(?:of Saint Paul\s+)?to\s+the\s+(.+)/i);
  if (m) {
    const num = ORDINALS[m[1].toLowerCase()] || "";
    return (num ? num + " " : "") + m[2].trim();
  }

  m = t.match(/(\w+)\s+Book\s+of\s+(.+)/i);
  if (m) {
    const num = ORDINALS[m[1].toLowerCase()] || "";
    return (num ? num + " " : "") + m[2].trim();
  }

  m = t.match(/Book\s+of\s+the\s+prophet\s+(.+)/i);
  if (m) return m[1].trim();

  m = t.match(/Book\s+of\s+(.+)/i);
  if (m) return m[1].trim();

  if (/Acts of the Apostles/i.test(t)) return "Acts";

  return null;
}

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
    const monthlyUrl = `https://www.catholiclectionary.com/catholic-mass-readings-for-${month}/`;
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
      return Response.json({ error: "Could not load daily English page", dailyUrl }, { status: 503 });
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
          if (/Catholic Mass Readings for/i.test(text)) return false;
          text = text.replace(/^\d+\s+/, "");
          paras.push(text);
        }
      });

      let ref = reference;
      if (/^\d/.test(ref) && paras.length > 0) {
        const firstP = paras.shift();
        const book = extractBookName(firstP);
        if (book) {
          ref = book + " " + ref;
        } else {
          paras.unshift(firstP);
        }
      }

      let text = paras.join("\n\n");
      text = text.replace(/([.,:;"'!?])\s+\d+\s+/g, "$1 ");
      text = text.replace(/  +/g, " ");
      readings.push({ label, reference: ref, text: text.trim() });
    });

    return Response.json({
      date,
      dailyUrl,
      liturgicalDay,
      language: "en",
      readings,
    }, { status: 200 });

  } catch (err) {
    console.error("English fetch error:", err);
    return Response.json({ error: "English readings unavailable", date }, { status: 503 });
  }
}
