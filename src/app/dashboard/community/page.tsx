import { Metadata } from "next";
import CommunityClient from "./CommunityClient";

export const metadata: Metadata = {
  title: "Topluluk",
  description:
    "Diğer öğrencilerle etkileşime geçin, sorular sorun ve tecrübelerinizi paylaşın.",
  keywords: [
    "yks topluluk",
    "soru cevap",
    "öğrenci forumu",
    "yks forum",
    "deneme paylaşımı",
  ],
};

export default function CommunityPage() {
  return <CommunityClient />;
}
