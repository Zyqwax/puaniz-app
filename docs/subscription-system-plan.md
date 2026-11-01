# Puaniz abonelik ve kurum lisansı sistemi — ürün ve uygulama planı

Durum: bireysel pilot uygulanmış; kurum K0–K2 akışı kodlandı, `0002`–`0004` migration bekliyor · 1 Kasım 2026  
Kapsam: Bireysel Premium hediyesi ile ayrı kurumsal lisans ve abonelik yapısının ürünleştirilmesi. Gerçek ödeme altyapısı ve para tahsilatı bu fazda yoktur.  
Not: Bu belge hukuki görüş değildir. Tüketiciye ücretli satış başlamadan önce sözleşmeler ve akış, Türkiye tüketici hukuku konusunda uzman hukukçu tarafından incelenmelidir.

## 1. Mevcut durum ve kararlar

- `/pricing` şu an demo fiyatlandırma gösteriyor: öğrenci Premium 49 TL/ay, ayrıca okullara kişi başı fiyatlar. Bunlar uygulamada abonelik ya da ödeme ile bağlı değil. Okul özelliklerinde API ve SLA gibi kodda teyit edilmeyen vaatler de bulunuyor.
- Öğrenci ürününde deneme kaydı, temel analiz/grafikler, AI asistanı, ders/konu ilerlemesi, çalışma planı ve raporlar var. Premium sınırları henüz sunucu tarafında uygulanmıyor.
- Bu fazda yalnızca öğrenci planı yapılmalı. Okul paketleri, okul sözleşmeleri ve öğrenci verilerinin kurumsal satın alımı ayrı ürün kapsamı ve fiyatlandırma gerektiriyor.
- Fiyat kesinleşene kadar mevcut 49 TL/ay ve okul fiyatları satış fiyatı gibi sunulmamalı. Ya kaldırılmalı ya da açıkça “taslak / satın alınamaz” olarak işaretlenmeli.
- Ödeme sağlayıcısı olmadan ücret tahsilatı yapılamaz. Dolayısıyla ücretli planı “Satın al” deyince ödeme yokken aktif etmek, kullanıcıya karşı yanıltıcı olur. Pilot aşamasında buton “Planı etkinleştir” olmalı ve plan 0 TL/ücretsiz pilot ya da yönetici tarafından verilmiş erişim olarak açıkça tarif edilmelidir. Daha önce belirtilen “satın al” metni ancak gerçek ücret/ödeme yokluğu açıkça gösterilen test ortamında kullanılmalıdır.

## 2. Önerilen planlar ve kapsam

Başlangıçta iki bireysel planla ilerleyin; fiyatlar ürün sahibinin maliyet ve hedef kitlesi kararından sonra girilecek parametrelerdir.

| Plan | Önerilen kapsam | Fiyat durumu |
|---|---|---|
| Ücretsiz | Deneme kaydı, temel net analizi ve grafikler, topluluk, çalışma/konu takibi. AI günlük kotası ancak sunucu tarafında uygulanırsa gösterilsin. | 0 TL |
| Premium | Ücretsiz planın tümü; ayrıntılı ders ve gelişim analizleri, PDF raporları, hedef takibi ve AI için açıkça tanımlanmış adil kullanım kotası. | Karar bekliyor; aylık fiyatı KDV dâhil nihai tutar olarak belirleyin. Yıllık planı ancak gerçek tasarruf ve iptal koşulları belirlenince ekleyin. |

Her plan özelliği için bir hak anahtarı, sunucu tarafında kontrol noktası, kota/limit, kullanıcıya gösterilen açıklama ve davranış testi tanımlanmalı. Özellik listesi kodda gerçekten çalışan davranışı tarif etmeli; “sınırsız AI” gibi maliyeti sınırsızlaştıran ifadelerden kaçının. Premium olmayan kullanıcıya mevcut verisini kaybettirmeyin: abonelik bitince yalnızca Premium oluşturma/erişim hakları kapanmalı, geçmiş kayıtlar korunmalı ve dışa aktarma/silme akışı açık kalmalı.

## 3. Sepet, onay ve aboneliğin başlatılması

Ödeme altyapısı eklenmeden pilot akışı:

