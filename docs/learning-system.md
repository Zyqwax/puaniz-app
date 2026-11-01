# Birleşik gelişim sistemi

## Uygulanan ilk teslim

- Öğrenci: `/dashboard/student/progress`; hedef, kaynak filtresi, dönem netleri, son 100 çalışma oturumu özeti, konu özeti, görevler ve öz değerlendirme.
- Öğretmen: `/dashboard/teacher/progress`; atanmış sınıflar, okul sonuçları, öğrenci filtresi, sınıf karşılaştırması, açıklanabilir takip sinyalleri, destek görevi oluşturma.
- Müdür: `/dashboard/principal/progress`; okul sınıfları, karşılaştırmalar, veri kapsamı ve son 30 görev oluşturma kaydı.
- Yetki düzeyleri sunucu action'larında doğrulanır. Müdür başka okulun sınıfına erişemez. Öğretmen sadece atanmış sınıfta geri bildirim okur/yazar. Öğrenci görev tamamlaması ve öz değerlendirmesi sadece öğrenci tarafından değiştirilebilir.
- Kişisel deneme ve çalışma kayıtları personel analitiğine aktarılmaz. Personel okul tarafından yüklenen sonuçları görür.
- Sınav yükleme işleminde okul numarası tekrarları, eksik kimlik bilgileri ve cevap adetleri kontrol edilir. Net sunucuda doğru − yanlış/4 olarak hesaplanır. Sınav/sonuç yazımı transaction içindedir.

## Kurulum ve doğrulama

`node scripts/setup-learning.mjs` mevcut verileri koruyarak görev/işlem izi tablolarını oluşturur.
`node --experimental-strip-types scripts/verify-learning.mjs` geçici hesaplarla erişim izolasyonu ve görev sahipliğini gerçek DB üzerinde doğrular; sonunda hesapları temizler.

## Metrikler

Ortalama/medyan sonuç satırları üzerinden hesaplanır. Dönem farkı iki tarih seçildiğinde önceki eşit uzunluktaki dönemin ortalamasından çıkarılır. Eksik veri null olur. TYT ve AYT birleştirilmez. Sınavların zorlukları eşit varsayılmaz.
Takip sinyalleri: aynı türde üç farklı tarihli sonucun sürekli azalması veya son sonuçtan 14 günden fazla geçmiş olması. Yeterli veri olmadan düşüş sinyali üretilmez; bu sinyaller akademik karar veya çalışmama kanıtı değildir.
Konu tamamlanması öz bildirimdir. Çalışma özeti son 100 oturumla sınırlıdır. Okul kapsamındaki sınıfı olmayan sonuçlar personel analizine dahil edilmez.

## İkinci teslim: veri yükleme ve denetim

- Sürümlü `2026-1` şablonları, tam TYT/AYT test sınırları, çift tırnaklı CSV ayrıştırma, sütun ve tüm satır hataları, düzenlenebilir CSV içeriği ve 50 satırlık önizleme sayfalaması eklendi.
- AYT'de bir satır SAY, EA veya SÖZ alanının testlerini içerebilir; farklı alan testleri karışamaz. Kullanılmayan test sütunları D/Y çifti olarak kaldırılabilir. Dil testi bu şablonda bulunmaz.
- Tarihler takvim günü olarak doğrulanır. Negatif net korunur. Kayıtlı sınıf ve öğrenci numarası çelişirse yükleme reddedilir.
- Normalize içerik hash'i, okul bazlı unique indeks ve transaction advisory lock eşzamanlı aynı yüklemeyi tek sınavla sınırlar. Eski hash'siz yüklemelerle geriye dönük içerik karşılaştırması yapılmaz.
- Müdürün okul genelindeki en yeni 100 eşleşmeyen sonucu kimlik kontrol onayıyla öğrenciye bağlayabileceği kuyruk eklendi. Aynı sınavda tekrar eşleştirme engellenir ve sınıf sıralaması güncellenir.
- İşlem geçmişi aktör adıyla sınav yükleme, öğretmen ataması, okul görevi durumları ve rapor dışa aktarmayı kapsar. Dışa aktarma kaydı, tarayıcı indirmesi başlatılmadan önce oluşturulur; dosyanın cihazda gerçekten saklandığını garanti etmez.
- Öğrencinin kişisel görevleri `school_id=NULL` ile ayrılır ve personele/okul audit kayıtlarına aktarılmaz. Okul görevleri oluşturuldukları okul kapsamında kalır.
- Gerçek DB testleri: eşzamanlı tekrar yükleme, negatif net, hatalı takvim/test limiti, CSV tırnakları, kişisel görev izolasyonu, yetkisiz eşleştirme ve sıralama yenilemesi.

