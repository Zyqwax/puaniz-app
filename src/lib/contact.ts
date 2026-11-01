export const CONTACT_TYPES = ["general", "school", "bug", "suggestion"] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  general: "Genel / Görüş",
  school: "Okul & Kurum",
  bug: "Hata Bildirimi",
  suggestion: "Öneri",
};

export interface SubmitContactInput {
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  type: string;
  subject: string;
  message: string;
}

export interface ContactMessageItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  type: string;
  subject: string;
  message: string;
  status: string;
  createdAt: Date;
}