1. `/pricing` planı ve kapsamı gösterir; kullanıcı “Sepete ekle” ile seçimi saklar.
2. Sepet/ön bilgilendirme ekranı plan adını, erişim süresini, başlangıç ve bitiş tarihini, 0 TL tutarı, otomatik yenileme olmadığını ve bunun ödeme alınmayan pilot olduğunu açıkça gösterir.
3. Kullanıcı sözleşme ve bilgilendirme metinlerini okuyabilir/indirebilir. Hizmetin başlatılması için gerekli onaylar ayrı, önceden seçilmemiş kutularla alınır; pazarlama izni satın alma şartı yapılmaz.
4. Son işlem düğmesi gerçeğe uygun biçimde “Ücretsiz pilotu etkinleştir” der. Sunucu oturumu doğrular, geçerli plan sürümünü tekrar okur, idempotent bir aktivasyon kaydı oluşturur ve kullanıcıya kalıcı veri saklayıcısı üzerinden onay/abonelik özeti verir.
5. Abonelik başlar; pilot bitişinde kendiliğinden ücretsiz plana döner, yenilenmez ve ücret doğurmaz. Uzatma yalnızca kullanıcının yeniden açık eylemiyle olur.

Gerçek ücretli satış fazında sepet özeti ve son buton; KDV dâhil toplam tahsil edilecek tutarı, dönem/yenileme düzenini ve zorunlu diğer koşulları siparişten hemen önce görünür verir. Kullanılan sipariş düğmesi, ödeme yükümlülüğünü açıkça anlatmalıdır (örn. “Ödeme yükümlülüğüyle sipariş ver”). Ödeme kuruluşu sonucu gelmeden abonelik `active` yapılmamalı; sağlayıcı web kancası imzalı, tekrara dayanıklı ve denetlenebilir olmalıdır.

## 4. Hesap, iptal ve erişim kuralları

Hesap ayarlarında “Aboneliğim” alanı bulunmalı: plan, durum, başlangıç/bitiş, satın alma/aktivasyon referansı, geçerli koşullar ve erişilebilir sözleşme kopyası. İptal başlatma akışı kolay bulunmalı, çevrim içi edinilmiş abonelik çevrim içi sonlandırılabilmeli; telefonla iptale zorlanmamalı.

Pilot için iptal kullanıcı isteğiyle hemen uygulanır veya kullanıcıya seçilebilir net bitiş gösterilir; hiçbir durumda ücret/yenileme oluşmaz. Gerçek ücretli dönemde iptal talebi anında kayda alınır ve mevzuat süresini beklemeden uygulanacak operasyon kurulur. Kullanıcıya talep alındı ve tamamlandı teyidi kalıcı veri saklayıcısıyla gönderilir. Ön ödemeli dönem sonuna kadar erişimin sürüp sürmeyeceği ticari koşullarda önceden belirlenip ekranda açıkça belirtilir; bu bir ürün kararıdır.

Cayma talebi ile gelecekteki yenilemeyi kapatan iptal birbirinden ayrı ama anlaşılır biçimde sunulmalı. Mesafeli satışta uygulanacak cayma hakkı, dijital hizmetin anında ifası istisnası ve gereken açık onaylar sipariş türüne göre hukukçu tarafından doğrulanmalı; genel bir “iade yoktur” hükmü konmamalı. Cayma/iadeye ilişkin tutarlar ve işlem süreleri satıcı yükümlülükleriyle uyumlu olmalı.

## 5. Veri modeli ve yetkilendirme tasarımı

Yeni tabloları `src/server/db/schema.ts` içinde tasarlayın; kullanıcı kimliği `users` tablosuna bağlansın:

- `subscription_plans`: kalıcı plan anahtarı, ad, sürüm, fiyat (kuruş cinsinden), para birimi, dönem, özellik/limit JSON'u, etkinlik ve geçerlilik aralığı.
- `subscriptions`: kullanıcı, plan ve plan sürümü, durum (`pending`, `active`, `cancelled`, `expired`, ileride `past_due`), başlangıç/bitiş, yenileme politikası, iptal talep/zamanı, kaynak (pilot/ödeme/manuel), kayıt zamanları.
- `subscription_events` veya eşdeğer denetim kaydı: aktivasyon, iptal, süre sonu, plan değişikliği, kullanıcı aksiyonu, gerekçe ve ilişkilendirilmiş sözleşme/koşul sürümü. Kart verisi veya hassas ödeme sırrı tutulmamalı.
- `subscription_acceptances`: gerekli sözleşme ve ön bilgilendirme sürümü, metin özeti/hash, kullanıcı, zaman ve ilgili abonelik. Aydınlatma metni gösterilmesi açık rıza/onay yerine kullanılmamalı.

