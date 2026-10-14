import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-outfit",
});

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
    images: ["/puaniz-og-image-1200x630.png"],
  },
};

export const viewport = {
  themeColor: "#0F2A5C",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className={outfit.variable} suppressHydrationWarning>
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
