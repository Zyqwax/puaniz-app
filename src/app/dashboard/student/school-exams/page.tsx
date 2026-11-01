import type { Metadata } from "next";
import SchoolExamsClient from "./SchoolExamsClient";

export const metadata: Metadata = {
  title: "Okul Denemeleri - Puaniz",
  description: "Okul deneme sınavı sonuçlarınız ve sıralamalarınız.",
};

export default function SchoolExamsPage() {
  return <SchoolExamsClient />;
}
