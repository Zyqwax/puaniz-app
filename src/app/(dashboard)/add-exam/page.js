import AddExamClient from "./AddExamClient";

export const metadata = {
  title: "Deneme Ekle",
  description: "TYT ve AYT deneme sonuçlarınızı sisteme girin, netlerinizi ve puanlarınızı anında hesaplayın.",
  keywords: ["deneme ekle", "tyt deneme", "ayt deneme", "net hesaplama", "sınav girişi"],
};

export default function AddExamPage() {
  return <AddExamClient />;
}
