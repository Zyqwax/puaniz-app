import type { Metadata } from "next";
import InstitutionSubscriptionClient from "./InstitutionSubscriptionClient";

export const metadata: Metadata = {
  title: "Okul Aboneliği | Puaniz",
  description: "Okulunuzun plan, lisans dönemi ve kontenjan bilgileri.",
};

export default function PrincipalSubscriptionPage() {
  return <InstitutionSubscriptionClient />;
}