Yetki kararı tek bir sunucu tarafı `getEntitlements(userId)` katmanından geçmeli. İstemci butonlarını gizlemek erişim kontrolü sayılmaz. Her AI, PDF, hedef raporu ve ücretli özellik endpoint'i bu hakkı doğrulamalı; kullanıcı başına kota ve kötüye kullanım limiti uygulanmalı. Abonelik değişiklikleri transaction/idempotency ile işlenmeli, tüm tarih/saatler UTC saklanıp Türkiye saatinde gösterilmeli.

## 6. Yönetmelik ve uyum kontrol noktaları (Türkiye)

- Satış öncesi: sağlayıcı/satıcı unvanı ve iletişim/adres bilgisi, hizmetin temel nitelikleri, KDV dâhil toplam fiyat, dönem/yenileme, teslim/erişim zamanı, iptal/cayma/iade yöntemi, şikâyet ve başvuru kanalı ile sözleşme metinleri tamamlanmalı. Kullanıcı siparişten önce bilgileri okuyup saklayabilmeli.
- Abonelik: 6502 sayılı Kanun ve Abonelik Sözleşmeleri Yönetmeliği kapsamı hukukçu tarafından belirlenmeli. Bakanlık rehberi, abonelik iptal başvurularının çevrim içi yapılabilmesini ve fesih taleplerinin yedi gün içinde yerine getirilmesini belirtiyor. Sistem talebi anında kaydetmeli; bu yasal üst süreye bırakılmamalı. Sözleşme ve tarife bilgisi kalıcı veri saklayıcısıyla erişilebilir olmalı.
- Cayma: Mesafeli Sözleşmeler Yönetmeliği ve dijital içerik/hizmet istisnaları satın alınan ürünün niteliğine göre ayrı değerlendirilmeli. İstisna varsayılarak cayma hakkı kaldırılmamalı; cayma hakkında bilgilendirme ispatı ve gerekli ayrı açık onaylar saklanmalı.
- Pazarlama: ticari ileti izni abonelikten ayrı, isteğe bağlı olmalı; İYS ve ret süreçleri satış/pazarlama iletişimi başlatılmadan kurulmalı. İşlemsel abonelik bildirimi pazarlama metniyle birleştirilmemeli.
- KVKK: abonelik/satın alma verilerinin amaç, hukuki sebep, alıcı grubu, saklama süresi ve yurt dışı aktarımını mevcut aydınlatmaya ekleyin. Ödeme sağlayıcısı eklenince sağlayıcı/alt işleyen, veri bölgesi ve KVKK m.9 aktarım mekanizmasını doğrulayın. Muhasebe/vergisel saklama için gereken kayıtları hesap silme ile otomatik silmeyin; saklama takvimi ve erişim sınırı belirleyin.
- ETBİS, e-arşiv/fatura, vergi ve ticari unvan/işletme yükümlülükleri iş modeline göre mali müşavir ve hukukçu ile teyit edilmeden ücretli satış açılmamalı.
- `docs/compliance-launch-checklist.md` dosyasındaki açık işletmeci adresi, tedarikçi aktarımı, okul/reşit olmayan kullanıcı ve iletişim e-postası aksiyonları abonelik satışından bağımsız olarak çözülmeli.

## 7. Ekranlar

1. Fiyatlandırma: plan karşılaştırma, özellik limitleri, nihai fiyat, dönem, yenileme ve kimler için uygun olduğu.
2. Sepet/ön bilgilendirme: seçilen plan, bütün fiyatlar ve koşullar, onaylar, son işlem düğmesi.
3. Sonuç: abonelik özeti ve sözleşme kopyası bağlantısı; ödeme fazında başarılı/başarısız/işlem bekliyor durumları.
4. Aboneliğim: aktif/pilot/iptal bekliyor/süresi dolmuş durumları, tarihler, koşullar, iptal/yeniden başlatma ve destek yolu.
5. İptal: etkili tarih, erişim etkisi, varsa cayma/ücret iadesi talep seçeneği, son onay ve takip edilebilir kayıt.

## 8. Aşamalar

