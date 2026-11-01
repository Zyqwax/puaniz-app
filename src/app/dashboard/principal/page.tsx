import type { Metadata } from "next";
import SchoolClient from "./SchoolClient";

export const metadata: Metadata = {
  title: "Okul Yönetimi - Puaniz",
  description: "Okul sınıfları, öğretmen yetkilendirmeleri ve toplu deneme yükleme.",
};

export default function SchoolPage() {
  return <SchoolClient />;
}
