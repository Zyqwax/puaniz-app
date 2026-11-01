import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kişisel Verilerin Korunması ve Aydınlatma Metni",
  description: "Puaniz'de kişisel verilerin işlenmesine ilişkin aydınlatma metni.",
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-xl font-bold text-[var(--text)]">{title}</h2>
    <div className="space-y-3 text-sm leading-7 text-[var(--text-muted)]">{children}</div>
  </section>
);

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-4xl space-y-10 px-4 pb-24 pt-32 sm:px-6 sm:pt-40">
      <header className="space-y-3">
        <p className="text-sm font-bold text-[var(--link)]">Puaniz · KVKK</p>
        <h1 className="text-3xl font-black text-[var(--text)] sm:text-4xl">Kişisel Verilerin Korunması ve Aydınlatma Metni</h1>
        <p className="text-sm leading-7 text-[var(--text-muted)]">Son güncelleme: 1 Kasım 2026</p>
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-[var(--text)]">
          Bu metin yayına hazırlık taslağıdır. Hizmet henüz yayında değildir. Veri sorumlusunun resmi iş/tebligat adresi ve altyapı sağlayıcılarının aktarım bilgileri doğrulanmadan yayına alınmamalıdır.
        </p>
      </header>

      <Section title="1. Veri sorumlusu ve iletişim">
        <p>6698 sayılı Kişisel Verilerin Korunması Kanunu (“Kanun”) kapsamında veri sorumlusu, Puaniz hizmetini işleten gerçek kişi Enes Samed Gözlü'dür. Resmi iş/tebligat adresi hizmet yayına açılmadan önce burada açıkça belirtilmelidir. Gizlilik ve kişisel veri başvuruları için: <a className="font-semibold text-[var(--link)] underline" href="mailto:mail@iletisim.puaniz.com.tr">mail@iletisim.puaniz.com.tr</a>.</p>
      </Section>

      <Section title="2. İşlenen veri kategorileri ve amaçlar">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Hesap ve kimlik bilgileri:</strong> ad, e-posta, parola özeti, hesap ve doğrulama kayıtları; hesap oluşturma, kimlik doğrulama, güvenlik ve destek için.</li>
          <li><strong>Eğitim ve profil bilgileri:</strong> sınıf/kademe, alan, hedefler, deneme adı/tarihi, ders bazında doğru-yanlış/net sonuçları, konu ilerlemesi ve çalışma kayıtları; analiz, takip ve rapor hizmetlerini sunmak için.</li>
          <li><strong>Okul ve kurum bilgileri:</strong> okul, sınıf, okul numarası, üyelik/rol, öğretmen geri bildirimi ve okul tarafından yüklenen sınav sonuçları; okul çalışma alanlarını ve yetkili raporlamayı sağlamak için.</li>
          <li><strong>İçerik ve iletişim:</strong> forum gönderileri, yorumlar, görseller, iletişim formundaki ad, e-posta, isteğe bağlı telefon/kurum, konu ve mesaj; topluluk ve destek işlevleri için. İletişim formu kayıtları ve forum içerikleri uygulama veritabanında saklanır.</li>
          <li><strong>Yapay zekâ asistanı verileri:</strong> kullanıcı mesajı ve seçilen kullanım bağlamı; yanıt üretmek için Groq hizmetine gönderilebilir. Sohbet geçmişi bu kod tabanında kullanıcının tarayıcı depolamasında tutulur.</li>
          <li><strong>Premium kampanya kayıtları:</strong> seçilen bireysel plan, durum ve dönem tarihleri ile kampanya koşullarının sürüm/onay zamanı; erişimi etkinleştirmek, iptal talebini uygulamak ve kullanıcının işlem geçmişini göstermek için.</li>
          <li><strong>İşlem ve teknik kayıtlar:</strong> oturum, IP adresi ve tarayıcı bilgisi (oturum kayıtlarında mevcutsa), tercih ve hata/güvenlik kayıtları; hizmetin güvenliği, işletilmesi ve sorunların giderilmesi için.</li>
        </ul>
        <p>Özel nitelikli kişisel veriler hizmet için istenmez. Kullanıcıların forum veya iletişim alanlarına bu tür verileri yazmaması gerekir.</p>
      </Section>

      <Section title="3. Hukuki sebepler">
        <p>Veriler, her işlem bakımından ayrı değerlendirilmek üzere; hizmet sözleşmesinin kurulması veya ifası için zorunluluk, veri sorumlusunun hukuki yükümlülüklerini yerine getirmesi, bir hakkın tesisi/kullanılması/korunması ve temel haklara zarar vermemek kaydıyla meşru menfaat hukuki sebeplerine dayanılarak işlenebilir. Açık rıza gereken ayrı bir amaç (örneğin zorunlu olmayan izleme veya pazarlama) devreye alınırsa, bu amaç için ayrıca ve özgür iradeyle rıza alınır. Aydınlatma metni tek başına açık rıza değildir.</p>
      </Section>

      <Section title="4. Aktarılan taraflar">
        <p>Hizmetin sunulması ve güvenliği kapsamında veriler; barındırma/veritabanı, e-posta gönderimi, görsel depolama ve yapay zekâ destek işlevleri için kullanılan hizmet sağlayıcılara, yalnızca ilgili işlevin gerektirdiği ölçüde aktarılabilir. Uygulama kodunda Resend, Cloudinary ve Groq bağlantıları bulunmaktadır. Bu sağlayıcıların güncel tüzel kişi bilgileri, alt hizmet sağlayıcıları, verilerin işlendiği ülkeler ve aktarım güvenceleri işletmeci tarafından doğrulanmalı ve burada güncel biçimde açıklanmalıdır. Okul verileri, ilgili okulun yetki ve talimatları kapsamında işlenebilir.</p>
        <p>Yurt dışına kişisel veri aktarımı varsa, Kanun'un 9. maddesine uygun aktarım şartı ve gerekli bildirimler sağlanmadan aktarım yapılmamalıdır.</p>
      </Section>

      <Section title="5. Saklama ve güvenlik">
        <p>Kişisel veriler, işleme amacı için gerekli süre ve uygulanabilir yasal saklama süreleri boyunca tutulur; amaç sona erdiğinde silinir, yok edilir veya anonim hale getirilir. Hesap silme işlemi profil ve uygulama kayıtlarının silinmesini başlatır; yasal saklama zorunluluğu bulunan kayıtlar ilgili süre boyunca sınırlı şekilde tutulabilir. Kesin saklama süreleri ve yedeklerden silme takvimi işletmeci tarafından belirlenip uygulanmalıdır.</p>
        <p>Erişim kontrolü, yetkilendirme, güvenli aktarım, yedekleme ve ihlal yönetimi gibi teknik ve idari tedbirler uygulanır. Güvenlik ihlali şüphesi için yukarıdaki başvuru adresi kullanılabilir.</p>
      </Section>

      <Section title="6. Kanun kapsamındaki haklar ve başvuru">
        <p>Kanun'un 11. maddesi kapsamındaki haklarınız için kimliğinizi doğrulamaya yetecek bilgilerle <a className="font-semibold text-[var(--link)] underline" href="mailto:mail@iletisim.puaniz.com.tr">mail@iletisim.puaniz.com.tr</a> adresine başvurabilirsiniz. Başvurular, mevzuatta öngörülen usule ve süreye uygun şekilde yanıtlanır. Başvuruda talebinizi, ilgili hesabın e-posta adresini ve tercih ettiğiniz yanıt yöntemini belirtin; gereksiz hassas bilgi göndermeyin.</p>
        <p>Hesabınızı uygulamadaki <Link className="font-semibold text-[var(--link)] underline" href="/dashboard/settings">Ayarlar</Link> bölümünden de silebilirsiniz. Hesap silme ile ilgili bir sorun yaşarsanız başvuru kanalını kullanın.</p>
      </Section>

      <Section title="7. Diğer metinler">
        <p>Tarayıcı depolaması ve zorunlu oturum teknolojileri için <Link className="font-semibold text-[var(--link)] underline" href="/cookies">Çerez ve depolama bilgilendirmesi</Link> sayfasını; hizmet koşulları için <Link className="font-semibold text-[var(--link)] underline" href="/terms">Kullanım koşulları</Link> sayfasını inceleyebilirsiniz.</p>
      </Section>
    </article>
  );
}
