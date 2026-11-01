import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Puaniz <no-reply@puaniz.com.tr>";

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

async function send({ to, subject, html, text }: SendArgs) {
  if (!resend) {
    // No provider configured (local development): surface the link in the
    // server log so the verification/reset flow can still be exercised.
    console.warn(
      `[email] RESEND_API_KEY is not set — skipping send to ${to}\nSubject: ${subject}\n${text}`,
    );
    return;
  }

  const { error } = await resend.emails.send({ from: EMAIL_FROM, to, subject, html, text });
  if (error) {
    console.error("[email] Resend error:", error);
    throw new Error("E-posta gönderilemedi.");
  }
}

const layout = (heading: string, body: string, cta: string, url: string) => `
<div style="font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;background:#f5f7fb;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:24px;padding:36px 32px;border:1px solid #e5e9f2">
    <div style="font-size:22px;font-weight:800;color:#0F2A5C;margin-bottom:24px">
      puan<span style="color:#2F6BFF">iz</span>
    </div>
    <h1 style="font-size:20px;font-weight:800;color:#0F2A5C;margin:0 0 12px">${heading}</h1>
    <p style="font-size:14px;line-height:1.7;color:#4a5468;margin:0 0 28px">${body}</p>
    <a href="${url}" style="display:inline-block;background:#2F6BFF;color:#ffffff;font-weight:700;font-size:14px;padding:13px 26px;border-radius:14px;text-decoration:none">${cta}</a>
    <p style="font-size:12px;line-height:1.6;color:#8a93a6;margin:28px 0 0">
      Bağlantı çalışmıyorsa şu adresi tarayıcına yapıştır:<br />
      <span style="word-break:break-all;color:#2F6BFF">${url}</span>
    </p>
  </div>
</div>`;

export async function sendVerificationEmail({ to, url }: { to: string; url: string }) {
  await send({
    to,
    subject: "Puaniz — E-posta adresini doğrula",
    html: layout(
      "E-posta adresini doğrula",
      "Puaniz hesabını kullanmaya başlamak için aşağıdaki bağlantıya tıkla. Bağlantı 1 saat geçerlidir.",
      "E-postamı Doğrula",
      url,
    ),
    text: `Puaniz hesabını doğrulamak için: ${url}`,
  });
}

export async function sendPasswordResetEmail({ to, url }: { to: string; url: string }) {
  await send({
    to,
    subject: "Puaniz — Şifre sıfırlama",
    html: layout(
      "Şifreni sıfırla",
      "Şifre sıfırlama talebinde bulundun. Yeni bir şifre belirlemek için aşağıdaki bağlantıya tıkla. Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin.",
      "Şifremi Sıfırla",
      url,
    ),
    text: `Puaniz şifreni sıfırlamak için: ${url}`,
  });
}

/** Contact form: internal notification to the Puaniz team inbox. */
export async function sendContactNotification({
  to,
  name,
  email,
  organization,
  type,
  subject,
  message,
}: {
  to: string;
  name: string;
  email: string;
  organization?: string | null;
  type: string;
  subject: string;
  message: string;
}) {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;font-size:13px;color:#8a93a6;width:130px">${label}</td><td style="padding:6px 0;font-size:13px;color:#0F2A5C;font-weight:600">${esc(value)}</td></tr>`;

  await send({
    to,
    subject: `[Puaniz İletişim] ${type} — ${subject}`,
    html: `
<div style="font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;background:#f5f7fb;padding:32px 16px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid #e5e9f2">
    <div style="font-size:20px;font-weight:800;color:#0F2A5C;margin-bottom:20px">puan<span style="color:#2F6BFF">iz</span> · Yeni İletişim Formu</div>
    <table style="width:100%;border-collapse:collapse">
      ${row("Tür", type)}
      ${row("Ad Soyad", name)}
      ${row("E-posta", email)}
      ${organization ? row("Kurum", organization) : ""}
      ${row("Konu", subject)}
    </table>
    <div style="margin-top:16px;padding:16px;border-radius:14px;background:#f5f7fb;font-size:14px;line-height:1.7;color:#4a5468;white-space:pre-wrap">${esc(message)}</div>
  </div>
</div>`,
    text: `Tür: ${type}\nAd: ${name}\nE-posta: ${email}\nKurum: ${organization ?? "-"}\nKonu: ${subject}\n\n${message}`,
  });
}

/** Contact form: acknowledgement copy for the sender. */
export async function sendContactAcknowledgement({ to, name }: { to: string; name: string }) {
  await send({
    to,
    subject: "Puaniz — Mesajınızı aldık",
    html: layout(
      "Mesajınız bize ulaştı",
      `Merhaba ${name.replace(/[<>&]/g, "")}, mesajın için teşekkürler. Ekibimiz en geç 2 iş günü içinde e-posta ile dönüş yapacak. Kurumsal taleplerde demo bağlantısı ve fiyatlandırma bilgisi de iletilir.`,
      "Puaniz'i Keşfet",
      "https://www.puaniz.com.tr",
    ),
    text: `Merhaba ${name}, mesajını aldık. En geç 2 iş günü içinde dönüş yapacağız.`,
  });
}