## Üçüncü teslim: öğrenci profili ve haftalık plan

- Öğretmen `/dashboard/teacher/students/[id]` ve müdür `/dashboard/principal/students/[id]` yollarından yetkili oldukları öğrenci profilini açabilir. Analiz ekranına öğrenci bağlantıları eklendi.
- Profil yalnızca mevcut okulun deneme sonuçlarını, okul görevlerini ve paylaşılan görüşme notlarını içerir. Kişisel hedefler ve kişisel çalışma kayıtları personele aktarılmaz.
- Görüşme tarihi, sonraki takip tarihi ve öğrenciyle paylaşılan not kaydedilir. Bu alan özel rehberlik/sağlık kaydı için tasarlanmamıştır; notun öğrenciye göründüğü formda açıkça belirtilir.
- Görev yazarı veya aynı okuldaki müdür, okul görevinin hedefini revize edebilir ve başlangıç/takip denemelerini seçebilir. Takip sonucu aynı öğrenci/okula ait, aynı sınav türünde ve daha sonraki bir tarihte olmalıdır. Gözlenen net farkı nedensel etki veya başarı tahmini olarak sunulmaz.
- Görev hedefi/değerlendirme revizyonları audit kaydına önceki/sonraki değerlerle yazılır. Öğrencinin öz değerlendirmesini personel değiştiremez.
- `/dashboard/student/plan` öğrencinin haftalık gün görünümünü, planlanan süreleri, tamamlanan/açık görevleri, planlanmayan ve geçmişten kalan işleri içerir. Kişisel görev hedefleri düzenlenebilir; okul görevlerinin öğrenci tarafından yalnızca çalışma günü/süresi, tamamlanma ve öz değerlendirmesi değiştirilebilir.
- Konu tekrarları kişisel hedef olarak planlanabilir. Otomatik tekrar üretimi ve konu takibiyle otomatik tamamlama yoktur. Planlanan süre, gerçek çalışma oturumu olarak kaydedilmez.
- Paylaşılan görüşme ve öğretmen değerlendirmeleri öğrencinin planında görünür. E-posta/push bildirimi veya zamanlanmış hatırlatma bu teslimde yoktur.
- Görev planlama, hedef revizyonu ve tamamlama, sürüm numarasıyla eski formların yeni veriyi ezmesini engeller. Yıl geçişinde haftalar UTC takvim günü hesaplarıyla tutarlı kalır; bugünün tarihi İstanbul'a göre belirlenir.
- Gerçek DB doğrulamasına profil erişimi, kişisel hedef gizliliği, öğretmen notu yetkisi, görüşme paylaşımı, ters tarihli deneme reddi, revizyon çakışması ve plan sahipliği eklendi.

## Dördüncü teslim: görüşme geçmişi ve gelişim bildirimleri

