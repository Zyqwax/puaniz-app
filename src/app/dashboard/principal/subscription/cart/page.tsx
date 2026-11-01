import type { Metadata } from "next";
import InstitutionSubscriptionCart from "./InstitutionSubscriptionCart";

export const metadata: Metadata = {
  title: "Kurum lisansı sepeti | Puaniz",
  description: "Okul lisans teklifini inceleyip başlatın.",
};

export default function InstitutionSubscriptionCartPage() {
  return <InstitutionSubscriptionCart />;
}
