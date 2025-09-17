// app/layout.tsx
import type {ReactNode} from "react";
import "./globals.css";
import Navbar from "@/src/components/Navbar";
import Footer from "@/src/components/Footer"; // ← Footer'u ekledik
import Script from "next/script";

export default function RootLayout({children}: { children: ReactNode }) {
  return (
    <html lang="tr">
    <head>
      {/* Google Fonts (tek satır) */}
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin=""
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800&family=Montserrat:wght@300;400;500;600;700;800&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;500;600;700&family=Lato:wght@300;400;700;900&family=Nunito:wght@300;400;600;700;800&family=Raleway:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Merriweather:wght@300;400;700&family=Roboto+Slab:wght@300;400;700&family=Source+Sans+3:wght@300;400;600;700&display=swap"
        rel="stylesheet"
      />

      {/* GA4 */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-F7GF97HHZF"
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-F7GF97HHZF');
          `}
      </Script>
    </head>
    {/* Sticky footer için flex kolon */}
    <body className="min-h-screen flex flex-col bg-white text-neutral-900">
    <Navbar/>
    {/* İçerik alanı: sayfayı doldurur, footer'ı alta iter */}
    <main className="flex-1">{children}</main>
    <Footer/>
    </body>
    </html>
  );
}
