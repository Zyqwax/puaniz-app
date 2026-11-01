import React from "react";
import type { Metadata } from "next";
import HistoryClient from "./HistoryClient";

export const metadata: Metadata = {
  title: "Deneme Geçmişi",
  description: "Girdiğiniz tüm deneme sınavlarının geçmişini ve detaylı listesini görüntüleyin.",
  keywords: ["deneme geçmişi", "sınav geçmişi", "tyt geçmişi", "ayt geçmişi", "net takibi"],
};

export default function HistoryPage() {
  return <HistoryClient />;
}
