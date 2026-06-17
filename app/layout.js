import "./globals.css";
import SwRegister from "./SwRegister";
import InstallBanner from "./InstallBanner";
import { Open_Sans } from "next/font/google";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-open-sans",
});

export const metadata = {
  metadataBase: new URL("https://ogeuka.netlify.app"),
  title: "Oge Uka",
  description: "Daily Catholic Mass readings in English and Igbo",
  manifest: "/manifest.json",
  icons: { icon: "/icons/Logo%20Background.svg" },
  openGraph: {
    title: "Oge Uka",
    description: "Daily Catholic Mass readings in English and Igbo",
    url: "https://ogeuka.netlify.app/",
    siteName: "Oge Uka",
    images: [{ url: "/icons/OG%20Image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
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
        <InstallBanner />
        <div className="flex justify-center pt-6 pb-2">
          <img src="/icons/Logo%20No%20BG.svg" alt="Oge Uka" className="h-12 w-auto" />
        </div>
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
