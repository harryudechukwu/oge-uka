import "./globals.css";
import SwRegister from "./SwRegister";
import { Open_Sans } from "next/font/google";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-open-sans",
});

export const metadata = {
  title: "Oge Uka",
  description: "Daily Catholic Mass readings in English and Igbo",
  manifest: "/manifest.json",
  icons: { icon: "/icons/Logo%20Background.svg" },
  other: {
    "theme-color": "#1a1a2e",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Oge Uka",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={openSans.variable}>
      <body>
        <div className="flex justify-center pt-6 pb-2">
          <img src="/icons/Logo%20No%20BG.svg" alt="Oge Uka" className="h-12 w-auto" />
        </div>
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
