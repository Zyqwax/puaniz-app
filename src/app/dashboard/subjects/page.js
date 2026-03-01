import SubjectTrackerClient from "./SubjectTrackerClient";

export const metadata = {
  title: "Konu Takip Çizelgesi",
  description:
    "TYT ve AYT konularını takip edin, çözdüğünüz soru sayısını kaydedin ve tekrar sayınızı izleyin.",
  keywords: [
    "konu takip",
    "tyt konuları",
    "ayt konuları",
    "yks planlama",
    "çalışma planı",
    "soru takip",
    "tekrar takip",
  ],
};

export default function SubjectsPage() {
  return <SubjectTrackerClient />;
}
