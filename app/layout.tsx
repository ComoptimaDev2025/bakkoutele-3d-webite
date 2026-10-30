import type { Metadata, Viewport } from "next";
import "@fontsource/chakra-petch/500.css";
import "@fontsource/chakra-petch/600.css";
import "@fontsource/chakra-petch/700.css";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Bakkou Tele — أكاديمية بكّو للتقنية والذكاء الاصطناعي | Rabat",
  description:
    "تكوين في إصلاح الهواتف والحواسيب وتركيب كاميرات المراقبة بالرباط. Formation réparation smartphone, micro-soudure et CCTV à Rabat.",
  openGraph: {
    title: "Bakkou Tele — AI-Tech Academy",
    description: "Réparation smartphone, micro-soudure et vidéosurveillance — Rabat.",
    locale: "ar_MA",
    alternateLocale: ["fr_MA"],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#050814",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <I18nProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-cyan focus:px-4 focus:py-2 focus:text-void"
          >
            Skip / تخطي
          </a>
          <Navbar />
          <main id="main" className="relative z-10">
            {children}
          </main>
          <div className="relative z-10">
            <Footer />
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