**Faz 0 — Ürün ve hukuk kararları:** gerçek Premium hakları/kotaları, hedef kullanıcı ve yaş kapsamı, fiyat ve vergi gösterimi, pilotun ücretsiz mi yoksa satışa hazır abonelik mi olduğu, koşul/sözleşme metinleri, işletmeci ve vergi/ETBİS yükümlülükleri.

**Faz 1 — Ödeme almayan pilot (uygulandı, yerel veritabanına migration gerekir):** fiyat sayfasındaki doğrulanmamış okul vaatlerini kaldır; bireysel 30 günlük ücretsiz ve tek seferlik pilot; plan seçimi ve özet; abonelik kaydı, sunucu tarafı hak kontrolü, durum/tarih ve self-service iptal. Ücretsiz ve yenilemesiz olduğu her adımda görünür olsun. Uygulama: `/pricing`, `/dashboard/subscription`, `subscriptions` tablosu ve `0001_individual_subscription_pilot.sql`. Ücretli okul planları hâlâ devre dışı.

**Faz 2 — Ücretli satış hazırlığı:** ödeme sağlayıcısı seçimi, test ortamı, sipariş/ödeme durumu ve webhook işleme, fatura/iadeler, ücretli sözleşme/ön bilgilendirme, gerçek iptal-cayma ve tüketici destek operasyonu, KVKK/ETBİS/vergi değerlendirmeleri.

**Faz 3 — Ücretli satış açılışı:** uçtan uca kontrol ve hukuk/mali müşavir onayı; ancak bunlar tamamlandıktan sonra gerçek fiyat ve satın alma düğmesini etkinleştir.

## 9. Kabul ölçütleri

- Kullanıcı fiyatı, planın ne sağladığını, dönemini, toplam tutarı ve yenileme biçimini eylem öncesinde görebilir.
- Bu fazda hiçbir ekran ücret tahsil edildiği izlenimi vermez; pilot 0 TL, yenilemesiz ve başlangıç/bitiş tarihli olur.
- Abonelik hakkı sunucu tarafında doğrulanır; doğrudan API çağrısı ile Premium özellik kullanılamaz.
- Kullanıcı hesabından iptal edebilir ve talep teyidini alır; tekrarlanan istek ikinci abonelik veya ikinci iptal olayı üretmez.
- Plan koşulu ve kullanıcı onayı tarih/sürüm ile ispatlanabilir; kullanıcı sözleşme özetine tekrar erişebilir.
- Süre bitiminde erişim planlanan kurala göre kapanır, kullanıcı verileri korunur ve bildirim yapılır.
- Sonraki ücretli fazda ödeme başarısızlığı, tekrarlı webhook, iptal, cayma/iade ve tutarsız ödeme durumları senaryoları ödeme açılmadan önce doğrulanır.

## 10. Kurumsal abonelik ve “Aboneliğim” ekranı

### Bugünkü veri ve ürün sınırı

- Uygulamada `schools`, `classes`, `school_members`, öğretmen-sınıf atamaları, okul sınavları/sonuçları ve okul denetim kaydı bulunuyor. Bunlar kurumsal çalışma alanı ve erişim modelidir; tek başlarına okulun ücretli lisansı olduğunu göstermez.
- Yeni `subscriptions` tablosu bireysel kullanıcıya bağlıdır. Kurum sözleşmesini bu tabloya kullanıcı adına yazarak ya da `school_members.role` alanını abonelik durumu gibi kullanarak modellemeyin.
- Bu nedenle “Aboneliğim” ekranı önce kullanıcı bağlamını ayırmalı: kuruma bağlı kullanıcı kurum erişim kartı görür; yalnızca bireysel üyeliği varsa bireysel kartı görür. İki kayıt gerçekten varsa ikisi ayrı kartlarda gösterilir.
- Bugün hiçbir kurumsal lisans kaydı yoksa ekranda “Kurum erişimi: [okul adı] · [rol] · lisans bilgisi kurum yöneticisiyle teyit edilecek” denmeli. Veritabanında olmayan paket adı, bitiş tarihi, koltuk veya ödeme bilgisi uydurulmamalı.

### Ekran davranışı

