const cheerio = require("cheerio");

fetch("https://www.catholiclectionary.com/tuesday-of-11th-week-ordinary-time-2/")
  .then((r) => r.text())
  .then((html) => {
    const $ = cheerio.load(html);
    $("h3").each((i, h3) => {
      const label = $(h3).text().trim();
      console.log("H3:", label);
      let found = false;
      $(h3)
        .nextUntil("h3")
        .each((j, el) => {
          if (el.tagName?.toLowerCase() === "p" && !found) {
            const raw = $(el).text();
            console.log("RAW P:", JSON.stringify(raw.slice(0, 100)));
            const chars = [];
            for (let k = 0; k < Math.min(raw.length, 30); k++) {
              chars.push(
                "U+" +
                  raw.charCodeAt(k).toString(16).toUpperCase().padStart(4, "0")
              );
            }
            console.log("Chars:", chars.join(" "));
            found = true;
          }
        });
    });
  })
  .catch((e) => console.error(e));
