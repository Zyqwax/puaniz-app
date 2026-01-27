import AssistantClient from "./AssistantClient";

export const metadata = {
  title: "YKS Asistanı",
  description: "YKS sürecinizde size rehberlik edecek yapay zeka destekli asistanınız.",
  keywords: ["yks asistan", "yapay zeka koç", "ai asistan", "sınav danışmanı", "yks rehber"],
};

export default function AssistantPage() {
  return <AssistantClient />;
}