| Oturumdaki kullanıcı | Gösterilecek kurum detayları | İşlemler |
|---|---|---|
| Öğrenci | Okul adı, sınıf/kademe, kurumun sağladığı özellikler, kurum lisansının başlangıç/bitiş veya “süre belirtilmedi” durumu, okul yöneticisine ulaşma yolu. Fatura ve sözleşme yalnızca kullanıcıya gösterilmesi kararlaştırıldıysa. | Öğrenci bireysel Premium hediyesini görmez/kullanmaz; okul üyeliğini kendi başına iptal etmez. |
| Öğretmen | Okul adı, öğretmen rolü, atanmış sınıflar ve kurum lisansının öğretmen kapsamındaki özellikleri. | Plan değişikliği ve fatura görme yok; kurum yöneticisine yönlendirme. |
| Okul yöneticisi | Okul, plan/lisans adı ve sürümü, durum, dönem, öğrenci kontenjanı/kullanımı, dahil özellikler, sözleşme referansı, yenileme/sona erme, iletişim ve (ücretli fazda) fatura/ödeme özeti. | Ödeme almayan ilk aşamada “Teklif/kurum lisansı talep et”, sözleşme ve kullanım özetini indir; ücretli fazda rol yetkisine bağlı plan yönetimi ve fesih talebi. |
| Birden fazla okul üyeliği olan kullanıcı | Her okul için ayrı kurum kartı; plan/rol/özellikleri birleştirme yok. | İşlem yalnızca seçili okul için ve o okulda yetkili rolde. |

Mevcut `getSchoolMembership(userId)` ilk üyeliği döndürüyor. Kurumsal abonelik ekranına geçmeden önce `getSchoolMemberships(userId)` biçiminde çoklu üyelik sorgusu eklenmeli veya ürün kararı olarak kullanıcı başına tek kurum üyeliği veritabanı kısıtıyla güvence altına alınmalı. Kurum lisansını yetkisiz bir “ilk satıra” bağlamak doğru değil.

### Kurum paketleri için ürün taslağı

Önce gerçek ürün özelliklerini kapsayan, fiyatı ürün sahibi/mali müşavir tarafından ayrıca belirlenecek iki paket kurgulayın:

| Paket | Önerilen kapsama giren mevcut özellikler | Henüz vaat edilmemesi gerekenler |
|---|---|---|
| **Kurum Temel** | Okul, sınıf ve kullanıcı üyeliği; toplu CSV deneme sonucu girişi; öğrenci ve okul deneme ekranları; temel sınıf/öğrenci raporu. | API, SSO, özel entegrasyon, SLA ve sınırsız kullanım. |
| **Kurum Gelişim** | Temel kapsamın tümü; öğretmen-sınıf ataması; çalışma görevleri ve görüşme notları; gelişim bildirimleri; gelişmiş dönem raporu ve dışa aktarma. | Kod ve operasyonla hazır olduğu doğrulanmamış API, özel entegrasyon veya garantili yanıt süresi. |

Kurumsal fiyat için ilk öneri: **aktif öğrenci koltuğu başına dönemlik lisans**, öğretmen/yönetici hesapları dahil. Sipariş öncesi minimum öğrenci sayısı, kontenjan aşımı, dönem (aylık/yıllık), yenileme ve iade/fesih koşulları kararlaştırılmalı. Şu anki demo `29/19 TL` rakamları veya paket kademeleri gerçek fiyat kabul edilmemeli. Kurumlar faturayla/teklif üzerinden başlayabileceğinden self-service kartlı ödeme, ilk kurumsal sürümün zorunlu kapsamı değildir.

### Sunucu ve veritabanı altyapısı

Kurum lisansı okul sahibine bağlanmalı; okul çalışanına veya tek öğrenciye değil:

