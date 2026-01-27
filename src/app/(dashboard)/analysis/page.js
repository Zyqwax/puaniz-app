import AnalysisClient from "./AnalysisClient";

export const metadata = {
  title: "Detaylı Analiz",
  description: "Ders bazlı net grafikleri ve gelişim raporları ile eksiklerinizi tespit edin.",
  keywords: ["ders analizi", "net grafikleri", "gelişim raporu", "yks istatistik", "deneme analizi"],
};

export default function AnalysisPage() {
  return <AnalysisClient />;
}