- Görüşme yazarı veya aynı okulun müdürü gerekçeli düzeltme yapabilir. Önceki ve sonraki tarih/metin, düzenleyen kullanıcı ve sürüm korunur. Eski sürümle düzeltme atomik olarak reddedilir. Düzeltme geçmişini yetkili personel ve ilgili öğrenci görebilir.
- `/dashboard/notifications` görev, görüşme ve okul denemesi bildirimlerini alıcıya göre listeler. Liste 30 satırlık sunucu sayfalaması ve okunmamış filtresi içerir. Okunma durumu kullanıcıya özeldir; sayfayı açmak bildirimleri kendiliğinden okunmuş yapmaz.
- Üst başlığa okunmamış sayacı eklendi. Görünür sekmede 60 saniyede bir, odak değişiminde ve okuma/tercih işlemlerinden sonra yenilenir. Başka kullanıcıya ait önceki sayaç gösterilmez.
- Görev oluşturma/revizyonu öğrenciye; tamamlama/yeniden açma görev yazarına; görüşme/düzeltme öğrenciye; sınav yükleme ve sonradan sonuç eşleştirme ilgili öğrenciye bildirim oluşturur. İşlemi yapan kendi kendine bildirim almaz.
- Bildirimler işlemin transaction'ında kaydedilir; kullanıcı ve olay anahtarı benzersizliği tekrar üretimi engeller. Toplu sınav yüklemesinde alıcılar gruplar halinde işlenir.
- Görev, görüşme ve sınav kategorileri bildirim ekranından ayrı ayrı kapatılabilir. Tercihler yeni bildirim üretimini etkiler; eski bildirimleri veya asıl kayıtları silmez. Kişisel görevler okul bildirimi üretmez.
- Bildirim mesajları not metni/öğrenci adı taşımaz. Kaydı açma action'ı alıcı sahipliğini, kaydın varlığını ve güncel okul/sınıf yetkisini yeniden denetler. Yetkisi kaldırılan öğretmen eski bildiriminden öğrenciye erişemez.
- Bu merkez gelişim sistemine aittir; forum bildirimleri mevcut forum akışında devam eder. E-posta, push ve zamanlanmış son tarih hatırlatmaları henüz yoktur. Eski işlemler için geriye dönük bildirim üretilmez.
- Gerçek DB testleri: bildirim sahipliği/okunma, yetki iptali, tercih filtreleme, olay tekrar koruması, sayfalama ve gerekçeli görüşme sürümleri.

## Beşinci teslim: dönem raporları ve SQL toplulaştırma

- Öğrenci, öğretmen ve müdür için ayrı `/dashboard/{role}/reports` yolları eklendi. Tarih, TYT/AYT, personelde sınıf/kademe/alan, öğrencide kişisel/okul kaynak filtreleri uygulanır. Varsayılan aralık İstanbul takvimine göre mevcut eğitim yılının 1 Eylül'ünden bugüne kadardır; en fazla 731 gün seçilir.
- Sonuç sayısı, farklı öğrenci sayısı, ortalama, medyan, min/max, sınıf grupları ve gün bazlı eğilim PostgreSQL'de hesaplanır. Rapor istemciye ham öğrenci sonuçlarını veya öğrenci adlarını taşımaz. Önceki eşit uzunluktaki dönemle ortalama farkı, iki tarafta yeterli veri varsa gösterilir.
- Personel raporunda beşten az farklı öğrenci bulunan grubun net istatistikleri sunucuda null yapılır. Küçük sınıfın değerinin toplamdan çıkarımla bulunmasını zorlaştırmak için bu durumda genel ve günlük net istatistikleri de gizlenir. Bu koruma raporu anonimleştirme garantisi değildir; mevcut yetkili bireysel profil erişimini değiştirmez.
- PDF ve CSV indirmede yetki/filtreler yeniden sorgulanır; eski tarayıcı verisi doğrudan dışa aktarılmaz. Okul raporu dışa aktarmaları audit'e kaydedilir. Kayıt, indirme başlatılmasını ifade eder; cihazdaki dosya kaydını doğrulamaz.
- PDF metin tabanlı A4 tabloları otomatik sayfalara böler. Türkçe karakterler için lisansıyla birlikte DejaVu Sans fontu yerel pakete eklenmiştir. Hesaplama/kapsam notları ve sayfa numaraları bulunur. CSV sütunları Türkçe Excel için noktalı virgül ve ondalık virgül kullanır; metinlerde formül başlangıçları kaçırılır.
- Veritabanı testleri SQL ortalama/medyanı, boş veri, rol/sınıf izolasyonu, kademe/alan filtreleri, küçük sınıfın toplam/eğilimden çıkarım koruması ve öğrencinin kendi raporunu kapsar. Çok sayfalı Türkçe PDF örneği metin çıkarımı ve PNG görünümleriyle kontrol edildi.
- Eski gelişim çalışma alanı ham sonuç görünümünü korur; bütün okul ekranları henüz sunucu sayfalamasına taşınmamıştır. Raporlarda sınıfı olmayan okul satırları hariçtir. Farklı testlerin zorluk eşitliği varsayılmaz.

