# Puaniz yasal uyum ve yayına hazırlık kontrol listesi

Bu doküman, 1 Kasım 2026 tarihinde kaynak kod ve ürün sahibi yanıtları üzerinden yapılan ön incelemenin operasyonel kontrol listesidir. Hukuki görüş değildir. Puaniz henüz yayında değil; gerçek kullanıcı ve ödeme akışı bulunmadığı bildirildi. Dış servis sözleşmeleri, veri bölgeleri ve saklama ayarları koddan doğrulanamaz.

## Yayına açılmadan önce zorunlu blokajlar

- [x] Veri sorumlusu adı Enes Samed Gözlü olarak teyit edildi ve `/privacy` taslağına yazıldı.
- [ ] Resmi iş/tebligat adresini belirle ve `/privacy` sayfasına ekle. Ürün sahibi bu bilgiyi şimdilik taslak bırakmamızı istedi.
- [ ] Başvuru e-postası `mail@iletisim.puaniz.com.tr` adresinin çalıştığını ve taleplerin takip edildiğini doğrula.
- [ ] Kişisel veri başvuruları için gelen kutusunu sorumlu kişiye ata, başvuru tarihini ve 30 günlük son tarihi kaydet, kimliği ölçülü biçimde doğrula, talebi ücretsiz ve gerekçeli yanıtla; sonucu ve silme/erişim işlemlerini kanıtıyla sakla.
- [ ] Üretim hosting/veritabanı sağlayıcısı ve ülkesini; Resend, Cloudinary ve Groq veri işleme/alt sağlayıcı ve bölgelerini incele. Gerçek aktarım taraflarını aydınlatmaya yaz.
- [ ] Yurt dışına aktarım varsa KVKK m.9 aktarım şartı, uygun güvence/standart sözleşme ve gerekiyorsa beş iş günü içinde Kurum bildirimi tamamlanmadan gerçek kişisel veriyle canlıya geçme.
- [ ] Resend'in 1 Kasım 2026 itibarıyla yayımladığı güvenlik açıklaması, Türkiye KVKK standart sözleşmesini imzalamadığını ve temel işlemenin ABD'de olduğunu belirtiyor. Bu nedenle Resend'le üretime geçmeden önce Türkiye aktarım rejimine uygun bir çözümün hukukçu tarafından doğrulanması veya uygun aktarım güvencesi sağlayabilen e-posta servisine geçilmesi gerekir.
- [ ] Okul sözleşmeleri: okul ve Puaniz rollerini, talimatları, veri kategorilerini, yetkileri, güvenlik, saklama/silme ve ihlal bildirimlerini düzenle. Öğrenci/veli bilgilendirme ve reşit olmayan kullanıcı akışını hukukçu ile değerlendir.
- [ ] Saklama ve imha takvimini (hesap, iletişim mesajı, forum, AI sağlayıcı, yedekler, güvenlik kayıtları) belirle; silme işleminde veritabanı, medya servisi ve yedekleri kapsadığını doğrula.
- [ ] VERBİS yükümlülüğünü çalışan sayısı, bilanço ve ana faaliyet konusu üzerinden değerlendir; istisna varsa dayanağını kaydet.
- [ ] Üretimde çerez/localStorage ve ağ trafiği envanteri çıkar. Kod incelemesinde analitik/reklam etiketi görünmedi; dış konfigürasyon ve gerçek tarayıcı davranışını ayrıca denetle. Yeni zorunlu olmayan izleyici eklenecekse önceden açık rıza/tercih yönetimini uygula.
- [ ] Güvenlik tedbirlerini yazılılaştır: rol bazlı erişim, üretim erişimi, yedekler, olay kaydı, ihlal müdahalesi, tedarikçi erişimi, kullanıcı talepleri.
- [ ] `/privacy`, `/cookies` ve `/terms` içeriklerini gerçek iş akışı ve hukuk incelemesiyle sonlandır. Kullanım koşulları şu an temel taslaktır.

## Ödeme ve pazarlama eklenirken

- [ ] Ücretli abonelik/satış etkinleştirilmeden önce ödeme sağlayıcısı, toplam fiyat/vergi, yenileme/iptal, ön bilgilendirme, mesafeli sözleşme/cayma ve tüketici başvuru akışlarını tamamla. ETBİS gerekliliğini iş modeline göre doğrula.
- [ ] Ticari e-posta/SMS göndermeden önce ayrı, isteğe bağlı izin al; onay/ret kanıtını ve İYS süreçlerini kur. Her ticari iletide kolay ve ücretsiz ret bağlantısı sun, retleri süresinde uygula. Hesap doğrulama ve parola e-postaları işlem iletisi olarak ayrı tutulmalı.
- [ ] Ödeme veya pazarlama üçüncü tarafı eklendiğinde veri envanteri, aydınlatma, aktarım ve saklama belgelerini güncelle.

## Kod incelemesinde görülen veri akışları

- Better Auth kullanıcı, e-posta doğrulama, parola sıfırlama ve oturumları; oturum tablosunda IP ve user-agent alanları mevcut.
- Profil/öğrenci: ad, e-posta, sınıf, alan, hedef üniversite/bölüm/sıralama/net, avatar.
- Eğitim verisi: kişisel ve okul deneme sonuçları, ders netleri, konu ilerleme, çalışma oturumları/görevler/toplantı ve öğretmen notları.
- Topluluk: gönderi, yorum, beğeni, etiket, görsel, moderasyon ve takip verileri.
- İletişim formu: ad, e-posta, isteğe bağlı telefon/kurum, konu/mesaj; veritabanında saklanıyor ve e-posta ile ekibe iletilebiliyor.
- AI asistanı: kullanıcı mesajları Groq API'ye gönderiliyor; sohbet geçmişi tarayıcı localStorage'ında tutuluyor.
- Görsel: profil ve topluluk görselleri Cloudinary'ye yükleniyor.
- E-posta: Resend üzerinden doğrulama, parola sıfırlama ve iletişim alındı bildirimi.
- Tarayıcı: zorunlu oturum çerezleri; tema, sohbet ve taslaklar için localStorage. Kodda analitik/reklam sağlayıcısı bulunmadı.

## Yapılan kod değişiklikleri

- `/privacy`, `/cookies`, `/terms` sayfaları eklendi ve kamu altbilgisine bağlandı.
- Kayıt ekranına aydınlatma metni bağlantısı eklendi; aydınlatma için rıza kutusu konmadı.
- İletişim formu veri kullanımı metni aydınlatma sayfasına bağlandı; doğrulanmamış “KVKK uyumlu” ve “üçüncü taraflarla paylaşılmaz” iddiaları kaldırıldı.
- AI API anahtarı yalnızca sunucu tarafı `GROQ_API_KEY` üzerinden kullanılıyor; `NEXT_PUBLIC_GROQ_API_KEY` fallback kaldırıldı.

