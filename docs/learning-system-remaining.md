# Gelişim sistemi: kalan işler

Bu belge, birleşik öğrenci/öğretmen/müdür planının henüz tamamlanmamış kısmını listeler. Sınıf değişiklik geçmişi, gerekçeli sonuç aktarımı, öğrenci profili sayfalaması, kişisel konu tekrar önerileri ve hatırlatma komutu tamamlanan kapsam içindedir. Mevcut uygulama özeti için [`learning-system.md`](./learning-system.md) dosyasına bakın.

## 1. Eski gelişim ekranlarını sunucu tarafında sayfala

**Açık kapsam:** `/dashboard/{student,teacher,principal}/progress` çalışma alanı; bütün yetkili öğrencileri, sonuçları ve görevleri topluca yükleyip tarayıcıda filtreliyor. Öğrenci haftalık planı da tüm görev ve görüşme geçmişini yüklüyor.

**Yapılacaklar:**

- Sınıf, öğrenci, tarih aralığı, sınav türü ve kaynak filtrelerini sunucu sorgularına taşı.
- Ortalama, medyan, tarih eğilimi, ders ortalamaları, takip sinyalleri ve CSV dışa aktarmayı seçilen filtrelerle veritabanında hesapla.
- Öğrenci ve görev seçicileri için aramalı, sayfalı sunucu sorguları kullan.
- Haftalık görünüm için sadece seçilen haftanın görevlerini ve görüşmelerini getir; geçmiş listelerini ayrı sayfala.
- Yetki kapsamı ve küçük grup istatistik gizliliğini mevcut raporlarla aynı şekilde koru.

**Tamamlanma ölçütü:** Büyük bir okulda sayfa HTML/RSC yanıtı tüm öğrenci ve sonuç kayıtlarını taşımaz; filtre, sayfa geçişi, CSV ve analizler mevcut davranışla tutarlı kalır. Öğretmen yalnızca atanmış sınıfları, müdür yalnızca kendi okulunu görür.

## 2. Üretim hatırlatma zamanlayıcısını bağla

Hatırlatma iş mantığı [`run-learning-reminders.mjs`](../scripts/run-learning-reminders.mjs) içinde hazırdır; görev/vaka bildirim tercihlerini uygular ve 365 günlük bildirim saklama kuralını çalıştırır. Depoda üretim zamanlayıcısı yapılandırılmadı.

**Gereken karar:** Uygulamanın üretim barındırma ortamı ve zamanlanmış iş yöntemi (Vercel Cron, sunucu cron veya Docker/Kubernetes cron).

**Yapılacaklar:**

- Ortama uygun günlük 07:00 `Europe/Istanbul` zamanlayıcısı kur.
- Zamanlayıcı sırrı/erişimi, tekrar deneme ve çalışma loglarını yapılandır.
- İki kez çalıştırma, kullanıcı tercihi kapalı olma, süresi geçmiş bildirim temizliği ve zaman dilimi sınırlarını üretim benzeri DB'de doğrula.
- E-posta veya push isteniyorsa ayrı sağlayıcı ve abonelik/izin akışını tanımla; mevcut komut yalnızca uygulama içi bildirim üretir.

**Tamamlanma ölçütü:** Dağıtım ortamından günlük iş çalışır, aynı olay çift bildirim üretmez, başarısızlık gözlemlenebilir ve geri denenebilir.

## 3. Soru düzeyinde konu/kazanım analizi için veri kaynağı sağla

Mevcut içe aktarma yalnızca test bazında doğru/yanlış/net toplamı içerir. Soru düzeyinde kazanım analizi veya deneme güçlüklerini karşılaştırma için gerekli kaynak veri yok.

**Gereken veri:** Soru kimliği, sınav/kitapçık kimliği, öğrencinin cevabı, cevap anahtarı, konu/kazanım eşlemesi ve karşılaştırma yapılacak sınav metaverisi. Verinin lisans ve kullanım koşulları da belli olmalı.

**Yapılacaklar:**

- Sağlayıcıdan gelen veri biçimini ve lisanslı kullanım kapsamını belirle.
- Soru, cevap, kazanım ve sınav metaverisi için sürümlü şema ve içe aktarma doğrulaması tasarla.
- Eksik veya eşlemesi belirsiz soruları analiz dışında tut; ham cevaplara kimlerin erişebileceğini sınırla.
- Öğrenciye kendi kazanım özetini; personele sadece yetki ve küçük grup gizliliği uygunsa toplulaştırılmış görünümü sun.
- Farklı zorlukta veya eşdeğerliği doğrulanmamış denemelerin doğrudan karşılaştırılmadığını açıkça belirt.

**Tamamlanma ölçütü:** Veri kalitesi ve yetki testleri geçer; öğrenci/sınıf analizleri yalnızca eşlemesi doğrulanmış soruları kullanır ve kapsam/örneklem bilgisini gösterir.

## 4. Kişisel öğrenme verisi paylaşım onayını tanımla

Kişisel çalışma oturumları ve konu ilerlemesi şu an personele kapalı. Öğrencinin bunları belirli personelle paylaşabileceği bir onay ekranı yok.

**Gereken ürün kararı:** Paylaşılabilecek alanlar (ör. toplam çalışma dakikası, soru sayısı, konu ilerlemesi), alıcı rolü (öğretmen/müdür), kapsam (sınıf/atanmış öğretmen) ve onayın süresi.

**Yapılacaklar:**

- Varsayılanı kapalı tutan açık öğrenci onayı ve kapsam metni ekle.
- Onay, geri çekme, zaman damgası ve politika sürümünü sakla.
- Her personel sorgusunda güncel onayı ve sınıf atamasını tekrar doğrula.
- Önceki bildirimleri, dışa aktarımları ve raporları onay geri çekildiğinde nasıl ele alacağını tanımla.
- Kişisel notları ve sağlık/özel nitelikli bilgileri paylaşım kapsamı dışında bırak.

**Tamamlanma ölçütü:** Onaysız veri personele ulaşmaz; onay geri çekilince sonraki sorgular erişimi anında keser; öğretmen ve müdür kapsamı ayrı ayrı test edilir.

## Önerilen sıra

1. Eski gelişim ekranları ve haftalık plan için sunucu sayfalaması.
2. Üretim ortamı netleşince zamanlanmış hatırlatma kurulumu.
3. Öğrenci verisi paylaşım kapsamı ürün kararı ve onay akışı.
4. Soru düzeyinde analiz, ancak lisanslı/doğrulanmış veri kaynağı geldikten sonra.

## Dış bağımlılıklar

- Zamanlayıcı kurulumu için üretim hosting/cron bilgisi.
- Soru düzeyi analiz için lisanslı cevap anahtarı ve soru-kazanım verisi.
- Kişisel öğrenme verisi paylaşımı için ürünün alan, rol ve süre kapsamı kararı.