- `school_plans`: plan kodu/sürümü, plan açıklaması, hak/limit kümesi, satılabilirlik ve geçerlilik aralığı. Fiyat ve vergi yapılandırması ayrıca sürümlenebilir olmalı.
- `school_subscriptions`: `school_id`, plan ve sürüm, `draft/active/suspended/cancelled/expired` durumu, kaynak (`manual/contract/payment`), başlangıç/bitiş, yenileme politikası, kontenjan, sözleşme sürümü/ref’i, oluşturma ve iptal kayıtları.
- `school_subscription_events`: teklif gönderme, sözleşme kabulü, aktivasyon, kontenjan değişikliği, askıya alma, iptal/fesih gibi değişmez denetim olayları; yapan kişi, zaman ve gerekçe.
- `school_billing_profiles` (ücretli faz): fatura unvanı ve vergi bilgileri, fatura adresi, finans iletişim kişisi. Öğrenci/öğretmen görünümüne açılmamalı; saklama ve erişim kuralları ayrı olmalı.
- Kontenjan kullanımı ilk sürümde aynı okulun aktif `student` üyeliklerinden transaction içinde hesaplanmalı. Eşzamanlı toplu içe aktarmada limit aşımını önleyen kilit/kısıt olmalı. Ayrı seat tablosu ancak üyelik dondurma, ayrılma ve faturalı koltuk geçmişi gereksinimi çıkarsa eklenmeli.
- `getSchoolEntitlements(schoolId)` tek yetki kaynağı olmalı. Okul veri girişi, rapor, dışa aktarma ve koçluk Server Action’ları yalnızca arayüzde düğme saklamakla yetinmeden lisans haklarını sunucu tarafında kontrol etmeli.
- Bireysel `hasPremiumAccess(userId)` ile kurum `getSchoolEntitlements(schoolId)` ayrı kalmalı. Kurumun öğrenciye verdiği erişim, öğrenciye bireysel abonelik/borç veya yenileme oluşturmaz.
- Fatura veya kart bilgisi ödeme entegrasyonu gelene kadar uygulamada tutulmamalı. İlk kurum fazında teklifle başlayan ve yetkili tarafından elle aktifleştirilen, bitiş zamanı belirli `manual` lisans kullanılabilir; koşullar ve etkinin başladığı tarih kullanıcıya kaydedilmelidir.

### Aşamalar

**K0 — Kurum erişimini görünür kıl (uygulandı):** “Aboneliğim” ekranında her okul üyeliği için okul adı, rol, sınıf, plan/erişim durumu ve tarihleri gösterilir; müdür kontenjan kullanımını ve sözleşme referansını görür. Lisans yoksa açıkça belirtilir, bireysel hediye kampanyası kurum üyelerine gösterilmez. Çoklu okul üyelikleri ayrı kartlardır.

**K1 — Lisans alanı ve yönetici akışı (kodlandı, migration bekliyor):** okul planları, okul aboneliği ve değişmez olay kayıtları eklendi. Yönetici önce ücretli lisans teklifi ve toplam tutarı tanımlar. Müdür sepetten ödeme talebini başlatır; lisans, yönetici gerçek ödemeyi dışarıda doğrulayıp referansıyla kaydedene kadar etkinleşmez. Online ödeme altyapısı bağlı değildir. Demo, lisans kaydı olan okula ayrıca yönetici tarafından verilebilir; demo ücretsiz ve doğrudan etkinleşir.

**K2 — Lisans yetkilendirmesi ve kapasite (uygulandı):** öğrenci katılımı, okul sınavları, öğrenme alanı ve bildirimlerde kullanılabilir kurumsal lisans sunucu tarafında doğrulanır. Demo lisansı veya ödeme referansıyla doğrulanmış ve tarihi geçerli lisans gerekir. Lisans dışı/ödeme bekleyen erişimler kapalıdır; kontenjan katılım sırasında okul satırı kilitlenerek denetlenir. Lisans değiştirilirken mevcut öğrenci sayısının altına inilemez. Lisans bitişinde tarih kontrolü erişimi otomatik kapatır; öğrenci hesabındaki kişisel kayıtlar korunur.

**K3 — Gerçek kurumsal satış:** satış sözleşmesi ve sipariş/ön bilgilendirme, vergi/fatura, tahsilat/ödeme sağlayıcısı (gerekiyorsa), başarısız ödeme/itiraz/iade, kurumdan fesih talebi, bildirim ve operasyon. Fiyatlar ve alıcı bilgileri hukukçu/mali müşavir incelemesinden sonra açılır.

### Kurum kabul ölçütleri

- Öğrenci/öğretmen kurum erişiminin hangi okuldan geldiğini ve kendi erişim bitişini görebilir; fatura veya başka öğrencinin kaydını göremez.
- Yetkili okul yöneticisi lisans, dönem, kontenjan ve sözleşme referansını görebilir. Yetkisiz roller planı değiştiremez.
- Bir kullanıcının birden fazla okul üyeliği varsa detaylar karışmaz; okul değiştirme üyelik kapsamını da değiştirir.
- Lisans kontrolü bütün ilgili sunucu eylemlerinde uygulanır; doğrudan action çağrısıyla hak aşılamaz.
- Kontenjan eşzamanlı eklemede aşılmaz; öğrenci ayrılışı ve lisans sonu erişim kuralları denetim kaydı oluşturur.
- Okul hesabı ödeme/kampanya almadan aktif edilirse bunun ücretsiz, ücretsiz deneme, sözleşmeli manuel erişim veya ücretli lisans hangisi olduğu ve tarih aralığı kayda geçer.

