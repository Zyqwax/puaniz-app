export const EXAM_CONFIG = {
  TYT: {
    turkce: 40,
    matematik: 30,
    geometri: 10,
    tarih: 5,
    cografya: 5,
    felsefe: 5,
    din: 5,
    fizik: 7,
    kimya: 7,
    biyoloji: 6,
  },
  AYT: {
    matematik: 30,
    geometri: 10,
    fizik: 14,
    kimya: 13,
    biyoloji: 13,
    edebiyat: 24,
    tarih1: 10,
    cografya1: 6,
    tarih2: 11,
    cografya2: 11,
    felsefe: 12,
    din: 6,
  },
} as const;

export type ExamType = keyof typeof EXAM_CONFIG;
export type TYTSubjectKey = keyof typeof EXAM_CONFIG.TYT;
export type AYTSubjectKey = keyof typeof EXAM_CONFIG.AYT;

export const WHITELISTED_EMAILS: string[] = ["test@test.com"];
