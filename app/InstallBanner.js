"use client";

import { useState, useEffect } from "react";

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (standalone) return;

    if (ios && !standalone) {
      setIsIOS(true);
      setShow(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const id = setTimeout(() => setShow(true), 5000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(id);
    };
  }, []);

  const handleInstall = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      setDeferredPrompt(null);
      setShow(false);
    });
  };

  if (!show) return null;

  return (
    <div className="sticky top-0 z-[60] bg-[#f7f7f7] text-[#333] py-[7px]">
      <div className="max-w-[640px] mx-auto px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <img src="/icons/Logo%20Background.svg" alt="" className="h-[38px] w-auto border border-[#ddd]" />
              <p className="text-[17px] leading-tight font-bold" style={{ fontFamily: "'Open Sans Condensed', sans-serif" }}>
            Add To Homescreen
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShow(false)}
            className="text-[16px] font-bold text-[#999] hover:text-[#333]"
            style={{ fontFamily: "'Open Sans Condensed', sans-serif" }}
          >
            Dismiss
          </button>
          {!isIOS && (
            <button
              onClick={handleInstall}
              className="bg-white text-[#111] text-[16px] font-bold px-3 py-[7px] border border-[#ddd]"
              style={{ fontFamily: "'Open Sans Condensed', sans-serif" }}
            >
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