### Kurumsal uyum kontrol noktaları

- Kurum sözleşmesinde okul ve Puaniz’in kişisel veri işleme bakımından veri sorumlusu/veri işleyen rolleri her işlem için fiili amaç ve talimatlara göre belirlenmeli; tek tip bir rol varsayılmamalı. KVKK Kurumu, rolün sözleşmedeki etiketten ziyade amaç ve araçları kimin belirlediğine göre değerlendirildiğini açıklıyor.
- Okulun talimatları, veri kategorileri, kullanıcı erişimleri, alt işleyenler, saklama/silme, ihlal bildirimi, ilgili kişi talepleri ve denetim usulü sözleşme/ekinde düzenlenmeli. Öğrenci/veli aydınlatma metinlerinin hangi tarafça ne zaman sunulacağı net olmalı.
- Öğrenci verileri, özellikle çocukların kayıtları, kurumlar arasında veya okul personeline gerekenden fazla açılmamalı; erişim okul/rol/sınıf kapsamı ile sınırlandırılmalı ve dışa aktarmalar kaydedilmeli.
- Hosting ve alt sağlayıcıların veri bölgeleri/aktarımları, KVKK m.9 koşulları, VERBİS kapsamı ve saklama süreleri kurum sözleşmesi açılmadan önce iş modeline göre hukukçu tarafından teyit edilmeli.
- ETBİS yükümlülüğü model bazında değerlendirilmeli: Ticaret Bakanlığı SSS, kendi elektronik ticaret ortamında hizmet sunanlar ile aracılık platformu üzerinden satış yapanları farklı ele alıyor. Kurumsal teklif/sipariş akışı, sözleşmenin nerede kurulduğu ve platformun rolü belirlenmeden otomatik bir “gerekmez” sonucu çıkarılmamalı.
- Fatura, vergi, ticari unvan/adres, okulun satın alma yetkilisi ve kamu/özel okul ayrımı mali müşavir ve hukukçu ile teyit edilmeden kurumsal ücretli paket açılmamalı.

## Resmî kaynaklar

- [Ticaret Bakanlığı — Abonelik sözleşmeleri hakkında bilgilendirme](https://tuketici.ticaret.gov.tr/yayinlar/tuketici-bilgi-rehberi/abonelik-sozlesmeleri-hakkinda-bilgilendirme)
- [Ticaret Bakanlığı — Mesafeli sözleşmeler hakkında bilgilendirme](https://tuketici.ticaret.gov.tr/yayinlar/tuketici-bilgi-rehberi/mesafeli-sozlesmeler-hakkinda-bilgilendirme)
- [Ticaret Bakanlığı — Fiyat etiketleri hakkında bilgilendirme](https://tuketici.ticaret.gov.tr/yayinlar/tuketici-bilgi-rehberi/fiyat-etiketleri-hakkinda-bilgilendirme)
- [Ticaret Bakanlığı — 2026 tüketici idari para cezaları duyurusu](https://tuketici.ticaret.gov.tr/haberler/6502-sayili-tuketicinin-korunmasi-hakkinda-kanun-kapsaminda-uygulanan-idari-para-cezalari-1-ocak-2026-tarihinden-itibaren-25-49-oraninda-arttirildi)
- [Ticaret Bakanlığı — 6502 sayılı Kanun ve tüketici mevzuatı](https://www.ticaret.gov.tr/tuketici/mevzuat/6502-sayili-tuketicinin-korunmasi-mevzuati)
- [KVKK — Veri sorumlusu kimdir?](https://www.kvkk.gov.tr/Icerik/2032/Veri-Sorumlusu-Kimdir)
- [KVKK — Veri sorumlusu ve veri işleyenin belirlenmesine ilişkin Kurul kararı](https://www.kvkk.gov.tr/Icerik/6874/2020-71)
- [KVKK — Veri güvenliğine ilişkin yükümlülükler](https://www.kvkk.gov.tr/Icerik/2040/Veri-Guvenligine-Iliskin-Yukumlulukler)
- [Ticaret Bakanlığı ETBİS — Sıkça Sorulan Sorular](https://etbis.ticaret.gov.tr/tr/SSS)
