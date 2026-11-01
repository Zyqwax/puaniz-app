import type { Metadata } from "next";
import MessagesClient from "./MessagesClient";

export const metadata: Metadata = {
  title: "İletişim Mesajları - Puaniz",
  description: "İletişim formundan gelen mesajların yönetimi.",
};

export default function MessagesPage() {
  return <MessagesClient />;
}