## Altıncı teslim: sonuç düzeltme ve sayfalı veri yönetimi

- `/dashboard/principal/data` okul sınavı sonuçlarını sınav/öğrenci adı ve numarasıyla arar; eşleşmeyen filtresi sınıfsız kayıtları da kapsar. Liste veritabanında 25 satırlık sayfalama kullanır; ham ders sonuçları listeye taşınmaz.
- `/dashboard/principal/data/[id]` yalnızca aynı okulun müdürüne sonuçta görünen ad ve test cevaplarını gerekçeyle düzeltme yetkisi verir. Netler sunucuda test sınırlarıyla doğrulanıp hesaplanır. Negatif netler korunur. Gönderilen net alanına güvenilmez; tanımsız test adları kabul edilmez.
- Sınav düzeyinde transaction kilidi ve sonuç sürümü, aynı sınavda eş zamanlı düzeltme/eşleştirme işlemlerini sıralar. Düzenleme sonrası okul ve sınıf sıralaması `rank()` ile eşit netleri aynı sıraya koyarak yeniden hesaplanır. Diğer sınavların sıralamaları değişmez.
- Önceki/sonraki ad, numara, hesap bağlantısı, sınıf, cevaplar ve net; düzenleyen kişi, gerekçe ve yeni sürümle saklanır. Geçmiş 20 kayıtlık sunucu sayfalamasıyla görülebilir. Düzeltilen bağlı öğrenciye tercihine göre sonuç bildirimi üretilir.
- Eşleşmeyen sonucu öğrenciye bağlama da sürüm ve gerekçeyle aynı geçmişe yazılır. Öğrenci seçimi tüm okulu indiren açılır liste yerine aranan 25 adaylık sayfalardan yapılır. Yedinci teslimde bağlı hesabı da gerekçe ve kimlik doğrulama onayıyla aktarma eklendi.
- `/dashboard/teacher/students` ve `/dashboard/principal/students` sınıf filtresi, ad/numara araması ve 25 satırlık sunucu sayfalaması sunar. Öğretmen yalnızca atanmış sınıfları görebilir. Aramadaki `%`, `_` ve ters eğik çizgi gerçek karakter olarak ele alınır.
- Öğretmen ana sayfası yeni dizine yönlenir. Okul yönetimindeki eski öğrenci/sonuç modalleri sayfalı ekranlarla değiştirildi. Gelişim alanındaki 100 kayıtlık eşleşmeyen listesi, genel kuyruk sayacı ve sayfalı ekrana bağlantı olarak değiştirildi.
- Filtre formları Next.js Form ile istemci navigasyonu kullanır; filtre temizleme URL ile form alanlarını birlikte sıfırlar. Öğretmen dizini mevcut öğretmen oturumuyla tarayıcıda arama ve boş sonuç görünümü bakımından kontrol edildi. Müdür işlemleri gerçek DB fixture testleriyle doğrulandı; tüm rollerin UI akışı henüz uçtan uca tamamlanmadı.
- Veri testi: başka okul/personel yetki reddi, cevap sınırları, sunucuda net hesabı, aynı sınavdaki rakip sırasının yenilenmesi, diğer sınavın korunması, eş zamanlı sürüm çakışması, eşleştirme geçmişi, sınıfsız kayıt sayfalaması ve literal arama.
- Eski gelişim alanının ham sonuçları/görevleri henüz sunucu sayfalamasına taşınmamıştır. Öğrenci profilinin 25 kayıtlık sayfalaması yedinci teslimde eklendi. İçe aktarma hash'i ilk yüklemeyi temsil eder; gerekçeli düzeltme eski dosyayı tekrar yükleyerek geri alınmaz.

