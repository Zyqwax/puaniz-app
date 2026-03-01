import SubjectTrackerClient from "./SubjectTrackerClient";

export const metadata = {
  title: "Konu Takip",
  description: "TYT ve AYT konularını takip edin, çalıştığınız konuları işaretleyin ve ilerlemenizi görün.",
  keywords: ["konu takip", "tyt konuları", "ayt konuları", "yks planlama", "çalışma planı"],
};

export default function SubjectsPage() {
  return <SubjectTrackerClient />;
}
