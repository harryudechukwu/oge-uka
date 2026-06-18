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
    const saved = localStorage.getItem("oge-uka-lang");
    if (saved) setActiveLanguage(saved);
  }, []);

  useEffect(() => {
    const date = today();
    let cancelled = false;

    (async () => {
      const [en, ig] = await Promise.all([
        loadReadings(date, "en"),
        loadReadings(date, "ig"),
        new Promise((r) => setTimeout(r, 3000)),
      ]);
      if (cancelled) return;
      setEnglishData(en);
      setIgboData(ig);
      if (!en && !ig) setIsOffline(true);
      if (en || ig) prefetchWeek();
      if (!cancelled) setIsLoading(false);
    })();

    return () => { cancelled = true; };
  }, []);

  const activeData = activeLanguage === "en" ? englishData : igboData;

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111]">
      <div className="fixed bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-white to-white/0 pointer-events-none z-40" style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", maskImage: "linear-gradient(to top, black 40%, transparent)", WebkitMaskImage: "linear-gradient(to top, black 40%, transparent)" }} />
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}>
        <div className="pointer-events-auto">
          <div className="inline-flex bg-gray-100 backdrop-blur-sm rounded-full p-1 gap-px border border-gray-200">
            <button
              onClick={() => { setActiveLanguage("en"); localStorage.setItem("oge-uka-lang", "en"); }}
              className={`w-24 py-2.5 rounded-full text-base font-semibold text-center transition-all duration-300 ${
                activeLanguage === "en"
                  ? "bg-white text-gray-900 border border-[#ddd]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              English
            </button>
            <button
              onClick={() => { setActiveLanguage("ig"); localStorage.setItem("oge-uka-lang", "ig"); }}
              className={`w-24 py-2.5 rounded-full text-base font-semibold text-center transition-all duration-300 ${
                activeLanguage === "ig"
                  ? "bg-white text-gray-900 border border-[#ddd]"
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
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white gap-5">
          <div className="w-6 h-6 border-2 border-[#ddd] border-t-[#111] rounded-full animate-spin" />
          <p className="text-[20px] font-medium text-[#888]" style={{ fontFamily: "'Open Sans Condensed', sans-serif" }}>Getting today&apos;s reading</p>
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
          <footer className="text-center pt-2 pb-6 text-[17px]" style={{ fontFamily: "'Open Sans Condensed', sans-serif" }}>
            <span className="text-[#999]">Built by </span>
            <a href="https://harryude.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-[#111] underline underline-offset-2">HarryUde</a>
            <span className="text-[#999]"> for the Church of God</span>
          </footer>
        </main>
      )}
    </div>
  );
}
