# Puaniz

YKS (TYT/AYT) deneme takibi, analiz ve topluluk platformu.

Next.js 16 (App Router) · PostgreSQL + Drizzle ORM · Better Auth · Tailwind v4

## Kurulum

```bash
pnpm install
cp .env.local.example .env.local   # yoksa: aşağıdaki değişkenleri doldur
pnpm db:migrate                    # şemayı uygula
pnpm db:seed                       # (opsiyonel) doğrulanmış test kullanıcısı
pnpm dev
```

Uygulama http://localhost:3000 adresinde açılır.

## Ortam değişkenleri

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | PostgreSQL bağlantı adresi |
| `BETTER_AUTH_SECRET` | Oturum imzalama anahtarı (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` | Uygulamanın kök adresi |
| `RESEND_API_KEY` | Doğrulama / şifre sıfırlama e-postaları. Boşsa bağlantılar sunucu konsoluna yazılır. |
| `EMAIL_FROM` | Gönderen adresi, örn. `"Puaniz <no-reply@puaniz.com.tr>"` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Görsel yükleme |
| `GROQ_API_KEY` | AI asistanı (sunucu tarafında) |

## Komutlar

| Komut | Açıklama |
|---|---|
| `pnpm dev` | Geliştirme sunucusu |
| `pnpm build` / `pnpm start` | Üretim derlemesi / sunucusu |
| `pnpm typecheck` | TypeScript kontrolü |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Şema değişikliğinden migration üret |
| `pnpm db:migrate` | Migration'ları uygula |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm db:seed` | Doğrulanmış test kullanıcısı oluştur |

## Mimari

```
İstemci bileşeni
   └─> src/server/actions/*   ("use server" — kullanıcı kimliği oturumdan gelir)
          └─> Drizzle ─> PostgreSQL

src/proxy.ts                  → /dashboard ↔ /auth yönlendirmesi (optimistik)
src/app/api/auth/[...all]     → Better Auth handler
```

- **Kimlik doğrulama:** Better Auth, e-posta + şifre, doğrulama zorunlu.
  `src/server/session.ts` içindeki `requireUser()` her server action'da çalışır;
  istemci hiçbir zaman `userId` göndermez.
- **Veri erişimi:** yalnızca sunucu actions üzerinden. Her sorgu
  `where(user_id = oturum.userId)` ile sahiplik kontrolü yapar.
- **Şema:** `src/server/db/auth-schema.ts` (Better Auth tabloları) ve
  `src/server/db/schema.ts` (uygulama tabloları). Hesap silme, FK cascade ile
  tüm veriyi temizler.
- **Görseller:** Cloudinary (istemcide boyutlandırma + unsigned upload).

## Yapı

```
src/
├─ app/            App Router sayfaları (public, auth, dashboard)
├─ components/     UI bileşenleri
├─ context/        Auth & tema sağlayıcıları
├─ data/           Statik ders/konu kataloğu
├─ lib/            auth-client, saf yardımcılar
├─ server/
│  ├─ actions/     Server actions (exam, profile, subject, community, ai)
│  ├─ db/          Drizzle istemcisi + şemalar
│  ├─ queries/     Server component okumaları
│  ├─ auth.ts      Better Auth yapılandırması
│  ├─ email.ts     Resend şablonları
│  └─ session.ts   Oturum yardımcıları
├─ services/       Cloudinary istemcisi
├─ types/          Paylaşılan tipler
└─ utils/          Analiz / PDF yardımcıları
```
