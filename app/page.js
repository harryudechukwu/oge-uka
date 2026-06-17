"use client";

import { useState, useEffect } from "react";
import { loadReadings } from "../lib/fetchReadings";

function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysAhead(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function prefetchWeek() {
  for (let i = 1; i <= 7; i++) {
    ["en", "ig"].forEach((lang) => {
      fetch(`/api/${lang === "en" ? "english" : "igbo"}-readings?date=${daysAhead(i)}`).catch(() => {});
    });
  }
}

export default function Page() {
  const [activeLanguage, setActiveLanguage] = useState("en");
  const [englishData, setEnglishData] = useState(null);
  const [igboData, setIgboData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const date = today();
    let cancelled = false;

    (async () => {
      try {
        const [en, ig] = await Promise.all([
          loadReadings(date, "en"),
          loadReadings(date, "ig"),
        ]);
        if (cancelled) return;
        setEnglishData(en);
        setIgboData(ig);
        if (!en && !ig) setIsOffline(true);
        if (en || ig) prefetchWeek();
      } catch (err) {
        console.error("Failed to load readings", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    const timeout = setTimeout(() => {
      if (!cancelled) setIsLoading(false);
    }, 10000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  const activeData = activeLanguage === "en" ? englishData : igboData;

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111]">
      <div className="fixed bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-white to-white/0 pointer-events-none z-40" style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", maskImage: "linear-gradient(to top, black 40%, transparent)", WebkitMaskImage: "linear-gradient(to top, black 40%, transparent)" }} />
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="inline-flex bg-gray-200/80 backdrop-blur-sm rounded-full p-1 gap-px">
            <button
              onClick={() => setActiveLanguage("en")}
              className={`w-24 py-2.5 rounded-full text-base font-semibold text-center transition-all duration-300 ${
                activeLanguage === "en"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setActiveLanguage("ig")}
              className={`w-24 py-2.5 rounded-full text-base font-semibold text-center transition-all duration-300 ${
                activeLanguage === "ig"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Igbo
            </button>
          </div>
        </div>
      </div>

      {isOffline && (
        <p className="text-center text-[12px] text-[#999] py-2">
          Offline · cached readings
        </p>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[14px] text-[#999]">Loading...</p>
        </div>
      ) : !activeData ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-[14px] text-[#999] text-center">
            No readings available. Connect to the internet and refresh.
          </p>
        </div>
      ) : (
        <main className="flex-1 px-4 max-w-[640px] mx-auto w-full pb-[210px]">
          <div className="pt-8 pb-6">
            <h1 className="text-[28px] font-bold" style={{ fontFamily: "'Open Sans Condensed', sans-serif" }}>{formatDate()}</h1>
            {activeData.liturgicalDay && (
              <p className="text-[18px] text-[#888] mt-0.5" style={{ fontFamily: "'Open Sans Condensed', sans-serif" }}>
                {activeData.liturgicalDay}
              </p>
            )}
          </div>

          {activeData.readings?.map((r, i) => (
            <div
              key={i}
              className={i > 0 ? "border-t border-[#F0F0F0] pt-6 pb-8" : "pb-8"}
            >
              <section>
                <p className="text-[13px] font-bold tracking-[0.06em] text-[#999] uppercase" style={{ fontFamily: "'Open Sans Condensed', sans-serif" }}>
                  {r.label}
                </p>
                <p className="text-[18px] font-bold text-[#111] mt-0.5" style={{ fontFamily: "'Open Sans Condensed', sans-serif" }}>
                  {r.reference}
                </p>
                {r.text && r.label && (/^(Responsorial Psalm|ABỤỌMA|Alleluia|MBEKU)/i.test(r.label)) ? (
                  <div className="mt-4 leading-[1.75] whitespace-pre-line">
                    {r.text.split(/\n{2,}/).map((para, pi) => (
                      <p key={pi} className={/^(R\.|Azịza:|Alleluia)/i.test(para.trimStart()) ? "text-[17px] font-bold text-[#111]" : "text-[16px] text-[#333]"} style={/^(R\.|Azịza:|Alleluia)/i.test(para.trimStart()) ? { fontFamily: "'Open Sans Condensed', sans-serif" } : {}}>
                        {para}
                      </p>
                    ))}
                  </div>
                ) : r.text && (
                  <p className="text-[16px] text-[#333] leading-[1.75] mt-4 whitespace-pre-line">
                    {r.text}
                  </p>
                )}
              </section>
            </div>
          ))}
        </main>
      )}
    </div>
  );
}
