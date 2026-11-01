import type { Metadata } from "next";
import AdminClient from "./AdminClient";

export const metadata: Metadata = {
  title: "Sistem Yönetimi - Puaniz",
  description: "Okul ve yetkili hesap yönetimi.",
};

export default function AdminPage() {
  return <AdminClient />;
}
