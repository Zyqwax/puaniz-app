import type { Metadata } from "next";
import SubscriptionClient from "./SubscriptionClient";

export const metadata: Metadata = { title: "Aboneliğim | Puaniz" };

export default function SubscriptionPage() {
  return <SubscriptionClient />;
}
