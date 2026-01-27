import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
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
    "Öğrenci Koçluğu",
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
  openGraph: {
    title: "Puaniz | YKS Analiz ve Takip Platformu",
    description: "YKS hazırlık sürecinde netlerinizi ve gelişiminizi profesyonel grafiklerle takip edin.",
    url: "https://www.puaniz.com.tr",
    siteName: "Puaniz",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Puaniz | YKS Analiz ve Takip",
    description: "YKS sürecinizi verilerle yönetin.",
    creator: "@puaniz", // Varsayılan handle
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body suppressHydrationWarning>
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
