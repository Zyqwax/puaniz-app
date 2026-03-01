import HistoryClient from "./HistoryClient";

export const metadata = {
  title: "Deneme Geçmişi",
  description: "Girdiğiniz tüm deneme sınavlarının geçmişini ve detaylı listesini görüntüleyin.",
  keywords: ["deneme geçmişi", "sınav geçmişi", "tyt geçmişi", "ayt geçmişi", "net takibi"],
};

export default function HistoryPage() {
  return <HistoryClient />;
}
