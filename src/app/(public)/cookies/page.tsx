import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Çerez ve Tarayıcı Depolaması Bilgilendirmesi",
  description: "Puaniz'in çerez ve tarayıcı depolaması kullanımı hakkında bilgi.",
};

export default function CookiesPage() {
  return (
    <article className="mx-auto max-w-4xl space-y-8 px-4 pb-24 pt-32 sm:px-6 sm:pt-40">
      <header className="space-y-3">
        <p className="text-sm font-bold text-[var(--link)]">Puaniz · Tercihler</p>
        <h1 className="text-3xl font-black text-[var(--text)] sm:text-4xl">Çerez ve tarayıcı depolaması bilgilendirmesi</h1>
        <p className="text-sm text-[var(--text-muted)]">Son güncelleme: 1 Kasım 2026</p>
      </header>
      <section className="space-y-3 text-sm leading-7 text-[var(--text-muted)]">
        <h2 className="text-xl font-bold text-[var(--text)]">Şu an kullanılan teknolojiler</h2>
        <p>Puaniz, oturum açma ve güvenli hesap kullanımı için kimlik doğrulama oturum çerezleri kullanır. Bunlar istenen hizmetin çalışması için gereklidir. Tema tercihi, sohbet geçmişi ve gönderi taslakları gibi bazı tercihler de cihazınızdaki tarayıcı depolamasında (localStorage) saklanır; bunlar çerez değildir ve tarayıcı ayarlarından temizlenebilir.</p>
        <p>Uygulama kaynak kodu incelendiğinde analitik veya reklam çerezi/izleyicisi bulunmamıştır. Üretim ortamına yeni bir analitik, reklam veya zorunlu olmayan izleyici eklenirse bu sayfa güncellenmeli; gerekli hallerde, teknoloji çalışmadan önce açık tercih alınmalıdır. Bu bilgilendirme gelecekte eklenecek etiketleri otomatik olarak engelleyen bir tercih yönetim aracı değildir.</p>
      </section>
      <section className="space-y-3 text-sm leading-7 text-[var(--text-muted)]">
        <h2 className="text-xl font-bold text-[var(--text)]">Kontrol ve başvuru</h2>
        <p>Tarayıcı ayarlarından çerezleri ve site depolamasını silebilir ya da engelleyebilirsiniz. Oturum çerezlerini engellemek giriş ve hesap işlevlerini bozabilir. Kişisel veriler hakkında sorularınız için <a className="font-semibold text-[var(--link)] underline" href="mailto:mail@iletisim.puaniz.com.tr">mail@iletisim.puaniz.com.tr</a> adresine yazın. Veri sorumlusu kimlik bilgileri <a className="font-semibold text-[var(--link)] underline" href="/privacy">aydınlatma metninde</a> yer alır.</p>
      </section>
    </article>
  );
}
