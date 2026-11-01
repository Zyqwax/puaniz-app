"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { contactMessages } from "@/server/db/schema";
import { getSession } from "@/server/session";
import { requireSuperAdmin } from "@/server/school-auth";
import { sendContactAcknowledgement, sendContactNotification } from "@/server/email";
import { toMessage } from "@/server/errors";
import {
  CONTACT_TYPES,
  CONTACT_TYPE_LABELS,
  type ContactType,
  type SubmitContactInput,
  type ContactMessageItem,
} from "@/lib/contact";

// ponytail: in-memory throttle — per-process only. Move to Redis/DB when the
// app runs on more than one instance.
const recentByEmail = new Map<string, number>();
const MIN_INTERVAL_MS = 60_000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function submitContactMessage(
  input: SubmitContactInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const name = input.name?.trim().slice(0, 120) ?? "";
    const email = input.email?.trim().toLowerCase().slice(0, 200) ?? "";
    const subject = input.subject?.trim().slice(0, 200) ?? "";
    const message = input.message?.trim().slice(0, 5000) ?? "";
    const phone = input.phone?.trim().slice(0, 30) || null;
    const organization = input.organization?.trim().slice(0, 200) || null;

    if (name.length < 2) return { success: false, error: "Lütfen adınızı girin." };
    if (!EMAIL_RE.test(email)) return { success: false, error: "Geçerli bir e-posta adresi girin." };
    if (subject.length < 3) return { success: false, error: "Lütfen bir konu yazın." };
    if (message.length < 10) {
      return { success: false, error: "Mesajınız en az 10 karakter olmalı." };
    }

    const type: ContactType = (CONTACT_TYPES as readonly string[]).includes(input.type)
      ? (input.type as ContactType)
      : "general";

    const last = recentByEmail.get(email);
    if (last && Date.now() - last < MIN_INTERVAL_MS) {
      return { success: false, error: "Çok sık mesaj gönderdiniz. Lütfen biraz bekleyin." };
    }

    const session = await getSession();

    await db.insert(contactMessages).values({
      name,
      email,
      phone,
      organization,
      type,
      subject,
      message,
      userId: session?.user.id ?? null,
    });

    recentByEmail.set(email, Date.now());

    const inbox = process.env.CONTACT_INBOX ?? "iletisim@puaniz.com.tr";
    const typeLabel = CONTACT_TYPE_LABELS[type];

    // Mail failures must not lose the stored message.
    try {
      await sendContactNotification({
        to: inbox,
        name,
        email,
        organization,
        type: typeLabel,
        subject,
        message,
      });
      await sendContactAcknowledgement({ to: email, name });
    } catch (mailErr) {
      console.error("contact mail error:", mailErr);
    }

    return { success: true };
  } catch (err) {
    console.error("submitContactMessage error:", err);
    return { success: false, error: toMessage(err) };
  }
}

export async function getContactMessages(): Promise<ContactMessageItem[]> {
  try {
    await requireSuperAdmin();
    return await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt))
      .limit(200);
  } catch (err) {
    console.error("getContactMessages error:", err);
    return [];
  }
}

export async function updateContactMessageStatus(
  id: string,
  status: "new" | "read" | "replied" | "archived",
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireSuperAdmin();
    await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id));
    return { success: true };
  } catch (err) {
    console.error("updateContactMessageStatus error:", err);
    return { success: false, error: toMessage(err) };
  }
}
