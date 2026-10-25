import "./globals.css";
import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Outfit } from "next/font/google";
import React from "react";

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.puaniz.com.tr"),
  title: {
    default: "Puaniz | YKS Analiz ve Takip",
    template: "%s | Puaniz",
  },
  description:
    "YKS sürecinizi profesyonel analizlerle yönetin. Netlerinizi takip edin, gelişiminizi görün ve hedeflerinize ulaşın.",
  keywords: [
    "YKS",
    "TYT",
    "AYT",
    "YKS Takip",
    "Deneme Analizi",
    "YKS Puan Hesaplama",
    "Sınav Takip",
  ],
  authors: [{ name: "Puaniz Team" }],
  creator: "Puaniz",
  publisher: "Puaniz",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://www.puaniz.com.tr",
    siteName: "Puaniz",
    title: "Puaniz | YKS Analiz ve Takip",
    description:
      "YKS sürecinizi profesyonel analizlerle yönetin. Netlerinizi takip edin, gelişiminizi görün ve hedeflerinize ulaşın.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Puaniz | YKS Analiz ve Takip Platformu",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Puaniz | YKS Analiz ve Takip",
    description:
      "YKS sürecinizi profesyonel analizlerle yönetin. Netlerinizi takip edin, gelişiminizi görün ve hedeflerinize ulaşın.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Puaniz | YKS Analiz ve Takip Platformu",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0F2A5C",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={outfit.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("puaniz-theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t)}else if(!t||t==="system"){var m=window.matchMedia("(prefers-color-scheme: dark)").matches;if(m){document.documentElement.setAttribute("data-theme","dark")}else{document.documentElement.setAttribute("data-theme","light")}}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Puaniz",
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "TRY",
              },
              description: "YKS hazırlık ve analiz platformu.",
            }),
          }}
        />
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