## Yedinci teslim: yapılandırma izi, kimlik aktarımı ve kişisel tekrar

- Sınıf oluşturma, sınıf bilgisi güncelleme ve öğretmen sınıf yetkisi değişiklikleri sürümlü `school_class_revisions` kayıtlarına önce/sonra görünümü, aktör ve gerekçeyle yazılır. Müdür sınıf kartından son 20 kaydı görüntüleyebilir. İşlemler okul kapsamıyla sınırlandırılır.
- Müdür, daha önce öğrenciye bağlı bir sonucu başka bir öğrenciye aktarabilir. Hedef öğrenci aynı okulun aktif sınıf ve numara kaydına sahip olmalıdır; aynı sınavda numara çakışması reddedilir. UI kimlik kontrol kutusu ve gerekçe ister; sunucu okul üyeliğini, onay değerini ve sonuç sürümünü yeniden doğrular. Önce/sonra sonucu, sıralama güncellemesi, işlem kaydı ve eski/yeni öğrenci bildirimi tek transaction içindedir. Kutuyu işaretlemek okul kaydından doğrulamanın yerine geçmez.
- Öğretmen/müdür öğrenci profillerindeki deneme, görev ve görüşme bölümleri SQL sayfalamasıyla sayfa başına 25 kayıt gösterir.
- Öğrencinin yalnızca kendisinin gördüğü konu kayıtlarından `repeatCount` temelli 1/3/7/14/30 günlük basit tekrar önerileri türetilir. Bu başarı/unutma tahmini değildir; konu tekrar kaydı otomatik tamamlanmaz ve personel ekranına aktarılmaz.
- `npm run learning:reminders` İstanbul tarihine göre o gün vadeli açık okul görevleri ve takip görüşmeleri için bildirim oluşturur. Kullanıcı tercihleri uygulanır, olay anahtarı çift bildirimi önler, 365 günden eski uygulama bildirimleri silinir. Dağıtım ortamında komutun günlük 07:00 Europe/Istanbul saatinde çalıştırılması gerekir; bu depoda cron sağlayıcısı veya üretim zamanlayıcısı yapılandırılmamıştır. Komut e-posta/push göndermez. Okul denetim kayıtları ve öğrenci çalışma/sonuç kayıtları bu komutla silinmez.

## Dağıtım ve veri bağımlılıkları

- Soru-konu kazanım analizi için soru cevap anahtarı, soru-konu eşlemesi ve karşılaştırılabilir sınav metaverisi gerekir. Mevcut yüklemeler yalnızca test toplamı D/Y ve netlerini içerdiği için bu analizi veri uydurmadan üretmek mümkün değildir; ilgili sağlayıcı/veri şeması tanımlanmamıştır.
- Hatırlatma komutu hazırdır; zamanlanması dağıtım ortamında cron sağlayıcısı gerektirir. Hosting bilgisi olmadan üretim zamanlayıcısı aktive edilmemiştir.
- Eski gelişim çalışma alanı (ham sonuç/görev filtreleri ve tüm rol listeleri) hâlâ tam sunucu sayfalamasına taşınmamıştır. Öğrenci profili sayfalıdır; haftalık öğrenci planı mevcut arayüzde tüm aktif görev/görüşme geçmişini yükler.
- Öğrencinin kişisel çalışma kaydı ve konu ilerlemesi personele kapalı kalır; alanları açıp kapatan öğrenci onay ekranı yoktur. Veri paylaşım kapsamını belirlemek için hangi alanların hangi rol ve süreyle açılacağı ürün kararı gerektirir.
- Otomatik ödev değerlendirmesi, tahmini YKS sıralaması ve AI karar mekanizması mevcut değildir.
