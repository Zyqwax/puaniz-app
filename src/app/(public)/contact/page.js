import { Mail, Building2, ArrowRight } from "lucide-react";

export const metadata = {
  title: "İletişim | Puaniz",
  description:
    "Puaniz ile iletişime geçin. Okullar, kurumlar ve iş birlikleri için bizimle iletişime geçebilirsiniz.",
  openGraph: {
    title: "İletişim | Puaniz",
    description:
      "Puaniz ile iletişime geçin. Okullar ve kurumlar için iş birliği fırsatları.",
    url: "https://www.puaniz.com.tr/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="pt-28 sm:pt-36 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-black text-[#0F2A5C] mb-5 tracking-tight">
            İletişim
          </h1>
          <p className="text-lg text-[#4A5B7A] max-w-xl mx-auto leading-relaxed">
            Bir okulun veya kurumun temsilcisi misiniz? Birlikte çalışmak için
            bizimle iletişime geçin.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Okullar İçin */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#0F2A5C]/[0.08] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#0F2A5C] flex items-center justify-center mb-6 text-white shadow-sm">
                <Building2 size={24} />
              </div>
              <h2 className="text-xl font-bold text-[#0F2A5C] mb-3">
                Okullar İçin
              </h2>
              <p className="text-sm text-[#4A5B7A] leading-relaxed mb-6">
                Okulunuzdaki öğrencilerin gelişimini takip etmek, deneme
                sonuçlarını toplu analiz etmek ve kurumsal dashboard erişimi için
                bizimle iletişime geçin.
              </p>
            </div>
            <div>
              <span className="inline-block px-3.5 py-1 rounded-full bg-[#FFB020] text-[#0F2A5C] font-bold text-xs tracking-wide">
                Yakında
              </span>
            </div>
          </div>

          {/* Genel İletişim */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#0F2A5C]/[0.08] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#2F6BFF] flex items-center justify-center mb-6 text-white shadow-sm shadow-[#2F6BFF]/20">
                <Mail size={24} />
              </div>
              <h2 className="text-xl font-bold text-[#0F2A5C] mb-3">
                Genel İletişim
              </h2>
              <p className="text-sm text-[#4A5B7A] leading-relaxed mb-6">
                Geri bildirim, öneriler veya sorularınız için bize
                ulaşabilirsiniz. Her türlü geri bildirimi memnuniyetle
                karşılıyoruz.
              </p>
            </div>
            <div>
              <a
                href="mailto:iletisim@puaniz.com.tr"
                className="inline-flex items-center gap-1.5 text-sm text-[#2F6BFF] hover:text-[#2558d4] font-bold transition-colors"
              >
                iletisim@puaniz.com.tr
                <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="text-center p-6 rounded-2xl bg-[#FFB020]/15 border border-[#FFB020]/30">
          <p className="text-sm text-[#0F2A5C] font-medium">
            İletişim formu yakında aktif olacaktır. Şimdilik yukarıdaki
            e-posta adresi üzerinden ulaşabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
