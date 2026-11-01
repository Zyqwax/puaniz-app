export const SCHOOL_PLANS = {
  "institution-basic": {
    name: "Kurum Temel",
    version: 1,
    description: "Okul, sınıf, deneme girişi ve temel öğrenci raporları.",
    features: [
      "Okul ve sınıf çalışma alanları",
      "Toplu deneme sonucu aktarımı",
      "Öğrenci deneme geçmişi",
      "Temel sınıf raporları",
    ],
  },
  "institution-growth": {
    name: "Kurum Gelişim",
    version: 1,
    description: "Öğretmen takibi, öğrenme görevleri ve gelişim raporları.",
    features: [
      "Kurum Temel özelliklerinin tümü",
      "Öğretmen ve sınıf atamaları",
      "Öğrenme görevleri ve görüşme kayıtları",
      "Gelişim bildirimleri ve dönem raporları",
    ],
  },
} as const;

export type SchoolPlanKey = keyof typeof SCHOOL_PLANS;

export function isSchoolPlanKey(value: string): value is SchoolPlanKey {
  return Object.hasOwn(SCHOOL_PLANS, value);
}
