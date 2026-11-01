import type { Metadata } from "next";
import SchoolSubscriptionsClient from "./SchoolSubscriptionsClient";

export const metadata: Metadata = { title: "Kurum Lisansları | Puaniz" };

export default function SchoolSubscriptionsPage() {
  return <SchoolSubscriptionsClient />;
}
