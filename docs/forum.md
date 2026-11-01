# Puaniz forum

## Kurulum

`npm run db:forum` komutu `.env.local` içindeki PostgreSQL bağlantısını kullanır.
SQL dosyası `scripts/setup-forum.mjs` üzerinden transaction içinde çalıştırılır.
Geçiş tek transaction içinde çalışır; mevcut konuları, yanıtları ve beğenileri korur.
Kategorisi olmayan eski konular `genel` kategorisine atanır. Başlangıç kategorileri
aynı komut tekrar çalıştırıldığında yönetici değişikliklerinin üzerine yazmaz.
Yeni ortamda önce uygulamanın mevcut şeması kurulmalı, ardından forum kurulumu yapılmalıdır.

## Rotalar

- `/dashboard/community`: kategori, arama, etiket, kişisel filtre ve sayfalama.
- `/dashboard/community/new`: taslak destekli Markdown editörü ve görsel yükleme.
- `/dashboard/community/[id]`: kronolojik yanıtlar; `page=-1` ilk okunmamış sayfa,
  `reply=<id>#<id>` belirli yanıta doğrudan bağlantı.
- `/dashboard/admin/community`: bildirimler, kategori yönetimi ve moderasyon geçmişi.

Forum kimliği doğrulanmış ve e-postası onaylanmış hesaplara açıktır. Öğretmen ve okul
müdürü rozetleri moderasyon yetkisi vermez. Yönetim yetkisi mevcut `ADMIN_EMAILS`
kontrolünü kullanır. Forum içinde gösterilen yazar verileri e-posta içermez.

## İşleyiş

Arama PostgreSQL `simple` tam metin indeksiyle bütün konu başlıklarını ve gövdelerini
arar; üye adı ve etiket eşleşmeleri de desteklenir. Sayfalar 20 kayıt içerir.
Son etkinlik, yanıt geldiğinde güncellenir; sabit konular önce gösterilir.
Takip edilen konulardaki yeni yanıtlar, alıntılar ve seçilen çözümler forum içi
bildirim üretir. E-posta veya push bildirimi gönderilmez.

Okuma durumu sayfa gerçekten açıldığında güncellenir; Next.js bağlantı ön yüklemesi
konuları okundu işaretlemez. Yalnızca açılan sayfanın son yanıtına kadar ilerler.
Metin taslağı hesap bazında tarayıcının yerel depolamasında tutulur; görsel dosyası
saklanmaz. Başarılı yayınlamada taslak silinir.

Yanıtlar aynı konuya ait olmalıdır. Başlık, gövde, etiket ve görsel adresi sunucuda
doğrulanır. Gönderimler hesap bazında 10 saniyelik aralıkla sınırlandırılır.
Başkalarının yanıt verdiği konular yazar tarafından silinemez; yönetim gizleyebilir.
Gizlenen içerikler listeden, detaydan, metadatadan ve forum bildirimlerinden çıkarılır.
Silinen çözüm yanıtı, veritabanı ilişkisiyle çözüm alanını otomatik temizler.

## Doğrulama

- `npm run typecheck`
- `npx eslint src/server/actions/forum.ts src/lib/forum.ts src/components/community src/app/dashboard/community src/app/dashboard/admin/community`
- `node --experimental-strip-types scripts/verify-forum.mjs`

Entegrasyon kontrolü gerçek veritabanında benzersiz geçici hesaplar oluşturur ve
sonunda temizler. Yalnızca test sürecinde oturum okuması değiştirilir; gerçek aksiyon,
yetki ve veritabanı kodu çalışır. Canlı kullanıcı oturumlarına müdahale etmez.
