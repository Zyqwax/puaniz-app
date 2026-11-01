import React from "react";
import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "İletişim | Puaniz",
  description:
    "Puaniz ile iletişime geçin. Okullar ve kurumlar için demo talebi, görüş, öneri ve hata bildirimi formu.",
  openGraph: {
    title: "İletişim | Puaniz",
    description:
      "Okullar için demo talebi, görüş ve önerileriniz için bize ulaşın. Ortalama yanıt süresi 2 iş günü.",
    url: "https://www.puaniz.com.tr/contact",
  },
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: "Puaniz İletişim",
            url: "https://www.puaniz.com.tr/contact",
            mainEntity: {
              "@type": "Organization",
              name: "Puaniz",
              email: "iletisim@puaniz.com.tr",
              areaServed: "TR",
              description:
                "YKS/LGS sınav analizi ve okul deneme yönetimi platformu.",
            },
          }),
        }}
      />
      <ContactClient />
    </>
  );
}
