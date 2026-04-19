import NewPostClient from "./NewPostClient";

export const metadata = {
  title: "Yeni Konu Aç | Topluluk",
  description: "Toplulukta yeni bir konu aç, soru sor ve tartış.",
  keywords: ["yeni konu", "soru sor", "yks topluluk", "öğrenci forumu"],
};

export default function NewPostPage() {
  return <NewPostClient />;
}
