import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description: "Puaniz hizmetinin kullanımına ilişkin temel koşullar.",
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-4xl space-y-8 px-4 pb-24 pt-32 sm:px-6 sm:pt-40">
      <header className="space-y-3">
        <p className="text-sm font-bold text-[var(--link)]">Puaniz · Hizmet</p>
        <h1 className="text-3xl font-black text-[var(--text)] sm:text-4xl">Kullanım koşulları</h1>
        <p className="text-sm text-[var(--text-muted)]">Son güncelleme: 1 Kasım 2026</p>
      </header>
      <section className="space-y-3 text-sm leading-7 text-[var(--text-muted)]">
        <p>Puaniz; sınav sonuçlarını, çalışma hedeflerini ve öğrenme sürecini takip etmeye yönelik bir çevrim içi hizmettir. Hesap açarak doğru bilgiler vermeyi, hesabınızı korumayı ve hizmeti hukuka uygun kullanmayı kabul edersiniz.</p>
        <p>Hesabınızda tuttuğunuz verilerin yedeğini düzenli olarak almanız önerilir. Puaniz analizleri bilgilendirme ve çalışma desteği sunar; sınav puanı, yerleştirme veya eğitim sonucu garantisi vermez. Yapay zekâ yanıtları hata içerebilir ve tek başına önemli eğitim kararlarının temeli olmamalıdır.</p>
        <p>Okul çalışma alanlarında kullanıcılar yalnızca kendilerine atanmış yetki kapsamında verilere erişmelidir. Öğrenci verilerini kurum dışında paylaşmayın; yüklediğiniz içerik üzerinde gerekli yetkiye sahip olduğunuzdan emin olun.</p>
        <p>Bireysel Premium erişimi, kullanıcının hesabında gösterilen plan koşullarına göre etkinleştirilir. Kullanıcı mevcut erişimini Aboneliğim ekranından yönetebilir veya iptal edebilir; iptal anında Premium erişimi sona erer. Bireysel erişim okul lisansı değildir; okul hesapları kurum üyeliği ve yetkileriyle ayrı çalışır.</p>
        <p>Herhangi bir ücretli abonelik sunulursa toplam fiyat, dönem, yenileme, iptal, cayma ve iade koşulları sipariş öncesinde ayrıca gösterilecek; gerekli sözleşme ve ön bilgilendirme metinleri kullanıcının erişimine sunulacaktır. Bu sayfa tek başına ücretli mesafeli satış veya abonelik sözleşmesinin yerine geçmez.</p>
        <p>Hesabınızı ayarlardan silebilirsiniz. Mevzuat gereği tutulması gereken kayıtlar, ilgili zorunluluk devam ettiği sürece saklanabilir.</p>
        <p>İletişim ve kişisel veri işleme bilgileri için <a className="font-semibold text-[var(--link)] underline" href="/privacy">aydınlatma metnine</a> bakın. Bu koşulları uygulamadan önce işletmeci kimliği ve uygulanacak diğer yasal bilgiler tamamlanmalıdır.</p>
      </section>
    </article>
  );
}
